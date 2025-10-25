<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenantId' => (int) $this->tenant_id,
            'recipientId' => (int) $this->recipient_id,
            'actorId' => $this->actor_id ? (int) $this->actor_id : null,
            'title' => $this->title,
            'message' => $this->message,
            'entityType' => $this->entity_type,
            'entityId' => $this->entity_id,
            'meta' => $this->meta ?? (object) [],
            'isRead' => (bool) $this->read_at,
            'readAt' => optional($this->read_at)->toISOString(),
            'createdAt' => optional($this->created_at)->toISOString(),
        ];
    }
}
