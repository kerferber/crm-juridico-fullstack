<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CalendarEventResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'tenantId' => (int) $this->tenant_id,
            'userId' => $this->user_id ? (int) $this->user_id : null,
            'title' => $this->title,
            'start' => optional($this->start)->toDateTimeString(),
            'end' => optional($this->end)->toDateTimeString(),
            'color' => $this->color,
            'createdAt' => optional($this->created_at)->toISOString(),
            'updatedAt' => optional($this->updated_at)->toISOString(),
        ];
    }
}
