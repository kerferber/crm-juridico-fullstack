<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tenantAwareTables = [
        'contacts',
        'lawsuits',
        'tasks',
        'calendar_events',
        'transactions',
        'badges',
        'levels',
    ];

    public function up(): void
    {
        $defaultTenantId = DB::table('tenants')->where('slug', 'default')->value('id');

        foreach ($this->tenantAwareTables as $tableName) {
            if (!Schema::hasTable($tableName) || Schema::hasColumn($tableName, 'tenant_id')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId('tenant_id')
                    ->nullable()
                    ->after('id')
                    ->constrained()
                    ->cascadeOnDelete();
            });

            if ($defaultTenantId) {
                DB::table($tableName)
                    ->whereNull('tenant_id')
                    ->update(['tenant_id' => $defaultTenantId]);
            }
        }
    }

    public function down(): void
    {
        foreach ($this->tenantAwareTables as $tableName) {
            if (!Schema::hasTable($tableName) || !Schema::hasColumn($tableName, 'tenant_id')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) {
                $table->dropConstrainedForeignId('tenant_id');
            });
        }
    }
};
