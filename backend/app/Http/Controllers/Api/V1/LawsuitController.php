<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lawsuit;
use Illuminate\Http\Request;

class LawsuitController extends Controller
{
    public function index(Request $r) {
        $q = Lawsuit::with(['client','responsible']);
        if ($area = $r->input('filter.area')) $q->where('area',$area);
        if ($status = $r->input('filter.status')) $q->where('status',$status);
        if ($phase = $r->input('filter.kanban_phase')) $q->where('kanban_phase',$phase);
        if ($sort = $r->input('sort')) $q->orderBy($sort);
        return $q->paginate(20);
    }
    public function store(Request $r) { return Lawsuit::create($r->all()); }
    public function show($id) { return Lawsuit::with(['client','responsible','tasks'])->findOrFail($id); }
    public function update(Request $r, $id) { $m = Lawsuit::findOrFail($id); $m->update($r->all()); return $m; }
    public function destroy($id) { Lawsuit::findOrFail($id)->delete(); return response()->noContent(); }
    public function updateKanban(Request $r, $id) {
        $m = Lawsuit::findOrFail($id);
        $m->update($r->only(['kanban_column','kanban_phase']));
        return $m;
    }
}
