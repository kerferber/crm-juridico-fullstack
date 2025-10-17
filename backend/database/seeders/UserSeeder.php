<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(['email' => 'fernandokerber@gmail.com'], [
            'name' => 'Admin',
            'password' => Hash::make('admin123'),
            'avatar' => 'https://i.pravatar.cc/150?img=1',
            'job_title' => 'Administrador Jurídico',
            'personal_email' => 'fernandokerber@gmail.com',
            'phone' => '+55 11 99999-5555',
            'whatsapp' => '+55 11 99999-5555',
            'address' => 'Av. Paulista, 1000',
            'city' => 'São Paulo',
            'state' => 'SP',
            'postal_code' => '01310-100',
            'birthdate' => '1990-01-10',
            'linkedin_url' => 'https://www.linkedin.com/in/fernandokerber',
            'bio' => 'Responsável pela coordenação estratégica do CRM Jurídico e pela integração entre times.',
        ]);

        User::factory()->count(3)->create();
    }
}
