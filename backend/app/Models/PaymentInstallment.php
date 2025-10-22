<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentInstallment extends Model
{
    use HasFactory;

    protected $fillable = [
        'payment_schedule_id',
        'sequence',
        'due_date',
        'amount',
        'status',
        'paid_at',
        'transaction_id',
    ];

    protected $casts = [
        'due_date' => 'date',
        'paid_at' => 'date',
        'amount' => 'decimal:2',
    ];

    public function schedule()
    {
        return $this->belongsTo(PaymentSchedule::class, 'payment_schedule_id');
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}
