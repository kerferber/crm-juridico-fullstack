<?php

namespace Database\Seeders;

use App\Models\Lawsuit;
use App\Models\Task;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = Tenant::where('slug', 'default')->value('id') ?? Tenant::value('id');
        $responsible = User::where('tenant_id', $tenantId)->first();
        $lawsuit = Lawsuit::where('tenant_id', $tenantId)->first();

        if (!$tenantId || !$responsible) {
            return;
        }

        $tasks = [
            [
                'title' => 'Revisar documentos do cliente',
                'status' => 'Pendente',
                'due_date' => now()->addDays(2)->toDateString(),
                'deadline' => now()->addDays(3)->toDateString(),
                'score' => 10,
                'responsible_id' => $responsible->id,
                'lawsuit_id' => $lawsuit?->id,
            ],
            [
                'title' => 'Protocolar petição inicial',
                'status' => 'Pendente',
                'due_date' => now()->addDays(5)->toDateString(),
                'deadline' => now()->addDays(6)->toDateString(),
                'score' => 20,
                'responsible_id' => $responsible->id,
                'lawsuit_id' => $lawsuit?->id,
            ],
            [
                'title' => 'Agendar audiência',
                'status' => 'Atrasada',
                'due_date' => now()->subDays(1)->toDateString(),
                'deadline' => now()->subDays(1)->toDateString(),
                'score' => 15,
                'responsible_id' => $responsible->id,
                'lawsuit_id' => $lawsuit?->id,
            ],
        ];

        foreach ($tasks as $task) {
            Task::create(array_merge($task, ['tenant_id' => $tenantId]));
        }
    }
}
