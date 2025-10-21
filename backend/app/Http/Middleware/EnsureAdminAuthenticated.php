<?php

namespace App\Http\Middleware;

use App\Models\AdminUser;
use Closure;
use Illuminate\Http\Request;

class EnsureAdminAuthenticated
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user || !($user instanceof AdminUser)) {
            abort(403, 'Acesso restrito ao painel administrativo.');
        }

        $token = $request->user()->currentAccessToken();

        if (!$token || !$token->can('admin')) {
            abort(403, 'Token administrativo inválido.');
        }

        return $next($request);
    }
}
