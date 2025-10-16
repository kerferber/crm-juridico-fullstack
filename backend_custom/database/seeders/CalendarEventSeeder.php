<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CalendarEvent;
use App\Models\User;

class CalendarEventSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::first();
        $events = [
            ['title'=>'Audiência 1ª Vara','start'=>now()->addDays(3),'end'=>now()->addDays(3)->addHours(1),'color'=>'#2563eb','user_id'=>$user?->id],
            ['title'=>'Reunião de equipe','start'=>now()->addDays(1)->setTime(9,0),'end'=>now()->addDays(1)->setTime(10,0),'color'=>'#16a34a','user_id'=>$user?->id],
        ];
        foreach ($events as $e) CalendarEvent::create($e);
    }
}
