<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Transaction;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            ['date'=>now()->subDays(3)->toDateString(),'description'=>'Honorários - Processo 2025/001-CIV','category'=>'Honorários','account'=>'Corrente','value'=>3500.00,'type'=>'Receita'],
            ['date'=>now()->subDays(1)->toDateString(),'description'=>'Assinatura PJe','category'=>'SaaS','account'=>'Cartão','value'=>99.90,'type'=>'Despesa'],
        ];
        foreach ($items as $i) Transaction::create($i);
    }
}
