<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->enum('status',['Pendente','Concluída','Atrasada'])->default('Pendente');
            $table->date('due_date')->nullable();
            $table->date('deadline')->nullable();
            $table->integer('score')->default(0);
            $table->foreignId('responsible_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('lawsuit_id')->nullable()->constrained('lawsuits')->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('contacts')->nullOnDelete();
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('tasks');
    }
};
