<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payment_installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_schedule_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sequence');
            $table->date('due_date');
            $table->decimal('amount', 12, 2);
            $table->string('status')->default('pending');
            $table->date('paid_at')->nullable();
            $table->foreignId('transaction_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['payment_schedule_id', 'sequence']);
            $table->index(['status', 'due_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_installments');
    }
};
