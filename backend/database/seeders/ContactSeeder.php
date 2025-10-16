<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Contact;
use App\Models\User;

class ContactSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::first();
        $contacts = [
            [
                'name'=>'Empresa Alpha Ltda',
                'document'=>'12.345.678/0001-00',
                'origin'=>'Ads',
                'status'=>'Lead',
                'email'=>'contato@alpha.com',
                'phone'=>'(11)98765-4321',
                'profession'=>'Indústria',
                'owner_id'=>$owner?->id
            ],
            [
                'name'=>'Beatriz Costa',
                'document'=>'123.456.789-01',
                'origin'=>'Orgânico',
                'status'=>'Cliente',
                'email'=>'beatriz@example.com',
                'phone'=>'(21)91234-5678',
                'profession'=>'Designer',
                'owner_id'=>$owner?->id
            ],
            [
                'name'=>'Ricardo Neves',
                'document'=>'987.654.321-09',
                'origin'=>'Indicação',
                'status'=>'Cliente',
                'email'=>'ricardo@example.com',
                'phone'=>'(31)95555-4444',
                'profession'=>'Engenheiro',
                'owner_id'=>$owner?->id
            ],
        ];
        foreach ($contacts as $c) {
            Contact::updateOrCreate(['document'=>$c['document']], $c);
        }
    }
}
