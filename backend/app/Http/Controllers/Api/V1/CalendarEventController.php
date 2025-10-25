<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\CalendarEventCreated;
use App\Events\CalendarEventDeleted;
use App\Events\CalendarEventUpdated;
use App\Http\Controllers\Controller;
use App\Http\Resources\CalendarEventResource;
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

    public function index(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);
        $user = $this->resolveUser($request);

        $query = CalendarEvent::query()
            ->where('tenant_id', $tenantId)
            ->orderBy('start', 'asc');

        if ($user) {
            $query->where(function ($qb) use ($user) {
                $qb->whereNull('user_id')
                    ->orWhere('user_id', $user->id);
            });
        }

        return $query->paginate(50);
    }

    public function store(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);
        $user = $this->resolveUser($request);

        if (!$user) {
            abort(401, 'Unauthorized');
        }

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'start' => ['required', 'date'],
            'end' => ['nullable', 'date'],
            'color' => ['nullable', 'string', 'max:32'],
        ]);

        $data['tenant_id'] = $tenantId;
        $data['user_id'] = $user->id;

        $event = CalendarEvent::create($data);

        CalendarEventCreated::dispatch($event);

        return CalendarEventResource::make($event)
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        return CalendarEvent::where('tenant_id', $tenantId)->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);
        $event = CalendarEvent::where('tenant_id', $tenantId)->findOrFail($id);

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'start' => ['sometimes', 'required', 'date'],
            'end' => ['nullable', 'date'],
            'color' => ['nullable', 'string', 'max:32'],
        ]);

        $event->update($data);

        CalendarEventUpdated::dispatch($event);

        return CalendarEventResource::make($event);
    }

    public function destroy(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);
        $event = CalendarEvent::where('tenant_id', $tenantId)->findOrFail($id);
        $eventId = (int) $event->id;
        $event->delete();

        CalendarEventDeleted::dispatch($tenantId, $eventId);

        return response()->noContent();
    }
}
