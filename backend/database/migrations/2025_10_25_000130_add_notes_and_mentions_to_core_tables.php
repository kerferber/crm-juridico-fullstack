<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('category_id')->nullable()->after('score');
            $table->text('notes')->nullable()->after('client_id');
            $table->json('mentions')->nullable()->after('notes');
        });

        Schema::table('lawsuits', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('kanban_phase');
            $table->json('mentions')->nullable()->after('notes');
        });

        Schema::table('contacts', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('profession');
            $table->json('mentions')->nullable()->after('notes');
        });
    }

    public function down(): void {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['category_id', 'notes', 'mentions']);
        });

        Schema::table('lawsuits', function (Blueprint $table) {
            $table->dropColumn(['notes', 'mentions']);
        });

        Schema::table('contacts', function (Blueprint $table) {
            $table->dropColumn(['notes', 'mentions']);
        });
    }
};
