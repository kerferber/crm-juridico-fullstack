<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);

        $query = Contact::with(['owner'])
            ->where('tenant_id', $tenantId);

        if ($status = $request->input('filter.status')) {
            $query->where('status', $status);
        }

        if ($owner = $request->input('filter.owner_id')) {
            $query->where('owner_id', $owner);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($qr) use ($search) {
                $qr->where('name', 'like', "%$search%")
                    ->orWhere('email', 'like', "%$search%");
            });
        }

        if ($sort = $request->input('sort')) {
            $query->orderBy($sort);
        } else {
            $query->orderByDesc('created_at');
        }

        return $query->paginate(20);
    }

    public function store(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'document' => ['nullable', 'string', 'max:255'],
            'origin' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'profession' => ['nullable', 'string', 'max:255'],
            'owner_id' => ['nullable', 'integer'],
            'last_interaction' => ['nullable', 'date'],
        ]);

        $data['tenant_id'] = $tenantId;
        $data['owner_id'] = $data['owner_id'] ?? $request->user()?->id;

        $contact = Contact::create($data);

        return response()->json($contact->load('owner'), 201);
    }

    public function show(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        return Contact::with(['owner', 'lawsuits'])
            ->where('tenant_id', $tenantId)
            ->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $contact = Contact::where('tenant_id', $tenantId)->findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'document' => ['nullable', 'string', 'max:255'],
            'origin' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'profession' => ['nullable', 'string', 'max:255'],
            'owner_id' => ['nullable', 'integer'],
            'last_interaction' => ['nullable', 'date'],
        ]);

        $contact->update($data);

        return $contact->load('owner');
    }

    public function destroy(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $contact = Contact::where('tenant_id', $tenantId)->findOrFail($id);
        $contact->delete();

        return response()->noContent();
    }
}
