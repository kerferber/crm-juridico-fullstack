<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'title',
        'status',
        'due_date',
        'deadline',
        'score',
        'category_id',
        'responsible_id',
        'lawsuit_id',
        'client_id',
        'notes',
        'mentions',
    ];

    protected $casts = [
        'due_date' => 'date',
        'deadline' => 'date',
        'mentions' => 'array',
    ];

    public function responsible()
    {
        return $this->belongsTo(User::class, 'responsible_id');
    }

    public function lawsuit()
    {
        return $this->belongsTo(Lawsuit::class);
    }

    public function client()
    {
        return $this->belongsTo(Contact::class, 'client_id');
    }

    public function getComputedStatusAttribute()
    {
        if ($this->status === 'Concluída') return 'Concluída';
        if ($this->deadline && $this->deadline->isPast()) return 'Atrasada';
        return 'Pendente';
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
