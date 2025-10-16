<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\User;
use App\Models\Level;
use App\Models\Badge;

class GamificationController extends Controller
{
    public function status()
    {
        $user = auth()->user();
        $points = Task::where('responsible_id',$user->id)->where('status','Concluída')->sum('score');

        $level = Level::where('threshold','<=',$points)->orderBy('threshold','desc')->first();
        $next = Level::where('threshold','>',$points)->orderBy('threshold','asc')->first();

        $badges = Badge::all()->map(function($b) use($user) {
            $earned = false;
            if ($b->type === 'task') {
                $earned = Task::where('responsible_id',$user->id)->where('status','Concluída')->count() >= $b->threshold;
            }
            return [
                'id'=>$b->id,'name'=>$b->name,'icon'=>$b->icon,'description'=>$b->description,'earned'=>$earned
            ];
        });

        return response()->json([
            'points' => (int)$points,
            'level' => $level?->name ?? 'Iniciante',
            'nextLevelAt' => $next?->threshold ?? null,
            'badges' => $badges,
        ]);
    }

    public function ranking()
    {
        $ranking = User::select('users.id','users.name')
            ->leftJoin('tasks','tasks.responsible_id','=','users.id')
            ->selectRaw('COALESCE(SUM(CASE WHEN tasks.status = "Concluída" THEN tasks.score ELSE 0 END),0) as points')
            ->groupBy('users.id','users.name')
            ->orderByDesc('points')
            ->limit(20)->get();

        return response()->json($ranking);
    }
}
