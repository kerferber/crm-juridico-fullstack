<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('lawsuits', function (Blueprint $table) {
            $table->id();
            $table->string('internal_number')->unique();
            $table->enum('area', ['Cível','Trabalhista','Previdenciário']);
            $table->string('phase')->nullable();
            $table->date('deadline')->nullable();
            $table->enum('status',['Ativo','Fechado','Arquivado'])->default('Ativo');
            $table->foreignId('client_id')->constrained('contacts')->cascadeOnDelete();
            $table->foreignId('responsible_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('kanban_column')->nullable();
            $table->enum('kanban_phase', ['Judicial','Extrajudicial'])->default('Judicial');
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('lawsuits');
    }
};
