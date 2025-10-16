<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = ['date','description','category','account','value','type'];

    protected $casts = [
        'date' => 'date',
        'value' => 'decimal:2',
    ];
}
