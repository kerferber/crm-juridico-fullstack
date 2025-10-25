<?php

namespace App\Events;

use App\Http\Resources\SocialCommentResource;
use App\Models\SocialComment;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SocialCommentCreated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public SocialComment $comment
    ) {
    }

    public function broadcastOn(): array
    {
        $tenantId = (int) $this->comment->tenant_id;

        return [
            new PrivateChannel("tenant.{$tenantId}.social-posts"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'SocialCommentCreated';
    }

    public function broadcastWith(): array
    {
        $comment = $this->comment->fresh(['user']);

        return array_merge(
            SocialCommentResource::make($comment)->resolve(),
            ['postId' => (int) $comment->post_id]
        );
    }
}
