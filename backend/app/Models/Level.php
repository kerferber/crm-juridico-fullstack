<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Level extends Model
{
    use HasFactory;

    public $timestamps = false;
    protected $fillable = ['id','tenant_id','name','threshold'];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
