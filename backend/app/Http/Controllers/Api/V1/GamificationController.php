<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Models\Level;
use App\Models\Task;
use App\Models\User;

class GamificationController extends Controller
{
    protected function resolveUser(): ?User
    {
        $user = auth()->user();
        if ($user) {
            return $user;
        }

        if (config('app.disable_api_auth')) {
            return User::first();
        }

        return null;
    }

    public function status()
    {
        $user = $this->resolveUser();
        if (!$user) {
            abort(401, 'Unauthorized');
        }

        $tenantId = $user->tenant_id;

        $points = Task::where('tenant_id', $tenantId)
            ->where('responsible_id', $user->id)
            ->where('status', 'Concluída')
            ->sum('score');

        $level = Level::where(function ($query) use ($tenantId) {
                $query->whereNull('tenant_id')
                    ->orWhere('tenant_id', $tenantId);
            })
            ->where('threshold', '<=', $points)
            ->orderBy('threshold', 'desc')
            ->first();

        $next = Level::where(function ($query) use ($tenantId) {
                $query->whereNull('tenant_id')
                    ->orWhere('tenant_id', $tenantId);
            })
            ->where('threshold', '>', $points)
            ->orderBy('threshold', 'asc')
            ->first();

        $badges = Badge::where(function ($query) use ($tenantId) {
                $query->whereNull('tenant_id')
                    ->orWhere('tenant_id', $tenantId);
            })
            ->get()
            ->map(function ($badge) use ($user, $tenantId) {
                $earned = false;

                if ($badge->type === 'task') {
                    $earned = Task::where('tenant_id', $tenantId)
                        ->where('responsible_id', $user->id)
                        ->where('status', 'Concluída')
                        ->count() >= $badge->threshold;
                }

                return [
                    'id' => $badge->id,
                    'name' => $badge->name,
                    'icon' => $badge->icon,
                    'description' => $badge->description,
                    'earned' => $earned,
                ];
            });

        return response()->json([
            'points' => (int) $points,
            'level' => $level?->name ?? 'Iniciante',
            'nextLevelAt' => $next?->threshold ?? null,
            'badges' => $badges,
        ]);
    }

    public function ranking()
    {
        $user = $this->resolveUser();
        if (!$user) {
            abort(401, 'Unauthorized');
        }

        $tenantId = $user->tenant_id;

        $ranking = User::select('users.id', 'users.name')
            ->where('users.tenant_id', $tenantId)
            ->leftJoin('tasks', function ($join) use ($tenantId) {
                $join->on('tasks.responsible_id', '=', 'users.id')
                    ->where('tasks.tenant_id', '=', $tenantId);
            })
            ->selectRaw('COALESCE(SUM(CASE WHEN tasks.status = "Concluída" THEN tasks.score ELSE 0 END),0) as points')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('points')
            ->limit(20)
            ->get();

        return response()->json($ranking);
    }
}
