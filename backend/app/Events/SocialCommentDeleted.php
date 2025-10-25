<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SocialCommentDeleted implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $tenantId,
        public int $postId,
        public int $commentId
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("tenant.{$this->tenantId}.social-posts"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'SocialCommentDeleted';
    }

    public function broadcastWith(): array
    {
        return [
            'postId' => $this->postId,
            'id' => $this->commentId,
        ];
    }
}
