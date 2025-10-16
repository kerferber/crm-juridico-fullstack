<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $r) {
        $q = Task::with(['responsible','lawsuit','client']);
        if ($status = $r->input('filter.status')) $q->where('status',$status);
        if ($resp = $r->input('filter.responsible_id')) $q->where('responsible_id',$resp);
        if ($sort = $r->input('sort')) $q->orderBy($sort);
        return $q->paginate(20);
    }
    public function store(Request $r) { return Task::create($r->all()); }
    public function show($id) { return Task::with(['responsible','lawsuit','client'])->findOrFail($id); }
    public function update(Request $r, $id) { $m = Task::findOrFail($id); $m->update($r->all()); return $m; }
    public function destroy($id) { Task::findOrFail($id)->delete(); return response()->noContent(); }
    public function updateStatus(Request $r, $id) {
        $m = Task::findOrFail($id);
        $m->update(['status' => $r->input('status')]);
        return $m;
    }
}
