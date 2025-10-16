<?php

namespace App\Observers;

use App\Models\Task;

class TaskObserver
{
    public function updated(Task $task): void
    {
        if ($task->isDirty('status') && $task->status === 'Concluída' && $task->score > 0) {
            // Here you could create a 'points' ledger table; for simplicity, we just keep 'score' on task.
        }
    }
}
