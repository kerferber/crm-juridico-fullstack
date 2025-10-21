<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('status')->default('active');
            $table->json('settings')->nullable();
            $table->timestamps();
        });

        $now = now();

        $defaultTenantId = DB::table('tenants')->insertGetId([
            'name' => 'Tenant Padrão',
            'slug' => 'default',
            'status' => 'active',
            'settings' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        Schema::table('users', function (Blueprint $table) use ($defaultTenantId) {
            $table->foreignId('tenant_id')
                ->after('id')
                ->nullable()
                ->constrained()
                ->cascadeOnDelete();
        });

        DB::table('users')->whereNull('tenant_id')->update(['tenant_id' => $defaultTenantId]);

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_tenant_admin')->default(false)->after('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'is_tenant_admin')) {
                $table->dropColumn('is_tenant_admin');
            }

            if (Schema::hasColumn('users', 'tenant_id')) {
                $table->dropConstrainedForeignId('tenant_id');
            }
        });

        Schema::dropIfExists('tenants');
    }
};
