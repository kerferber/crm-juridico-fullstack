<?php

namespace App\Events;

use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskCreated implements ShouldBroadcastNow
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Task $task
    ) {
    }

    public function broadcastOn(): array
    {
        $tenantId = (int) $this->task->tenant_id;

        return [
            new PrivateChannel("tenant.{$tenantId}.tasks"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'TaskCreated';
    }

    public function broadcastWith(): array
    {
        $task = $this->task->fresh(['responsible', 'lawsuit', 'client']);

        return TaskResource::make($task)->resolve();
    }
}
