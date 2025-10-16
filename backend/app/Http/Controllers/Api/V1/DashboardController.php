<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\Lawsuit;
use App\Models\Contact;
use App\Models\Transaction;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function summary()
    {
        $today = now();
        $activeLawsuits = Lawsuit::where('status','Ativo')->count();
        $overdueTasks = Task::where('status','Atrasada')->orWhere(function($q){ $q->where('status','Pendente')->whereDate('deadline','<', now()); })->count();
        $newLeads = Contact::where('status','Lead')->where('created_at','>=',$today->startOfMonth())->count();
        $concludedThisMonth = Task::where('status','Concluída')->where('updated_at','>=',$today->startOfMonth())->count();
        $revenueThisMonth = Transaction::where('type','Receita')->whereMonth('date',$today->month)->sum('value');
        $expenseThisMonth = Transaction::where('type','Despesa')->whereMonth('date',$today->month)->sum('value');

        return response()->json([
            'activeLawsuits' => $activeLawsuits,
            'overdueTasks' => $overdueTasks,
            'newLeads' => $newLeads,
            'concludedThisMonth' => $concludedThisMonth,
            'revenueThisMonth' => (float)$revenueThisMonth,
            'expenseThisMonth' => (float)$expenseThisMonth,
        ]);
    }

    public function agility()
    {
        $avgCloseDays = Task::where('status','Concluída')
            ->selectRaw('AVG(DATEDIFF(updated_at, created_at)) as avg_days')
            ->value('avg_days');

        return response()->json([
            'avgCloseDays' => (float) $avgCloseDays,
        ]);
    }

    public function productivity()
    {
        $byUser = Task::selectRaw('responsible_id, SUM(score) as points, SUM(CASE WHEN status = "Concluída" THEN 1 ELSE 0 END) as completed')
            ->groupBy('responsible_id')->with('responsible:id,name')->get();

        return response()->json($byUser);
    }

    public function office()
    {
        $openByArea = Lawsuit::selectRaw('area, COUNT(*) as total')->groupBy('area')->get();
        return response()->json(['openByArea'=>$openByArea]);
    }
}
