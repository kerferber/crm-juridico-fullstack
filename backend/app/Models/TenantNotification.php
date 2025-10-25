<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantNotification extends Model
{
    use HasFactory;
    use HasUuids;

    protected $table = 'tenant_notifications';

    protected $fillable = [
        'tenant_id',
        'recipient_id',
        'actor_id',
        'title',
        'message',
        'entity_type',
        'entity_id',
        'meta',
        'read_at',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'meta' => 'array',
        'read_at' => 'datetime',
    ];

    public $incrementing = false;

    protected $keyType = 'string';

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function scopeForRecipient($query, int $tenantId, int $recipientId)
    {
        return $query->where('tenant_id', $tenantId)
            ->where('recipient_id', $recipientId);
    }
}
