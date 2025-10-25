<?php

namespace App\Events;

use App\Http\Resources\CalendarEventResource;
use App\Models\CalendarEvent;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CalendarEventUpdated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public CalendarEvent $event
    ) {
    }

    public function broadcastOn(): array
    {
        $tenantId = (int) $this->event->tenant_id;

        return [
            new PrivateChannel("tenant.{$tenantId}.calendar-events"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'CalendarEventUpdated';
    }

    public function broadcastWith(): array
    {
        $event = $this->event->fresh();

        return CalendarEventResource::make($event)->resolve();
    }
}
