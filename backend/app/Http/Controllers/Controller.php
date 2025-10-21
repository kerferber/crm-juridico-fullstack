<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

abstract class Controller
{
    protected function resolveTenantId(?Request $request = null): ?int
    {
        $request ??= request();
        $user = $request?->user();
        if ($user) {
            return (int) $user->tenant_id;
        }

        if (config('app.disable_api_auth')) {
            $fallbackUser = User::first();
            return $fallbackUser?->tenant_id ? (int) $fallbackUser->tenant_id : null;
        }

        return null;
    }

    protected function ensureTenantId(?Request $request = null): int
    {
        $tenantId = $this->resolveTenantId($request);
        abort_if(!$tenantId, 400, 'Tenant não identificado para a requisição.');

        return $tenantId;
    }
}
