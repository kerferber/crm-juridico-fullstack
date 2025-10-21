<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TenantController extends Controller
{
    public function index()
    {
        return Tenant::withCount('users')
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'regex:/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i', 'max:60', 'unique:tenants,slug'],
            'status' => ['nullable', 'in:active,inactive'],
            'settings' => ['nullable', 'array'],
        ]);

        $slug = $data['slug'] ?? Str::slug($data['name']);

        if (Tenant::where('slug', $slug)->exists()) {
            $slug .= '-' . Str::lower(Str::random(5));
        }

        $tenant = Tenant::create([
            'name' => $data['name'],
            'slug' => $slug,
            'status' => $data['status'] ?? 'active',
            'settings' => $data['settings'] ?? null,
        ]);

        return response()->json($tenant, 201);
    }
}
