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
    ];

    protected $hidden = ['password','remember_token'];

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
}
