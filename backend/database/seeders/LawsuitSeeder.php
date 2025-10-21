<?php

namespace Database\Seeders;

use App\Models\Contact;
use App\Models\Lawsuit;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;

class LawsuitSeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = Tenant::where('slug', 'default')->value('id') ?? Tenant::value('id');
        $client = Contact::where('tenant_id', $tenantId)->first();
        $responsible = User::where('tenant_id', $tenantId)->first();

        if (!$tenantId || !$client) {
            return;
        }

        $items = [
            [
                'internal_number' => '2025/001-CIV',
                'area' => 'Cível',
                'phase' => 'Inicial',
                'deadline' => now()->addDays(7)->toDateString(),
                'status' => 'Ativo',
                'client_id' => $client->id,
                'responsible_id' => $responsible?->id,
                'kanban_column' => 'Backlog',
                'kanban_phase' => 'Judicial',
            ],
            [
                'internal_number' => '2025/002-TRAB',
                'area' => 'Trabalhista',
                'phase' => 'Audiência',
                'deadline' => now()->addDays(14)->toDateString(),
                'status' => 'Ativo',
                'client_id' => $client->id,
                'responsible_id' => $responsible?->id,
                'kanban_column' => 'Em Progresso',
                'kanban_phase' => 'Judicial',
            ],
            [
                'internal_number' => '2025/003-PREV',
                'area' => 'Previdenciário',
                'phase' => 'Recurso',
                'deadline' => now()->addDays(21)->toDateString(),
                'status' => 'Ativo',
                'client_id' => $client->id,
                'responsible_id' => $responsible?->id,
                'kanban_column' => 'Revisão',
                'kanban_phase' => 'Extrajudicial',
            ],
        ];

        foreach ($items as $item) {
            Lawsuit::updateOrCreate(
                ['internal_number' => $item['internal_number'], 'tenant_id' => $tenantId],
                array_merge($item, ['tenant_id' => $tenantId])
            );
        }
    }
}
