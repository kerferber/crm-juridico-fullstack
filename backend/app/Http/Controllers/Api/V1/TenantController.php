<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Models\CalendarEvent;
use App\Models\Contact;
use App\Models\Lawsuit;
use App\Models\Level;
use App\Models\Task;
use App\Models\Tenant;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Laravel\Sanctum\PersonalAccessToken;

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
            'admin_name' => ['nullable', 'string', 'max:255', 'required_with:admin_email,admin_password'],
            'admin_email' => ['nullable', 'email', 'max:255', 'required_with:admin_name,admin_password', 'unique:users,email'],
            'admin_password' => ['nullable', 'string', Password::min(8), 'required_with:admin_name,admin_email', 'confirmed'],
        ]);

        $slug = $data['slug'] ?? Str::slug($data['name']);

        if (Tenant::where('slug', $slug)->exists()) {
            $slug .= '-' . Str::lower(Str::random(5));
        }

        $adminUser = null;

        $tenant = DB::transaction(function () use ($data, $slug, &$adminUser) {
            $tenant = Tenant::create([
                'name' => $data['name'],
                'slug' => $slug,
                'status' => $data['status'] ?? 'active',
                'settings' => $data['settings'] ?? null,
            ]);

            if (!empty($data['admin_email'])) {
                $adminUser = User::create([
                    'tenant_id' => $tenant->id,
                    'name' => $data['admin_name'],
                    'email' => Str::lower($data['admin_email']),
                    'password' => Hash::make($data['admin_password']),
                    'is_tenant_admin' => true,
                ]);
            }

            return $tenant;
        });

        $tenant->loadCount('users');

        return response()->json([
            'tenant' => $tenant,
            'admin' => $adminUser ? [
                'id' => $adminUser->id,
                'name' => $adminUser->name,
                'email' => $adminUser->email,
            ] : null,
        ], 201);
    }

    public function destroy(Tenant $tenant)
    {
        DB::transaction(function () use ($tenant) {
            $tenantId = $tenant->id;

            PersonalAccessToken::where('tokenable_type', User::class)
                ->whereHas('tokenable', fn ($query) => $query->where('tenant_id', $tenantId))
                ->delete();

            Task::where('tenant_id', $tenantId)->delete();
            CalendarEvent::where('tenant_id', $tenantId)->delete();
            Transaction::where('tenant_id', $tenantId)->delete();
            Lawsuit::where('tenant_id', $tenantId)->delete();
            Contact::where('tenant_id', $tenantId)->delete();
            Badge::where('tenant_id', $tenantId)->delete();
            Level::where('tenant_id', $tenantId)->delete();
            User::where('tenant_id', $tenantId)->delete();

            $tenant->delete();
        });

        return response()->noContent();
    }
}
