<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lawsuit extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'internal_number',
        'area',
        'phase',
        'deadline',
        'status',
        'client_id',
        'responsible_id',
        'kanban_column',
        'kanban_phase',
        'notes',
        'mentions',
    ];

    protected $casts = [
        'deadline' => 'date',
        'mentions' => 'array',
    ];

    public function client()
    {
        return $this->belongsTo(Contact::class, 'client_id');
    }

    public function responsible()
    {
        return $this->belongsTo(User::class, 'responsible_id');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
