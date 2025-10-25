<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'tenantId' => (int) $this->tenant_id,
            'date' => optional($this->date)->toDateString(),
            'description' => $this->description,
            'category' => $this->category,
            'category_id' => $this->category_id ?? null,
            'categoryId' => $this->category_id ?? null,
            'account' => $this->account,
            'value' => (float) $this->value,
            'type' => $this->type,
            'createdAt' => optional($this->created_at)->toISOString(),
            'updatedAt' => optional($this->updated_at)->toISOString(),
        ];
    }
}
