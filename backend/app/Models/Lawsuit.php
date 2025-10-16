<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lawsuit extends Model
{
    use HasFactory;

    protected $fillable = [
        'internal_number','area','phase','deadline','status',
        'client_id','responsible_id','kanban_column','kanban_phase'
    ];

    protected $casts = [
        'deadline' => 'date',
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
}
