<?php

namespace Database\Seeders;

use App\Models\CalendarEvent;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;

class CalendarEventSeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = Tenant::where('slug', 'default')->value('id') ?? Tenant::value('id');
        $user = User::where('tenant_id', $tenantId)->first();

        if (!$tenantId || !$user) {
            return;
        }

        $events = [
            [
                'title' => 'Audiência 1ª Vara',
                'start' => now()->addDays(3),
                'end' => now()->addDays(3)->addHours(1),
                'color' => '#2563eb',
            ],
            [
                'title' => 'Reunião de equipe',
                'start' => now()->addDays(1)->setTime(9, 0),
                'end' => now()->addDays(1)->setTime(10, 0),
                'color' => '#16a34a',
            ],
        ];

        foreach ($events as $event) {
            CalendarEvent::create(array_merge($event, [
                'tenant_id' => $tenantId,
                'user_id' => $user->id,
            ]));
        }
    }
}
