<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('tenant_notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('recipient_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title', 255);
            $table->text('message');
            $table->string('entity_type', 50)->nullable();
            $table->string('entity_id', 255)->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'recipient_id', 'created_at'], 'tenant_notifications_lookup');
            $table->index(['tenant_id', 'created_at'], 'tenant_notifications_recent');
        });
    }

    public function down(): void {
        Schema::dropIfExists('tenant_notifications');
    }
};
