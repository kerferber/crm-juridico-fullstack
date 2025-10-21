<?php

namespace Database\Seeders;

use App\Models\Contact;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;

class ContactSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::first();
        $tenantId = $owner?->tenant_id
            ?? Tenant::where('slug', 'default')->value('id')
            ?? Tenant::value('id');

        if (!$tenantId) {
            return;
        }

        $contacts = [
            [
                'name' => 'Empresa Alpha Ltda',
                'document' => '12.345.678/0001-00',
                'origin' => 'Ads',
                'status' => 'Lead',
                'email' => 'contato@alpha.com',
                'phone' => '(11)98765-4321',
                'profession' => 'Indústria',
            ],
            [
                'name' => 'Beatriz Costa',
                'document' => '123.456.789-01',
                'origin' => 'Orgânico',
                'status' => 'Cliente',
                'email' => 'beatriz@example.com',
                'phone' => '(21)91234-5678',
                'profession' => 'Designer',
            ],
            [
                'name' => 'Ricardo Neves',
                'document' => '987.654.321-09',
                'origin' => 'Indicação',
                'status' => 'Cliente',
                'email' => 'ricardo@example.com',
                'phone' => '(31)95555-4444',
                'profession' => 'Engenheiro',
            ],
        ];

        foreach ($contacts as $contact) {
            Contact::updateOrCreate(
                ['document' => $contact['document'], 'tenant_id' => $tenantId],
                array_merge($contact, [
                    'tenant_id' => $tenantId,
                    'owner_id' => $owner?->id,
                ])
            );
        }
    }
}
