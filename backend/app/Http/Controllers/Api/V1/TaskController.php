<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);

        $query = Task::with(['responsible', 'lawsuit', 'client'])
            ->where('tenant_id', $tenantId);

        if ($status = $request->input('filter.status')) {
            $query->where('status', $status);
        }

        if ($responsible = $request->input('filter.responsible_id')) {
            $query->where('responsible_id', $responsible);
        }

        if ($sort = $request->input('sort')) {
            $query->orderBy($sort);
        } else {
            $query->orderByDesc('due_date');
        }

        return $query->paginate(20);
    }

    public function store(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'status' => ['required', 'string', 'max:255'],
            'due_date' => ['nullable', 'date'],
            'deadline' => ['nullable', 'date'],
            'score' => ['nullable', 'integer'],
            'responsible_id' => ['nullable', 'integer'],
            'lawsuit_id' => ['nullable', 'integer'],
            'client_id' => ['nullable', 'integer'],
        ]);

        $data['tenant_id'] = $tenantId;
        $data['responsible_id'] = $data['responsible_id'] ?? $request->user()?->id;

        $task = Task::create($data);

        return response()->json($task->load(['responsible', 'lawsuit', 'client']), 201);
    }

    public function show(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        return Task::with(['responsible', 'lawsuit', 'client'])
            ->where('tenant_id', $tenantId)
            ->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $task = Task::where('tenant_id', $tenantId)->findOrFail($id);

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:255'],
            'due_date' => ['nullable', 'date'],
            'deadline' => ['nullable', 'date'],
            'score' => ['nullable', 'integer'],
            'responsible_id' => ['nullable', 'integer'],
            'lawsuit_id' => ['nullable', 'integer'],
            'client_id' => ['nullable', 'integer'],
        ]);

        $task->update($data);

        return $task->load(['responsible', 'lawsuit', 'client']);
    }

    public function destroy(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $task = Task::where('tenant_id', $tenantId)->findOrFail($id);
        $task->delete();

        return response()->noContent();
    }

    public function updateStatus(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $task = Task::where('tenant_id', $tenantId)->findOrFail($id);

        $data = $request->validate([
            'status' => ['required', 'string', 'max:255'],
        ]);

        $task->update(['status' => $data['status']]);

        return $task->load(['responsible', 'lawsuit', 'client']);
    }
}
