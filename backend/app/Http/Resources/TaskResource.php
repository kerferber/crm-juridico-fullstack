<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $dueDate = optional($this->due_date)->toDateString();
        $deadline = optional($this->deadline)->toDateString();

        return [
            'id' => (int) $this->id,
            'tenantId' => (int) $this->tenant_id,
            'title' => $this->title,
            'status' => $this->status,
            'score' => (int) $this->score,
            'category_id' => $this->category_id,
            'categoryId' => $this->category_id,
            'due_date' => $dueDate,
            'dueDate' => $dueDate,
            'deadline' => $deadline,
            'responsible_id' => $this->responsible_id ? (int) $this->responsible_id : null,
            'responsibleId' => $this->responsible_id ? (int) $this->responsible_id : null,
            'lawsuit_id' => $this->lawsuit_id ? (int) $this->lawsuit_id : null,
            'lawsuitId' => $this->lawsuit_id ? (int) $this->lawsuit_id : null,
            'client_id' => $this->client_id ? (int) $this->client_id : null,
            'clientId' => $this->client_id ? (int) $this->client_id : null,
            'notes' => $this->notes,
            'mentions' => $this->mentions ?? [],
            'computed_status' => $this->when(isset($this->computed_status), $this->computed_status),
            'computedStatus' => $this->when(isset($this->computed_status), $this->computed_status),
            'createdAt' => optional($this->created_at)->toISOString(),
            'updatedAt' => optional($this->updated_at)->toISOString(),
            'responsible' => UserResource::make($this->whenLoaded('responsible')),
            'lawsuit' => LawsuitResource::make($this->whenLoaded('lawsuit')),
            'client' => ContactResource::make($this->whenLoaded('client')),
        ];
    }
}
