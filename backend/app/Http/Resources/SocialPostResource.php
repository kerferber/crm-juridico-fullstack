<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class SocialPostResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $imageUrl = null;
        if ($this->image_path) {
            $relativeUrl = Storage::disk('public')->url($this->image_path);
            $imageUrl = url($relativeUrl);
        }

        $likesCount = $this->likes_count ?? $this->likes()->count();
        $likedByCurrent = false;
        if ($request?->user()) {
            $likedByCurrent = (bool) ($this->liked_by_current ?? $this->likes()
                ->where('user_id', $request->user()->id)
                ->exists());
        }

        return [
            'id' => (int) $this->id,
            'tenantId' => (int) $this->tenant_id,
            'userId' => (int) $this->user_id,
            'content' => $this->content,
            'imageUrl' => $imageUrl,
            'likesCount' => (int) $likesCount,
            'isLiked' => $likedByCurrent,
            'createdAt' => optional($this->created_at)->toISOString(),
            'updatedAt' => optional($this->updated_at)->toISOString(),
            'user' => UserResource::make($this->whenLoaded('user')),
            'comments' => SocialCommentResource::collection($this->whenLoaded('comments')),
            'mentions' => $this->mentions ?? [],
        ];
    }
}
