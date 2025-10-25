<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SocialCommentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) $this->id,
            'tenantId' => (int) $this->tenant_id,
            'postId' => (int) $this->post_id,
            'userId' => (int) $this->user_id,
            'body' => $this->body,
            'createdAt' => optional($this->created_at)->toISOString(),
            'updatedAt' => optional($this->updated_at)->toISOString(),
            'user' => UserResource::make($this->whenLoaded('user')),
            'mentions' => $this->mentions ?? [],
        ];
    }
}
