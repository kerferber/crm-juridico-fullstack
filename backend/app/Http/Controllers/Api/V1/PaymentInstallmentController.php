<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PaymentInstallment;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentInstallmentController extends Controller
{
    public function markPaid(Request $request, PaymentInstallment $paymentInstallment): JsonResponse
    {
        $tenantId = $this->ensureTenantId($request);
        $installment = $this->resolveInstallment($paymentInstallment, $tenantId);

        abort_if($installment->status === 'paid', 422, 'Esta parcela já está marcada como paga.');

        $data = $request->validate([
            'paid_at' => ['nullable', 'date'],
            'description' => ['nullable', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'account' => ['nullable', 'string', 'max:255'],
        ]);

        $schedule = $installment->schedule()->with('contact')->first();

        $paidAt = $data['paid_at'] ?? now()->toDateString();
        $description = $data['description']
            ?? sprintf(
                'Recebimento parcela #%d - %s',
                $installment->sequence,
                $schedule?->contact?->name ?? 'Cliente'
            );

        $transaction = DB::transaction(function () use ($installment, $tenantId, $paidAt, $description, $data) {
            $transaction = Transaction::create([
                'tenant_id' => $tenantId,
                'date' => $paidAt,
                'description' => $description,
                'category' => $data['category'] ?? 'Receitas recorrentes',
                'account' => $data['account'] ?? 'Contas a receber',
                'value' => $installment->amount,
                'type' => 'Receita',
            ]);

            $installment->status = 'paid';
            $installment->paid_at = $paidAt;
            $installment->transaction_id = $transaction->id;
            $installment->save();

            return $transaction;
        });

        $installment->refresh();

        $controller = new PaymentScheduleController();

        return response()->json([
            'installment' => $controller->transformInstallment($installment),
            'transaction' => [
                'id' => $transaction->id,
                'tenant_id' => $transaction->tenant_id,
                'date' => optional($transaction->date)->toDateString(),
                'description' => $transaction->description,
                'category' => $transaction->category,
                'account' => $transaction->account,
                'value' => (float) $transaction->value,
                'type' => $transaction->type,
                'created_at' => optional($transaction->created_at)->toIso8601String(),
                'updated_at' => optional($transaction->updated_at)->toIso8601String(),
            ],
        ]);
    }

    protected function resolveInstallment(PaymentInstallment $installment, int $tenantId): PaymentInstallment
    {
        abort_if($installment->schedule?->tenant_id !== $tenantId, 404);

        return $installment;
    }
}
