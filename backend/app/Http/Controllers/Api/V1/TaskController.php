<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\TaskCreated;
use App\Events\TaskDeleted;
use App\Events\TaskUpdated;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HandlesMentionNotifications;
use App\Http\Resources\TaskResource;
use App\Models\Contact;
use App\Models\Lawsuit;
use App\Models\Task;
use App\Models\User;
use App\Support\Mentions;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class TaskController extends Controller
{
    use HandlesMentionNotifications;

    public function index(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);

        $query = Task::with(['responsible', 'lawsuit', 'client'])
            ->where('tenant_id', $tenantId);

        if ($status = $request->input('filter.status')) {
            $query->where('status', $status);
        }

        if ($responsible = $request->input('filter.responsible_id')) {
            $query->where('responsible_id', $responsible);
        }

        if ($sort = $request->input('sort')) {
            $query->orderBy($sort);
        } else {
            $query->orderByDesc('due_date');
        }

        return TaskResource::collection($query->paginate(20));
    }

    public function store(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:255'],
            'due_date' => ['nullable', 'date'],
            'deadline' => ['nullable', 'date'],
            'score' => ['nullable', 'integer'],
            'category_id' => ['nullable', 'string', 'max:255'],
            'responsible_id' => ['nullable', 'integer'],
            'lawsuit_id' => ['nullable', 'integer'],
            'client_id' => ['nullable', 'integer'],
            'notes' => ['nullable', 'string'],
            'mentions' => ['nullable', 'array'],
        ]);

        $responsibleId = $data['responsible_id'] ?? $request->user()?->id;
        $this->ensureAssociationsBelongToTenant(
            $tenantId,
            $responsibleId,
            $data['lawsuit_id'] ?? null,
            $data['client_id'] ?? null
        );

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

        $task = Task::create([
            'tenant_id' => $tenantId,
            'title' => Arr::get($data, 'title'),
            'status' => Arr::get($data, 'status', 'Pendente'),
            'due_date' => Arr::get($data, 'due_date'),
            'deadline' => Arr::get($data, 'deadline'),
            'score' => Arr::get($data, 'score', 0),
            'category_id' => Arr::get($data, 'category_id'),
            'responsible_id' => $responsibleId,
            'lawsuit_id' => Arr::get($data, 'lawsuit_id'),
            'client_id' => Arr::get($data, 'client_id'),
            'notes' => Arr::get($data, 'notes'),
            'mentions' => $mentions,
        ]);

        $task->load(['responsible', 'lawsuit', 'client']);

        $this->notifyMentionedUsers(
            tenantId: $tenantId,
            recipients: $mentionUserIds,
            actor: $request->user(),
            entityType: 'task',
            entityId: (int) $task->id,
            entityLabel: $task->title
        );

        TaskCreated::dispatch($task);

        return TaskResource::make($task)
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $task = Task::with(['responsible', 'lawsuit', 'client'])
            ->where('tenant_id', $tenantId)
            ->findOrFail($id);

        return TaskResource::make($task);
    }

    public function update(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $task = Task::where('tenant_id', $tenantId)->findOrFail($id);

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:255'],
            'due_date' => ['nullable', 'date'],
            'deadline' => ['nullable', 'date'],
            'score' => ['nullable', 'integer'],
            'category_id' => ['nullable', 'string', 'max:255'],
            'responsible_id' => ['nullable', 'integer'],
            'lawsuit_id' => ['nullable', 'integer'],
            'client_id' => ['nullable', 'integer'],
            'notes' => ['nullable', 'string'],
            'mentions' => ['nullable', 'array'],
        ]);

        $responsibleId = $data['responsible_id'] ?? $task->responsible_id;

        $this->ensureAssociationsBelongToTenant(
            $tenantId,
            $responsibleId,
            $data['lawsuit_id'] ?? null,
            $data['client_id'] ?? null
        );

        $payload = [];

        if (array_key_exists('title', $data)) {
            $payload['title'] = $data['title'];
        }

        if (array_key_exists('status', $data)) {
            $payload['status'] = $data['status'];
        }

        if (array_key_exists('due_date', $data)) {
            $payload['due_date'] = $data['due_date'];
        }

        if (array_key_exists('deadline', $data)) {
            $payload['deadline'] = $data['deadline'];
        }

        if (array_key_exists('score', $data)) {
            $payload['score'] = $data['score'];
        }

        if (array_key_exists('category_id', $data)) {
            $payload['category_id'] = $data['category_id'];
        }

        if (array_key_exists('responsible_id', $data)) {
            $payload['responsible_id'] = $data['responsible_id'];
        }

        if (array_key_exists('lawsuit_id', $data)) {
            $payload['lawsuit_id'] = $data['lawsuit_id'];
        }

        if (array_key_exists('client_id', $data)) {
            $payload['client_id'] = $data['client_id'];
        }

        $previousMentions = collect($task->mentions ?? [])
            ->where('kind', 'user')
            ->map(fn ($mention) => (int) ($mention['id'] ?? 0))
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        if ($request->exists('notes')) {
            $payload['notes'] = Arr::get($data, 'notes');
        }

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
                    $existingMentions = $task->mentions ?? [];
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

        $task->fill($payload);
        $task->save();

        $task->load(['responsible', 'lawsuit', 'client']);

        $newRecipients = array_values(array_diff($mentionUserIds, $previousMentions));
        if (! empty($newRecipients)) {
            $this->notifyMentionedUsers(
                tenantId: $tenantId,
                recipients: $newRecipients,
                actor: $request->user(),
                entityType: 'task',
                entityId: (int) $task->id,
                entityLabel: $task->title
            );
        }

        TaskUpdated::dispatch($task);

        return TaskResource::make($task);
    }

    public function destroy(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $task = Task::where('tenant_id', $tenantId)->findOrFail($id);
        $taskId = (int) $task->id;
        $task->delete();

        TaskDeleted::dispatch($tenantId, $taskId);

        return response()->noContent();
    }

    public function updateStatus(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $task = Task::where('tenant_id', $tenantId)->findOrFail($id);

        $data = $request->validate([
            'status' => ['required', 'string', 'max:255'],
        ]);

        $task->update(['status' => $data['status']]);
        $task->load(['responsible', 'lawsuit', 'client']);

        TaskUpdated::dispatch($task);

        return TaskResource::make($task);
    }

    protected function ensureAssociationsBelongToTenant(
        int $tenantId,
        ?int $responsibleId = null,
        ?int $lawsuitId = null,
        ?int $clientId = null
    ): void {
        if ($responsibleId) {
            abort_unless(
                User::where('tenant_id', $tenantId)->where('id', $responsibleId)->exists(),
                422,
                'O responsável informado deve pertencer ao tenant.'
            );
        }

        if ($lawsuitId) {
            abort_unless(
                Lawsuit::where('tenant_id', $tenantId)->where('id', $lawsuitId)->exists(),
                422,
                'O processo informado deve pertencer ao tenant.'
            );
        }

        if ($clientId) {
            abort_unless(
                Contact::where('tenant_id', $tenantId)->where('id', $clientId)->exists(),
                422,
                'O cliente informado deve pertencer ao tenant.'
            );
        }
    }

}
