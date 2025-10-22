<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'contact_id',
        'title',
        'notes',
        'total_amount',
        'installments_count',
        'installment_amount',
        'first_due_date',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'installment_amount' => 'decimal:2',
        'first_due_date' => 'date',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function installments()
    {
        return $this->hasMany(PaymentInstallment::class);
    }
}
