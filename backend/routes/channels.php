<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('tenant.{tenantId}.users.{userId}', function (User $user, int $tenantId, int $userId) {
    return (int) $user->tenant_id === (int) $tenantId && (int) $user->id === (int) $userId;
});

Broadcast::channel('tenant.{tenantId}.tasks', function (User $user, int $tenantId) {
    return (int) $user->tenant_id === (int) $tenantId;
});

Broadcast::channel('tenant.{tenantId}.lawsuits', function (User $user, int $tenantId) {
    return (int) $user->tenant_id === (int) $tenantId;
});

Broadcast::channel('tenant.{tenantId}.contacts', function (User $user, int $tenantId) {
    return (int) $user->tenant_id === (int) $tenantId;
});

Broadcast::channel('tenant.{tenantId}.transactions', function (User $user, int $tenantId) {
    return (int) $user->tenant_id === (int) $tenantId;
});

Broadcast::channel('tenant.{tenantId}.calendar-events', function (User $user, int $tenantId) {
    return (int) $user->tenant_id === (int) $tenantId;
});

Broadcast::channel('tenant.{tenantId}.social-posts', function (User $user, int $tenantId) {
    return (int) $user->tenant_id === (int) $tenantId;
});

Broadcast::channel('tenant.{tenantId}.notifications', function (User $user, int $tenantId) {
    return (int) $user->tenant_id === (int) $tenantId;
});
