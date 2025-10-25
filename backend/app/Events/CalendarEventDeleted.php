<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CalendarEventDeleted implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $tenantId,
        public int $eventId
    ) {
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("tenant.{$this->tenantId}.calendar-events"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'CalendarEventDeleted';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->eventId,
        ];
    }
}
