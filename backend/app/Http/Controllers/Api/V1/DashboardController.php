<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Lawsuit;
use App\Models\Task;
use App\Models\Transaction;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);
        $today = now();

        $activeLawsuits = Lawsuit::where('tenant_id', $tenantId)
            ->where('status', 'Ativo')
            ->count();

        $overdueTasks = Task::where('tenant_id', $tenantId)
            ->where(function ($query) {
                $query->where('status', 'Atrasada')
                    ->orWhere(function ($inner) {
                        $inner->where('status', 'Pendente')
                            ->whereDate('deadline', '<', now());
                    });
            })
            ->count();

        $newLeads = Contact::where('tenant_id', $tenantId)
            ->where('status', 'Lead')
            ->where('created_at', '>=', $today->copy()->startOfMonth())
            ->count();

        $concludedThisMonth = Task::where('tenant_id', $tenantId)
            ->where('status', 'Concluída')
            ->where('updated_at', '>=', $today->copy()->startOfMonth())
            ->count();

        $revenueThisMonth = Transaction::where('tenant_id', $tenantId)
            ->where('type', 'Receita')
            ->whereMonth('date', $today->month)
            ->sum('value');

        $expenseThisMonth = Transaction::where('tenant_id', $tenantId)
            ->where('type', 'Despesa')
            ->whereMonth('date', $today->month)
            ->sum('value');

        return response()->json([
            'activeLawsuits' => $activeLawsuits,
            'overdueTasks' => $overdueTasks,
            'newLeads' => $newLeads,
            'concludedThisMonth' => $concludedThisMonth,
            'revenueThisMonth' => (float) $revenueThisMonth,
            'expenseThisMonth' => (float) $expenseThisMonth,
        ]);
    }

    public function agility(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);

        $avgCloseDays = Task::where('tenant_id', $tenantId)
            ->where('status', 'Concluída')
            ->selectRaw('AVG(DATEDIFF(updated_at, created_at)) as avg_days')
            ->value('avg_days');

        return response()->json([
            'avgCloseDays' => (float) $avgCloseDays,
        ]);
    }

    public function productivity(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);

        $byUser = Task::selectRaw('responsible_id, SUM(score) as points, SUM(CASE WHEN status = "Concluída" THEN 1 ELSE 0 END) as completed')
            ->where('tenant_id', $tenantId)
            ->groupBy('responsible_id')
            ->with(['responsible' => function ($query) use ($tenantId) {
                $query->where('tenant_id', $tenantId)->select('id', 'name', 'tenant_id');
            }])
            ->get();

        return response()->json($byUser);
    }

    public function office(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);

        $openByArea = Lawsuit::selectRaw('area, COUNT(*) as total')
            ->where('tenant_id', $tenantId)
            ->groupBy('area')
            ->get();

        return response()->json(['openByArea' => $openByArea]);
    }
}
