<?php

namespace App\Events;

use App\Http\Resources\TransactionResource;
use App\Models\Transaction;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TransactionUpdated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Transaction $transaction
    ) {
    }

    public function broadcastOn(): array
    {
        $tenantId = (int) $this->transaction->tenant_id;

        return [
            new PrivateChannel("tenant.{$tenantId}.transactions"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'TransactionUpdated';
    }

    public function broadcastWith(): array
    {
        $transaction = $this->transaction->fresh();

        return TransactionResource::make($transaction)->resolve();
    }
}
