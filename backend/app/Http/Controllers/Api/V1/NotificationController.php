<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\NotificationCreated;
use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Models\TenantNotification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);
        $user = $request->user();

        $limit = (int) $request->integer('limit', 50);
        $limit = max(1, min($limit, 200));

        $notifications = TenantNotification::forRecipient($tenantId, (int) $user->id)
            ->latest()
            ->take($limit)
            ->get();

        return NotificationResource::collection($notifications);
    }

    public function store(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);
        $actorId = $request->user()?->id;

        $payload = $request->validate([
            'recipient_id' => ['required', 'integer', 'exists:users,id'],
            'actor_id' => ['nullable', 'integer', 'exists:users,id'],
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:2000'],
            'entity_type' => ['nullable', 'string', 'max:50'],
            'entity_id' => ['nullable', 'string', 'max:255'],
            'meta' => ['nullable', 'array'],
            'created_at' => ['nullable', 'date'],
        ]);

        $recipient = User::where('tenant_id', $tenantId)->findOrFail($payload['recipient_id']);

        $actorId = $payload['actor_id'] ?? $actorId;
        if ($actorId) {
            abort_unless(
                User::where('tenant_id', $tenantId)->where('id', $actorId)->exists(),
                422,
                'O autor informado deve pertencer ao mesmo tenant.'
            );
        }

        $notification = DB::transaction(function () use ($payload, $tenantId, $actorId) {
            return TenantNotification::create([
                'tenant_id' => $tenantId,
                'recipient_id' => $payload['recipient_id'],
                'actor_id' => $actorId,
                'title' => Arr::get($payload, 'title'),
                'message' => Arr::get($payload, 'message'),
                'entity_type' => Arr::get($payload, 'entity_type'),
                'entity_id' => Arr::get($payload, 'entity_id'),
                'meta' => Arr::get($payload, 'meta'),
                'created_at' => Arr::get($payload, 'created_at'),
            ]);
        });

        $notification->loadMissing(['actor', 'recipient']);

        NotificationCreated::dispatch($notification);

        return NotificationResource::make($notification)
            ->response()
            ->setStatusCode(201);
    }

    public function markAsRead(Request $request, TenantNotification $notification)
    {
        $tenantId = $this->ensureTenantId($request);
        $userId = (int) $request->user()->id;

        abort_unless(
            (int) $notification->tenant_id === $tenantId && (int) $notification->recipient_id === $userId,
            403,
            'Você não tem permissão para atualizar esta notificação.'
        );

        if (! $notification->read_at) {
            $notification->forceFill(['read_at' => now()])->save();
        }

        return NotificationResource::make($notification->fresh());
    }

    public function markAllAsRead(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);
        $userId = (int) $request->user()->id;

        TenantNotification::forRecipient($tenantId, $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['status' => 'ok']);
    }
}
