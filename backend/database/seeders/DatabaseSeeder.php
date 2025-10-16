<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            LevelBadgeSeeder::class,
            ContactSeeder::class,
            LawsuitSeeder::class,
            TaskSeeder::class,
            CalendarEventSeeder::class,
            TransactionSeeder::class,
        ]);
    }
}
