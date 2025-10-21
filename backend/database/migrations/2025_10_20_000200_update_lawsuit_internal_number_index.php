<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('lawsuits')) {
            return;
        }

        if (Schema::hasColumn('lawsuits', 'tenant_id')) {
            $defaultTenantId = DB::table('tenants')->where('slug', 'default')->value('id');

            if ($defaultTenantId) {
                DB::table('lawsuits')
                    ->whereNull('tenant_id')
                    ->update(['tenant_id' => $defaultTenantId]);
            }
        }

        Schema::table('lawsuits', function (Blueprint $table) {
            $table->dropUnique('lawsuits_internal_number_unique');
        });

        Schema::table('lawsuits', function (Blueprint $table) {
            $table->unique(['tenant_id', 'internal_number'], 'lawsuits_tenant_internal_unique');
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('lawsuits')) {
            return;
        }

        Schema::table('lawsuits', function (Blueprint $table) {
            $table->dropUnique('lawsuits_tenant_internal_unique');
        });

        Schema::table('lawsuits', function (Blueprint $table) {
            $table->unique('internal_number', 'lawsuits_internal_number_unique');
        });
    }
};
