<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(['email'=>'admin@example.com'],[
            'name' => 'Admin',
            'password' => Hash::make('password'),
            'avatar' => 'https://i.pravatar.cc/150?img=1'
        ]);

        User::factory()->count(3)->create();
    }
}
