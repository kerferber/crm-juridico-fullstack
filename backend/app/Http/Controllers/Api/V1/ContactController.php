<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\ContactCreated;
use App\Events\ContactDeleted;
use App\Events\ContactUpdated;
use App\Http\Controllers\Concerns\HandlesMentionNotifications;
use App\Http\Controllers\Controller;
use App\Http\Resources\ContactResource;
use App\Models\Contact;
use App\Models\User;
use App\Support\Mentions;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class ContactController extends Controller
{
    use HandlesMentionNotifications;

    public function index(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);

        $query = Contact::with(['owner'])
            ->where('tenant_id', $tenantId);

        if ($status = $request->input('filter.status')) {
            $query->where('status', $status);
        }

        if ($owner = $request->input('filter.owner_id')) {
            $query->where('owner_id', $owner);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($qr) use ($search) {
                $qr->where('name', 'like', "%$search%")
                    ->orWhere('email', 'like', "%$search%");
            });
        }

        if ($sort = $request->input('sort')) {
            $query->orderBy($sort);
        } else {
            $query->orderByDesc('created_at');
        }

        return ContactResource::collection($query->paginate(20));
    }

    public function store(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'document' => ['nullable', 'string', 'max:255'],
            'origin' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'profession' => ['nullable', 'string', 'max:255'],
            'owner_id' => ['nullable', 'integer'],
            'last_interaction' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'mentions' => ['nullable', 'array'],
        ]);

        $ownerId = $data['owner_id'] ?? $request->user()?->id;
        $owner = $ownerId ? User::where('tenant_id', $tenantId)->findOrFail($ownerId) : null;

        $mentionsPayload = Mentions::parse($tenantId, $request->input('mentions', []));
        $mentions = $mentionsPayload['mentions'];
        $mentionUserIds = $mentionsPayload['user_ids'];

        $contact = Contact::create([
            'tenant_id' => $tenantId,
            'name' => $data['name'],
            'document' => Arr::get($data, 'document'),
            'origin' => Arr::get($data, 'origin'),
            'status' => $data['status'],
            'email' => Arr::get($data, 'email'),
            'phone' => Arr::get($data, 'phone'),
            'profession' => Arr::get($data, 'profession'),
            'owner_id' => $owner?->id,
            'last_interaction' => Arr::get($data, 'last_interaction'),
            'notes' => Arr::get($data, 'notes'),
            'mentions' => $mentions,
        ]);

        $contact->load(['owner']);

        if (! empty($mentionUserIds)) {
            $this->notifyMentionedUsers(
                tenantId: $tenantId,
                recipients: $mentionUserIds,
                actor: $request->user(),
                entityType: 'contact',
                entityId: (int) $contact->id,
                entityLabel: $contact->name
            );
        }

        ContactCreated::dispatch($contact);

        return ContactResource::make($contact)
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $contact = Contact::with(['owner', 'lawsuits'])
            ->where('tenant_id', $tenantId)
            ->findOrFail($id);

        return ContactResource::make($contact);
    }

    public function update(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $contact = Contact::where('tenant_id', $tenantId)->findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'document' => ['nullable', 'string', 'max:255'],
            'origin' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'profession' => ['nullable', 'string', 'max:255'],
            'owner_id' => ['nullable', 'integer'],
            'last_interaction' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'mentions' => ['nullable', 'array'],
        ]);

        if (array_key_exists('owner_id', $data) && $data['owner_id']) {
            User::where('tenant_id', $tenantId)->findOrFail($data['owner_id']);
        }

        $payload = [];
        foreach (['name', 'document', 'origin', 'status', 'email', 'phone', 'profession', 'owner_id', 'last_interaction'] as $field) {
            if (array_key_exists($field, $data)) {
                $payload[$field] = $data[$field];
            }
        }

        if ($request->exists('notes')) {
            $payload['notes'] = Arr::get($data, 'notes');
        }

        $previousMentions = collect($contact->mentions ?? [])
            ->where('kind', 'user')
            ->map(fn ($mention) => (int) ($mention['id'] ?? 0))
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();

        $mentionUserIds = $previousMentions;
        if ($request->exists('mentions')) {
            $mentionsPayload = Mentions::parse($tenantId, $request->input('mentions', []));
            $payload['mentions'] = $mentionsPayload['mentions'];
            $mentionUserIds = $mentionsPayload['user_ids'];
        }

        $mentionUserIds = array_values(array_unique(array_map('intval', $mentionUserIds)));

        $contact->fill($payload);
        $contact->save();

        $contact->load(['owner']);

        $newRecipients = array_values(array_diff($mentionUserIds, $previousMentions));
        if (! empty($newRecipients)) {
            $this->notifyMentionedUsers(
                tenantId: $tenantId,
                recipients: $newRecipients,
                actor: $request->user(),
                entityType: 'contact',
                entityId: (int) $contact->id,
                entityLabel: $contact->name
            );
        }

        ContactUpdated::dispatch($contact);

        return ContactResource::make($contact);
    }

    public function destroy(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $contact = Contact::where('tenant_id', $tenantId)->findOrFail($id);
        $contactId = (int) $contact->id;
        $contact->delete();

        ContactDeleted::dispatch($tenantId, $contactId);

        return response()->noContent();
    }
}
