<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Lawsuit;
use App\Models\Contact;
use App\Models\User;
use Illuminate\Support\Carbon;

class LawsuitSeeder extends Seeder
{
    public function run(): void
    {
        $client = Contact::first();
        $resp = User::first();
        $items = [
            ['internal_number'=>'2025/001-CIV','area'=>'Cível','phase'=>'Inicial','deadline'=>now()->addDays(7)->toDateString(),'status'=>'Ativo','client_id'=>$client?->id,'responsible_id'=>$resp?->id,'kanban_column'=>'Backlog','kanban_phase'=>'Judicial'],
            ['internal_number'=>'2025/002-TRAB','area'=>'Trabalhista','phase'=>'Audiência','deadline'=>now()->addDays(14)->toDateString(),'status'=>'Ativo','client_id'=>$client?->id,'responsible_id'=>$resp?->id,'kanban_column'=>'Em Progresso','kanban_phase'=>'Judicial'],
            ['internal_number'=>'2025/003-PREV','area'=>'Previdenciário','phase':'Recurso','deadline'=>now()->addDays(21)->toDateString(),'status'=>'Ativo','client_id'=>$client?->id,'responsible_id'=>$resp?->id,'kanban_column'=>'Revisão','kanban_phase'=>'Extrajudicial'],
        ];
        foreach ($items as $it) Lawsuit::updateOrCreate(['internal_number'=>$it['internal_number']], $it);
    }
}
