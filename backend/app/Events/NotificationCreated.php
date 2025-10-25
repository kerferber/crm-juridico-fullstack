<?php

namespace App\Events;

use App\Models\TenantNotification;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NotificationCreated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public TenantNotification $notification
    ) {
    }

    public function broadcastOn(): array
    {
        $tenantId = (int) $this->notification->tenant_id;
        $recipientChannel = "tenant.{$tenantId}.users.{$this->notification->recipient_id}";

        return [
            new PrivateChannel("tenant.{$tenantId}.notifications"),
            new PrivateChannel($recipientChannel),
        ];
    }

    public function broadcastAs(): string
    {
        return 'NotificationCreated';
    }

    public function broadcastWith(): array
    {
        $notification = $this->notification->fresh();

        return [
            'id' => $notification->id,
            'tenantId' => (int) $notification->tenant_id,
            'recipientId' => (int) $notification->recipient_id,
            'actorId' => $notification->actor_id ? (int) $notification->actor_id : null,
            'title' => $notification->title,
            'message' => $notification->message,
            'entityType' => $notification->entity_type,
            'entityId' => $notification->entity_id,
            'meta' => $notification->meta ?? (object) [],
            'isRead' => (bool) $notification->read_at,
            'createdAt' => optional($notification->created_at)->toISOString(),
        ];
    }
}
