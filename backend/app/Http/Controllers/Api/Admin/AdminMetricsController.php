<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Lawsuit;
use App\Models\Task;
use App\Models\Tenant;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Laravel\Sanctum\PersonalAccessToken;

class AdminMetricsController extends Controller
{
    public function overview(Request $request)
    {
        $now = Carbon::now();
        $since30Days = $now->copy()->subDays(30);
        $since24Hours = $now->copy()->subDay();
        $sinceFiveMinutes = $now->copy()->subMinutes(5);

        $tenants = Tenant::query()
            ->withCount('users')
            ->orderBy('created_at', 'asc')
            ->get();

        $tenantMetrics = $tenants->map(function (Tenant $tenant) use ($since30Days, $since24Hours, $sinceFiveMinutes) {
            $tenantId = $tenant->id;

            $tasksQuery = Task::where('tenant_id', $tenantId);
            $usersQuery = User::where('tenant_id', $tenantId);
            $contactsQuery = Contact::where('tenant_id', $tenantId);
            $lawsuitsQuery = Lawsuit::where('tenant_id', $tenantId);
            $transactionsQuery = Transaction::where('tenant_id', $tenantId);

            $revenue = (float) (clone $transactionsQuery)->where('type', 'Receita')->sum('value');
            $expense = (float) (clone $transactionsQuery)->where('type', 'Despesa')->sum('value');
            $activeSessions = PersonalAccessToken::where('tokenable_type', User::class)
                ->where(function ($query) use ($sinceFiveMinutes) {
                    $query->where('last_used_at', '>=', $sinceFiveMinutes)
                        ->orWhere('created_at', '>=', $sinceFiveMinutes);
                })
                ->whereHasMorph('tokenable', [User::class], function ($query) use ($tenantId) {
                    $query->where('tenant_id', $tenantId);
                })
                ->count();

            return [
                'tenant' => [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                    'status' => $tenant->status,
                    'created_at' => $tenant->created_at,
                    'users_count' => $tenant->users_count,
                ],
                'metrics' => [
                    'tasks_total' => (clone $tasksQuery)->count(),
                    'tasks_last_30_days' => (clone $tasksQuery)->where('created_at', '>=', $since30Days)->count(),
                    'users_total' => (clone $usersQuery)->count(),
                    'users_active_24h' => (clone $usersQuery)->where('last_login_at', '>=', $since24Hours)->count(),
                    'sessions_active_5m' => $activeSessions,
                    'contacts_total' => (clone $contactsQuery)->count(),
                    'lawsuits_total' => (clone $lawsuitsQuery)->count(),
                    'transactions' => [
                        'revenue' => $revenue,
                        'expense' => $expense,
                        'net' => $revenue - $expense,
                    ],
                ],
                'activity' => [
                    'latest_task' => (clone $tasksQuery)->latest('created_at')->value('created_at'),
                    'latest_user' => (clone $usersQuery)->latest('created_at')->value('created_at'),
                    'latest_contact' => (clone $contactsQuery)->latest('created_at')->value('created_at'),
                    'latest_transaction' => (clone $transactionsQuery)->latest('created_at')->value('created_at'),
                ],
            ];
        });

        $totals = $this->computeTotals($tenantMetrics);

        return response()->json([
            'generated_at' => $now,
            'totals' => $totals,
            'tenants' => $tenantMetrics,
        ]);
    }

    public function timeseries(Request $request)
    {
        $days = (int) $request->query('days', 30);
        $start = Carbon::now()->subDays($days - 1)->startOfDay();

        $labels = collect(range(0, $days - 1))
            ->map(fn ($offset) => $start->copy()->addDays($offset)->toDateString());

        $series = Tenant::query()->select('id', 'name', 'slug')->get()->map(function (Tenant $tenant) use ($labels, $start) {
            $tasks = Task::selectRaw('DATE(created_at) as day, COUNT(*) as total')
                ->where('tenant_id', $tenant->id)
                ->where('created_at', '>=', $start)
                ->groupBy('day')
                ->pluck('total', 'day');

            $transactions = Transaction::selectRaw('DATE(created_at) as day, SUM(CASE WHEN type = "Receita" THEN value ELSE 0 END) as revenue, SUM(CASE WHEN type = "Despesa" THEN value ELSE 0 END) as expense')
                ->where('tenant_id', $tenant->id)
                ->where('created_at', '>=', $start)
                ->groupBy('day')
                ->get()
                ->keyBy('day');

            return [
                'tenant' => [
                    'id' => $tenant->id,
                    'name' => $tenant->name,
                    'slug' => $tenant->slug,
                ],
                'tasks' => $labels->map(fn ($day) => (int) ($tasks[$day] ?? 0))->all(),
                'revenue' => $labels->map(fn ($day) => (float) ($transactions[$day]->revenue ?? 0))->all(),
                'expense' => $labels->map(fn ($day) => (float) ($transactions[$day]->expense ?? 0))->all(),
            ];
        });

        return response()->json([
            'labels' => $labels,
            'series' => $series,
        ]);
    }

    private function computeTotals(Collection $tenantMetrics): array
    {
        $base = [
            'tasks_total' => 0,
            'tasks_last_30_days' => 0,
            'users_total' => 0,
            'users_active_24h' => 0,
            'sessions_active_5m' => 0,
            'contacts_total' => 0,
            'lawsuits_total' => 0,
            'transactions' => [
                'revenue' => 0.0,
                'expense' => 0.0,
                'net' => 0.0,
            ],
            'tenants_total' => $tenantMetrics->count(),
        ];

        return $tenantMetrics->reduce(function ($carry, $tenant) {
            $metrics = $tenant['metrics'];

            $carry['tasks_total'] += $metrics['tasks_total'];
            $carry['tasks_last_30_days'] += $metrics['tasks_last_30_days'];
            $carry['users_total'] += $metrics['users_total'];
            $carry['users_active_24h'] += $metrics['users_active_24h'];
            $carry['sessions_active_5m'] += $metrics['sessions_active_5m'];
            $carry['contacts_total'] += $metrics['contacts_total'];
            $carry['lawsuits_total'] += $metrics['lawsuits_total'];
            $carry['transactions']['revenue'] += $metrics['transactions']['revenue'];
            $carry['transactions']['expense'] += $metrics['transactions']['expense'];
            $carry['transactions']['net'] += $metrics['transactions']['net'];

            return $carry;
        }, $base);
    }
}
