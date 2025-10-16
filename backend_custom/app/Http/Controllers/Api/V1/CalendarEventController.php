<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CalendarEvent;
use Illuminate\Http\Request;

class CalendarEventController extends Controller
{
    public function index(Request $r) {
        return CalendarEvent::where('user_id', $r->user()->id)->orderBy('start','asc')->paginate(50);
    }
    public function store(Request $r) { $data = $r->all(); $data['user_id']=$r->user()->id; return CalendarEvent::create($data); }
    public function show($id) { return CalendarEvent::findOrFail($id); }
    public function update(Request $r, $id) { $m = CalendarEvent::findOrFail($id); $m->update($r->all()); return $m; }
    public function destroy($id) { CalendarEvent::findOrFail($id)->delete(); return response()->noContent(); }
}
