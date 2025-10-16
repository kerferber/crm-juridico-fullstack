<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('levels', function (Blueprint $table) {
            $table->unsignedInteger('id')->primary();
            $table->string('name');
            $table->unsignedInteger('threshold');
        });
        Schema::create('badges', function (Blueprint $table) {
            $table->unsignedInteger('id')->primary();
            $table->string('name');
            $table->string('icon')->nullable();
            $table->string('description')->nullable();
            $table->string('type')->nullable();
            $table->unsignedInteger('threshold')->default(0);
            $table->string('area')->nullable();
        });
    }
    public function down(): void {
        Schema::dropIfExists('badges');
        Schema::dropIfExists('levels');
    }
};
