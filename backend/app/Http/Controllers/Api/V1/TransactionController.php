<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);

        $query = Transaction::where('tenant_id', $tenantId);

        if ($type = $request->input('filter.type')) {
            $query->where('type', $type);
        }

        if ($sort = $request->input('sort')) {
            $query->orderBy($sort);
        } else {
            $query->orderByDesc('date');
        }

        return $query->paginate(50);
    }

    public function store(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);

        $data = $request->validate([
            'date' => ['required', 'date'],
            'description' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'account' => ['nullable', 'string', 'max:255'],
            'value' => ['required', 'numeric'],
            'type' => ['required', 'string', 'max:20'],
        ]);

        $data['tenant_id'] = $tenantId;

        $transaction = Transaction::create($data);

        return response()->json($transaction, 201);
    }

    public function show(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        return Transaction::where('tenant_id', $tenantId)->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $transaction = Transaction::where('tenant_id', $tenantId)->findOrFail($id);

        $data = $request->validate([
            'date' => ['sometimes', 'required', 'date'],
            'description' => ['sometimes', 'required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:255'],
            'account' => ['nullable', 'string', 'max:255'],
            'value' => ['nullable', 'numeric'],
            'type' => ['nullable', 'string', 'max:20'],
        ]);

        $transaction->update($data);

        return $transaction;
    }

    public function destroy(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $transaction = Transaction::where('tenant_id', $tenantId)->findOrFail($id);
        $transaction->delete();

        return response()->noContent();
    }
}
