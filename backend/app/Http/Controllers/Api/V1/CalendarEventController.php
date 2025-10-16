<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\CalendarEvent;
use App\Models\User;
use Illuminate\Http\Request;

class CalendarEventController extends Controller
{
    protected function resolveUser(Request $request): ?User
    {
        $user = $request->user();
        if ($user) {
            return $user;
        }

        if (config('app.disable_api_auth')) {
            return User::first();
        }

        return null;
    }

    public function index(Request $r) {
        $user = $this->resolveUser($r);
        $query = CalendarEvent::query()->orderBy('start','asc');

        if ($user) {
            $query->where('user_id', $user->id);
        }

        return $query->paginate(50);
    }

    public function store(Request $r) {
        $user = $this->resolveUser($r);
        if (!$user) {
            abort(401, 'Unauthorized');
        }

        $data = $r->all();
        $data['user_id'] = $user->id;

        return CalendarEvent::create($data);
    }
    public function show($id) { return CalendarEvent::findOrFail($id); }
    public function update(Request $r, $id) { $m = CalendarEvent::findOrFail($id); $m->update($r->all()); return $m; }
    public function destroy($id) { CalendarEvent::findOrFail($id)->delete(); return response()->noContent(); }
}
