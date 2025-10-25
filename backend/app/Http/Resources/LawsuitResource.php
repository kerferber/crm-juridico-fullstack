<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LawsuitResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'tenantId' => (int) $this->tenant_id,
            'internal_number' => $this->internal_number,
            'internalNumber' => $this->internal_number,
            'status' => $this->status,
            'area' => $this->area,
            'phase' => $this->phase,
            'deadline' => optional($this->deadline)->toDateString(),
            'kanban_column' => $this->kanban_column,
            'kanbanColumn' => $this->kanban_column,
            'kanban_phase' => $this->kanban_phase,
            'kanbanPhase' => $this->kanban_phase,
            'client_id' => (int) $this->client_id,
            'clientId' => (int) $this->client_id,
            'responsible_id' => $this->responsible_id ? (int) $this->responsible_id : null,
            'responsibleId' => $this->responsible_id ? (int) $this->responsible_id : null,
            'notes' => $this->notes,
            'mentions' => $this->mentions ?? [],
            'createdAt' => optional($this->created_at)->toISOString(),
            'updatedAt' => optional($this->updated_at)->toISOString(),
            'responsible' => UserResource::make($this->whenLoaded('responsible')),
            'client' => ContactResource::make($this->whenLoaded('client')),
        ];
    }
}
