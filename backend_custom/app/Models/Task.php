<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'title','status','due_date','deadline','score',
        'responsible_id','lawsuit_id','client_id'
    ];

    protected $casts = [
        'due_date' => 'date',
        'deadline' => 'date',
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
}
