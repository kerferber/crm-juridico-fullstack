<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contact extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'name',
        'document',
        'origin',
        'status',
        'email',
        'phone',
        'profession',
        'owner_id',
        'last_interaction',
    ];

    protected $casts = [
        'last_interaction' => 'datetime',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function lawsuits()
    {
        return $this->hasMany(Lawsuit::class, 'client_id');
    }

    public function paymentSchedules()
    {
        return $this->hasMany(PaymentSchedule::class);
    }
}
