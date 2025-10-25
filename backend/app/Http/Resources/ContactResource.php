<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContactResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'tenantId' => (int) $this->tenant_id,
            'name' => $this->name,
            'document' => $this->document,
            'origin' => $this->origin,
            'status' => $this->status,
            'email' => $this->email,
            'phone' => $this->phone,
            'profession' => $this->profession,
            'owner_id' => $this->owner_id ? (int) $this->owner_id : null,
            'ownerId' => $this->owner_id ? (int) $this->owner_id : null,
            'notes' => $this->notes,
            'mentions' => $this->mentions ?? [],
            'lastInteraction' => optional($this->last_interaction)->toISOString(),
            'owner' => UserResource::make($this->whenLoaded('owner')),
        ];
    }
}
