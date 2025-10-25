<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TransactionDeleted implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $tenantId,
        public int $transactionId
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("tenant.{$this->tenantId}.transactions"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'TransactionDeleted';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->transactionId,
        ];
    }
}
