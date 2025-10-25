<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\LawsuitCreated;
use App\Events\LawsuitDeleted;
use App\Events\LawsuitUpdated;
use App\Http\Controllers\Concerns\HandlesMentionNotifications;
use App\Http\Controllers\Controller;
use App\Http\Resources\LawsuitResource;
use App\Models\Contact;
use App\Models\Lawsuit;
use App\Models\User;
use App\Support\Mentions;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;

class LawsuitController extends Controller
{
    use HandlesMentionNotifications;

    public function index(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);

        $query = Lawsuit::with(['client', 'responsible'])
            ->where('tenant_id', $tenantId);

        if ($area = $request->input('filter.area')) {
            $query->where('area', $area);
        }

        if ($status = $request->input('filter.status')) {
            $query->where('status', $status);
        }

        if ($phase = $request->input('filter.kanban_phase')) {
            $query->where('kanban_phase', $phase);
        }

        if ($sort = $request->input('sort')) {
            $query->orderBy($sort);
        } else {
            $query->latest();
        }

        return LawsuitResource::collection($query->paginate(20));
    }

    public function store(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);

        $data = $request->validate([
            'internal_number' => [
                'required',
                'string',
                Rule::unique('lawsuits', 'internal_number')->where('tenant_id', $tenantId),
            ],
            'area' => ['required', 'string'],
            'phase' => ['nullable', 'string'],
            'deadline' => ['nullable', 'date'],
            'status' => ['required', 'string'],
            'client_id' => ['required', 'integer'],
            'responsible_id' => ['nullable', 'integer'],
            'kanban_column' => ['nullable', 'string'],
            'kanban_phase' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'mentions' => ['nullable', 'array'],
        ]);

        $client = Contact::where('tenant_id', $tenantId)->findOrFail($data['client_id']);
        $responsible = null;
        if (! empty($data['responsible_id'])) {
            $responsible = User::where('tenant_id', $tenantId)->findOrFail($data['responsible_id']);
        }

        $mentionsPayload = Mentions::parse($tenantId, $request->input('mentions', []));
        $mentions = $mentionsPayload['mentions'];
        $mentionUserIds = $mentionsPayload['user_ids'];

        if ($responsible && ! in_array((int) $responsible->id, $mentionUserIds, true)) {
            $mentions[] = [
                'id' => (int) $responsible->id,
                'kind' => 'user',
                'label' => $responsible->name,
            ];
            $mentionUserIds[] = (int) $responsible->id;
        }

        $lawsuit = Lawsuit::create([
            'tenant_id' => $tenantId,
            'internal_number' => $data['internal_number'],
            'area' => $data['area'],
            'phase' => Arr::get($data, 'phase'),
            'deadline' => Arr::get($data, 'deadline'),
            'status' => $data['status'],
            'client_id' => $client->id,
            'responsible_id' => $responsible?->id,
            'kanban_column' => Arr::get($data, 'kanban_column'),
            'kanban_phase' => Arr::get($data, 'kanban_phase'),
            'notes' => Arr::get($data, 'notes'),
            'mentions' => $mentions,
        ]);

        $lawsuit->load(['client', 'responsible']);

        $this->notifyMentionedUsers(
            tenantId: $tenantId,
            recipients: $mentionUserIds,
            actor: $request->user(),
            entityType: 'lawsuit',
            entityId: (int) $lawsuit->id,
            entityLabel: $lawsuit->internal_number
        );

        LawsuitCreated::dispatch($lawsuit);

        return LawsuitResource::make($lawsuit)
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $lawsuit = Lawsuit::with(['client', 'responsible', 'tasks'])
            ->where('tenant_id', $tenantId)
            ->findOrFail($id);

        return LawsuitResource::make($lawsuit);
    }

    public function update(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $lawsuit = Lawsuit::where('tenant_id', $tenantId)->findOrFail($id);

        $data = $request->validate([
            'internal_number' => [
                'sometimes',
                'required',
                'string',
                Rule::unique('lawsuits', 'internal_number')
                    ->where('tenant_id', $tenantId)
                    ->ignore($lawsuit->id),
            ],
            'area' => ['nullable', 'string'],
            'phase' => ['nullable', 'string'],
            'deadline' => ['nullable', 'date'],
            'status' => ['nullable', 'string'],
            'client_id' => ['nullable', 'integer'],
            'responsible_id' => ['nullable', 'integer'],
            'kanban_column' => ['nullable', 'string'],
            'kanban_phase' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'mentions' => ['nullable', 'array'],
        ]);

        if (array_key_exists('client_id', $data) && $data['client_id']) {
            Contact::where('tenant_id', $tenantId)->findOrFail($data['client_id']);
        }

        $responsibleId = array_key_exists('responsible_id', $data)
            ? $data['responsible_id']
            : $lawsuit->responsible_id;

        if ($responsibleId) {
            User::where('tenant_id', $tenantId)->findOrFail($responsibleId);
        }

        $payload = [];

        foreach (['internal_number', 'area', 'phase', 'deadline', 'status', 'client_id', 'responsible_id', 'kanban_column', 'kanban_phase'] as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = $data[$field];
            }
        }

        if ($request->exists('notes')) {
            $payload['notes'] = Arr::get($data, 'notes');
        }

        $previousMentions = collect($lawsuit->mentions ?? [])
            ->where('kind', 'user')
            ->map(fn ($mention) => (int) ($mention['id'] ?? 0))
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        $mentionUserIds = $previousMentions;
        if ($request->exists('mentions')) {
            $mentionsPayload = Mentions::parse($tenantId, $request->input('mentions', []));
            $mentions = $mentionsPayload['mentions'];
            $mentionUserIds = $mentionsPayload['user_ids'];

            if ($responsibleId && ! in_array((int) $responsibleId, $mentionUserIds, true)) {
                $responsible = User::where('tenant_id', $tenantId)->find($responsibleId);
                if ($responsible) {
                    $mentions[] = [
                        'id' => (int) $responsible->id,
                        'kind' => 'user',
                        'label' => $responsible->name,
                    ];
                    $mentionUserIds[] = (int) $responsible->id;
                }
            }

            $payload['mentions'] = $mentions;
        } elseif (array_key_exists('responsible_id', $data) && $responsibleId) {
            if (! in_array((int) $responsibleId, $previousMentions, true)) {
                $responsible = User::where('tenant_id', $tenantId)->find($responsibleId);
                if ($responsible) {
                    $existingMentions = $lawsuit->mentions ?? [];
                    $existingMentions[] = [
                        'id' => (int) $responsible->id,
                        'kind' => 'user',
                        'label' => $responsible->name,
                    ];
                    $payload['mentions'] = $existingMentions;
                    $mentionUserIds[] = (int) $responsible->id;
                }
            }
        }

        $mentionUserIds = array_values(array_unique(array_map('intval', $mentionUserIds)));

        $lawsuit->fill($payload);
        $lawsuit->save();

        $lawsuit->load(['client', 'responsible']);

        $newRecipients = array_values(array_diff($mentionUserIds, $previousMentions));
        if (! empty($newRecipients)) {
            $this->notifyMentionedUsers(
                tenantId: $tenantId,
                recipients: $newRecipients,
                actor: $request->user(),
                entityType: 'lawsuit',
                entityId: (int) $lawsuit->id,
                entityLabel: $lawsuit->internal_number
            );
        }

        LawsuitUpdated::dispatch($lawsuit);

        return LawsuitResource::make($lawsuit);
    }

    public function destroy(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $lawsuit = Lawsuit::where('tenant_id', $tenantId)->findOrFail($id);
        $lawsuitId = (int) $lawsuit->id;
        $lawsuit->delete();

        LawsuitDeleted::dispatch($tenantId, $lawsuitId);

        return response()->noContent();
    }

    public function updateKanban(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $lawsuit = Lawsuit::where('tenant_id', $tenantId)->findOrFail($id);

        $data = $request->validate([
            'kanban_column' => ['required', 'string'],
            'kanban_phase' => ['required', 'string'],
        ]);

        $lawsuit->update($data);
        $lawsuit->load(['client', 'responsible']);

        LawsuitUpdated::dispatch($lawsuit);

        return LawsuitResource::make($lawsuit);
    }
}
