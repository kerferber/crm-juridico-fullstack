<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Level;
use App\Models\Badge;

class LevelBadgeSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [
            ['id'=>1,'name'=>'Iniciante','threshold'=>0],
            ['id'=>2,'name'=>'Bronze','threshold'=>100],
            ['id'=>3,'name'=>'Prata','threshold'=>300],
            ['id'=>4,'name'=>'Ouro','threshold'=>700],
            ['id'=>5,'name'=>'Diamante','threshold'=>1200],
        ];
        foreach ($levels as $lvl) Level::updateOrCreate(['id'=>$lvl['id']], $lvl);

        $badges = [
            ['id'=>1,'name'=>'Primeira Tarefa','icon'=>'Award','description'=>'Conclua a primeira tarefa','type'=>'task','threshold'=>1],
            ['id'=>2,'name'=>'Mestre dos Prazos','icon'=>'Target','description'=>'Conclua 10 tarefas no prazo','type'=>'task','threshold'=>10],
            ['id'=>3,'name'=>'Cível Pro','icon'=>'Scale','description'=>'5 processos cíveis ativos','type'=>'area','threshold'=>5,'area'=>'Cível'],
            ['id'=>4,'name'=>'Previd Expert','icon'=>'Shield','description'=>'5 processos previdenciários ativos','type'=>'area','threshold'=>5,'area'=>'Previdenciário'],
        ];
        foreach ($badges as $b) Badge::updateOrCreate(['id'=>$b['id']], $b);
    }
}
