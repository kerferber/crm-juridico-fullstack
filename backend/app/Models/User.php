<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'tenant_id',
        'name',
        'email',
        'password',
        'avatar',
        'job_title',
        'personal_email',
        'phone',
        'secondary_phone',
        'whatsapp',
        'address',
        'city',
        'state',
        'postal_code',
        'birthdate',
        'linkedin_url',
        'instagram_url',
        'bio',
        'is_tenant_admin',
        'last_login_at',
    ];

    protected $hidden = ['password','remember_token'];

    protected $casts = [
        'is_tenant_admin' => 'boolean',
        'birthdate' => 'date',
        'last_login_at' => 'datetime',
    ];

    public function contacts()
    {
        return $this->hasMany(Contact::class, 'owner_id');
    }

    public function responsibleLawsuits()
    {
        return $this->hasMany(Lawsuit::class, 'responsible_id');
    }

    public function tasks()
    {
        return $this->hasMany(Task::class, 'responsible_id');
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
