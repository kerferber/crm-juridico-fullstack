<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\PaymentInstallment;
use App\Models\PaymentSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PaymentScheduleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $this->ensureTenantId($request);

        $query = PaymentSchedule::query()
            ->with(['installments' => function ($relation) {
                $relation->orderBy('sequence');
            }, 'contact'])
            ->where('tenant_id', $tenantId)
            ->orderByDesc('created_at');

        if ($request->filled('contact_id')) {
            $query->where('contact_id', (int) $request->input('contact_id'));
        }

        $schedules = $query->get()->map(fn (PaymentSchedule $schedule) => $this->transformSchedule($schedule));

        return response()->json($schedules);
    }

    public function show(Request $request, PaymentSchedule $paymentSchedule): JsonResponse
    {
        $tenantId = $this->ensureTenantId($request);
        $schedule = $this->resolveSchedule($paymentSchedule, $tenantId);

        $schedule->load(['installments' => function ($relation) {
            $relation->orderBy('sequence');
        }, 'contact']);

        return response()->json($this->transformSchedule($schedule));
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId = $this->ensureTenantId($request);

        $data = $request->validate([
            'contact_id' => ['required', 'integer'],
            'title' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'total_amount' => ['required', 'numeric', 'min:0.01'],
            'installments_count' => ['required', 'integer', 'min:1', 'max:240'],
            'installment_amount' => ['required', 'numeric', 'min:0.01'],
            'first_due_date' => ['nullable', 'date'],
            'installments' => ['required', 'array', 'min:1'],
            'installments.*.due_date' => ['required', 'date'],
            'installments.*.amount' => ['required', 'numeric', 'min:0.01'],
        ]);

        /** @var Contact $contact */
        $contact = Contact::query()
            ->where('tenant_id', $tenantId)
            ->findOrFail($data['contact_id']);

        $schedule = DB::transaction(function () use ($data, $tenantId, $contact) {
            $schedule = PaymentSchedule::create([
                'tenant_id' => $tenantId,
                'contact_id' => $contact->id,
                'title' => $data['title'] ?? null,
                'notes' => $data['notes'] ?? null,
                'total_amount' => $data['total_amount'],
                'installments_count' => $data['installments_count'],
                'installment_amount' => $data['installment_amount'],
                'first_due_date' => $data['first_due_date'] ?? null,
            ]);

            $installmentsPayload = collect($data['installments'])
                ->values()
                ->map(function (array $installment, int $index) use ($schedule) {
                    return [
                        'payment_schedule_id' => $schedule->id,
                        'sequence' => $index + 1,
                        'due_date' => $installment['due_date'],
                        'amount' => $installment['amount'],
                        'status' => 'pending',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                })
                ->all();

            PaymentInstallment::insert($installmentsPayload);

            return $schedule;
        });

        $schedule->load(['installments' => function ($relation) {
            $relation->orderBy('sequence');
        }, 'contact']);

        return response()->json($this->transformSchedule($schedule), 201);
    }

    public function update(Request $request, PaymentSchedule $paymentSchedule): JsonResponse
    {
        $tenantId = $this->ensureTenantId($request);
        $schedule = $this->resolveSchedule($paymentSchedule, $tenantId);

        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'total_amount' => ['nullable', 'numeric', 'min:0.01'],
            'installments_count' => ['nullable', 'integer', 'min:1', 'max:240'],
            'installment_amount' => ['nullable', 'numeric', 'min:0.01'],
            'first_due_date' => ['nullable', 'date'],
            'installments' => ['nullable', 'array', 'min:1'],
            'installments.*.id' => ['nullable', 'integer', 'exists:payment_installments,id'],
            'installments.*.due_date' => ['required_with:installments', 'date'],
            'installments.*.amount' => ['required_with:installments', 'numeric', 'min:0.01'],
            'installments.*.status' => ['nullable', Rule::in(['pending', 'paid'])],
            'installments.*.paid_at' => ['nullable', 'date'],
        ]);

        DB::transaction(function () use ($schedule, $data) {
            $schedule->fill([
                'title' => $data['title'] ?? $schedule->title,
                'notes' => $data['notes'] ?? $schedule->notes,
                'total_amount' => $data['total_amount'] ?? $schedule->total_amount,
                'installments_count' => $data['installments_count'] ?? $schedule->installments_count,
                'installment_amount' => $data['installment_amount'] ?? $schedule->installment_amount,
                'first_due_date' => $data['first_due_date'] ?? $schedule->first_due_date,
            ]);
            $schedule->save();

            if (isset($data['installments'])) {
                $incoming = collect($data['installments'])->values();
                $knownIds = $incoming->pluck('id')->filter()->map(fn ($value) => (int) $value)->all();

                // Remove installments not present in payload
                PaymentInstallment::where('payment_schedule_id', $schedule->id)
                    ->when(!empty($knownIds), fn ($query) => $query->whereNotIn('id', $knownIds))
                    ->delete();

                foreach ($incoming as $index => $installmentData) {
                    $sequence = $index + 1;
                    PaymentInstallment::updateOrCreate(
                        [
                            'id' => $installmentData['id'] ?? null,
                            'payment_schedule_id' => $schedule->id,
                        ],
                        [
                            'sequence' => $sequence,
                            'due_date' => $installmentData['due_date'],
                            'amount' => $installmentData['amount'],
                            'status' => $installmentData['status'] ?? 'pending',
                            'paid_at' => $installmentData['paid_at'] ?? null,
                        ]
                    );
                }
            }
        });

        $schedule->load(['installments' => function ($relation) {
            $relation->orderBy('sequence');
        }, 'contact']);

        return response()->json($this->transformSchedule($schedule));
    }

    public function destroy(Request $request, PaymentSchedule $paymentSchedule): JsonResponse
    {
        $tenantId = $this->ensureTenantId($request);
        $schedule = $this->resolveSchedule($paymentSchedule, $tenantId);

        $schedule->delete();

        return response()->json(null, 204);
    }

    protected function resolveSchedule(PaymentSchedule $schedule, int $tenantId): PaymentSchedule
    {
        abort_if($schedule->tenant_id !== $tenantId, 404);

        return $schedule;
    }

    protected function transformSchedule(PaymentSchedule $schedule): array
    {
        return [
            'id' => $schedule->id,
            'tenant_id' => $schedule->tenant_id,
            'contact_id' => $schedule->contact_id,
            'title' => $schedule->title,
            'notes' => $schedule->notes,
            'total_amount' => (float) $schedule->total_amount,
            'installments_count' => (int) $schedule->installments_count,
            'installment_amount' => (float) $schedule->installment_amount,
            'first_due_date' => optional($schedule->first_due_date)->toDateString(),
            'created_at' => optional($schedule->created_at)->toIso8601String(),
            'updated_at' => optional($schedule->updated_at)->toIso8601String(),
            'contact' => $schedule->relationLoaded('contact') && $schedule->contact
                ? [
                    'id' => $schedule->contact->id,
                    'name' => $schedule->contact->name,
                    'email' => $schedule->contact->email,
                    'phone' => $schedule->contact->phone,
                ]
                : null,
            'installments' => $schedule->relationLoaded('installments')
                ? $schedule->installments->map(fn (PaymentInstallment $installment) => $this->transformInstallment($installment))->all()
                : [],
        ];
    }

    public function transformInstallment(PaymentInstallment $installment): array
    {
        return [
            'id' => $installment->id,
            'payment_schedule_id' => $installment->payment_schedule_id,
            'sequence' => (int) $installment->sequence,
            'due_date' => optional($installment->due_date)->toDateString(),
            'amount' => (float) $installment->amount,
            'status' => $installment->status,
            'paid_at' => optional($installment->paid_at)->toDateString(),
            'transaction_id' => $installment->transaction_id,
            'created_at' => optional($installment->created_at)->toIso8601String(),
            'updated_at' => optional($installment->updated_at)->toIso8601String(),
        ];
    }
}
