<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lawsuit;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LawsuitController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);

        $query = Lawsuit::with(['client', 'responsible'])
            ->where('tenant_id', $tenantId);

        if ($area = $request->input('filter.area')) {
            $query->where('area', $area);
        }

        if ($status = $request->input('filter.status')) {
            $query->where('status', $status);
        }

        if ($phase = $request->input('filter.kanban_phase')) {
            $query->where('kanban_phase', $phase);
        }

        if ($sort = $request->input('sort')) {
            $query->orderBy($sort);
        } else {
            $query->latest();
        }

        return $query->paginate(20);
    }

    public function store(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);

        $data = $request->validate([
            'internal_number' => [
                'required',
                'string',
                Rule::unique('lawsuits', 'internal_number')->where('tenant_id', $tenantId),
            ],
            'area' => ['required', 'string'],
            'phase' => ['nullable', 'string'],
            'deadline' => ['nullable', 'date'],
            'status' => ['required', 'string'],
            'client_id' => ['required', 'integer'],
            'responsible_id' => ['nullable', 'integer'],
            'kanban_column' => ['nullable', 'string'],
            'kanban_phase' => ['nullable', 'string'],
        ]);

        $data['tenant_id'] = $tenantId;

        $lawsuit = Lawsuit::create($data);

        return response()->json($lawsuit->load(['client', 'responsible']), 201);
    }

    public function show(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        return Lawsuit::with(['client', 'responsible', 'tasks'])
            ->where('tenant_id', $tenantId)
            ->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $lawsuit = Lawsuit::where('tenant_id', $tenantId)->findOrFail($id);

        $data = $request->validate([
            'internal_number' => [
                'sometimes',
                'required',
                'string',
                Rule::unique('lawsuits', 'internal_number')
                    ->where('tenant_id', $tenantId)
                    ->ignore($lawsuit->id),
            ],
            'area' => ['nullable', 'string'],
            'phase' => ['nullable', 'string'],
            'deadline' => ['nullable', 'date'],
            'status' => ['nullable', 'string'],
            'client_id' => ['nullable', 'integer'],
            'responsible_id' => ['nullable', 'integer'],
            'kanban_column' => ['nullable', 'string'],
            'kanban_phase' => ['nullable', 'string'],
        ]);

        $lawsuit->update($data);

        return $lawsuit->load(['client', 'responsible']);
    }

    public function destroy(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $lawsuit = Lawsuit::where('tenant_id', $tenantId)->findOrFail($id);
        $lawsuit->delete();

        return response()->noContent();
    }

    public function updateKanban(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $lawsuit = Lawsuit::where('tenant_id', $tenantId)->findOrFail($id);

        $data = $request->validate([
            'kanban_column' => ['required', 'string'],
            'kanban_phase' => ['required', 'string'],
        ]);

        $lawsuit->update($data);

        return $lawsuit->load(['client', 'responsible']);
    }
}
