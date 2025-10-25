<?php

namespace App\Events;

use App\Http\Resources\LawsuitResource;
use App\Models\Lawsuit;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LawsuitUpdated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Lawsuit $lawsuit
    ) {
    }

    public function broadcastOn(): array
    {
        $tenantId = (int) $this->lawsuit->tenant_id;

        return [
            new PrivateChannel("tenant.{$tenantId}.lawsuits"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'LawsuitUpdated';
    }

    public function broadcastWith(): array
    {
        $lawsuit = $this->lawsuit->fresh(['client', 'responsible']);

        return LawsuitResource::make($lawsuit)->resolve();
    }
}
