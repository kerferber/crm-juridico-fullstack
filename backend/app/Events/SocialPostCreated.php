<?php

namespace App\Events;

use App\Http\Resources\SocialPostResource;
use App\Models\SocialPost;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SocialPostCreated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(public SocialPost $post)
    {
    }

    public function broadcastOn(): array
    {
        $tenantId = (int) $this->post->tenant_id;

        return [
            new PrivateChannel("tenant.{$tenantId}.social-posts"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'SocialPostCreated';
    }

    public function broadcastWith(): array
    {
        $post = $this->post->fresh(['user', 'comments.user'])->loadCount('likes');

        return SocialPostResource::make($post)->resolve();
    }
}
