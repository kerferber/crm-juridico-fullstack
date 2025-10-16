<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Task;
use App\Models\User;
use App\Models\Lawsuit;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::first();
        $lawsuit = Lawsuit::first();

        $tasks = [
            ['title'=>'Revisar documentos do cliente','status'=>'Pendente','due_date'=>now()->addDays(2)->toDateString(),'deadline'=>now()->addDays(3)->toDateString(),'score'=>10,'responsible_id'=>$user?->id,'lawsuit_id'=>$lawsuit?->id],
            ['title'=>'Protocolar petição inicial','status'=>'Pendente','due_date'=>now()->addDays(5)->toDateString(),'deadline'=>now()->addDays(6)->toDateString(),'score'=>20,'responsible_id'=>$user?->id,'lawsuit_id'=>$lawsuit?->id],
            ['title'=>'Agendar audiência','status'=>'Atrasada','due_date'=>now()->subDays(1)->toDateString(),'deadline'=>now()->subDays(1)->toDateString(),'score'=>15,'responsible_id'=>$user?->id,'lawsuit_id'=>$lawsuit?->id],
        ];
        foreach ($tasks as $t) Task::create($t);
    }
}
