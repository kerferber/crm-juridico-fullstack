<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LawsuitDeleted implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $tenantId,
        public int $lawsuitId
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("tenant.{$this->tenantId}.lawsuits"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'LawsuitDeleted';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->lawsuitId,
        ];
    }
}
