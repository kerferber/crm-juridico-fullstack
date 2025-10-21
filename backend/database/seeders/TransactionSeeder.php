<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\Transaction;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = Tenant::where('slug', 'default')->value('id') ?? Tenant::value('id');

        if (!$tenantId) {
            return;
        }

        $items = [
            [
                'date' => now()->subDays(3)->toDateString(),
                'description' => 'Honorários - Processo 2025/001-CIV',
                'category' => 'Honorários',
                'account' => 'Corrente',
                'value' => 3500.00,
                'type' => 'Receita',
            ],
            [
                'date' => now()->subDays(1)->toDateString(),
                'description' => 'Assinatura PJe',
                'category' => 'SaaS',
                'account' => 'Cartão',
                'value' => 99.90,
                'type' => 'Despesa',
            ],
        ];

        foreach ($items as $item) {
            Transaction::create(array_merge($item, ['tenant_id' => $tenantId]));
        }
    }
}
