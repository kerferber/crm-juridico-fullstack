<?php

namespace App\Events;

use App\Http\Resources\ContactResource;
use App\Models\Contact;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ContactCreated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Contact $contact
    ) {
    }

    public function broadcastOn(): array
    {
        $tenantId = (int) $this->contact->tenant_id;

        return [
            new PrivateChannel("tenant.{$tenantId}.contacts"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'ContactCreated';
    }

    public function broadcastWith(): array
    {
        $contact = $this->contact->fresh(['owner']);

        return ContactResource::make($contact)->resolve();
    }
}
