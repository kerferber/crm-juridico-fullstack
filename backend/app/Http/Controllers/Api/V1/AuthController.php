<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'tenant_slug' => ['required', 'exists:tenants,slug'],
            'name' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', Password::min(8)],
        ]);

        $tenant = Tenant::where('slug', $data['tenant_slug'])->firstOrFail();

        $request->validate([
            'email' => Rule::unique('users', 'email')->where(function ($query) use ($tenant) {
                return $query->where('tenant_id', $tenant->id);
            }),
        ]);

        $isFirstTenantUser = !User::where('tenant_id', $tenant->id)->exists();

        $user = User::create([
            'tenant_id' => $tenant->id,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'is_tenant_admin' => $isFirstTenantUser,
        ]);

        return response()->json([
            'user' => $user->load('tenant'),
            'tenant' => $tenant,
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'tenant_slug' => ['required', 'string', 'exists:tenants,slug'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $tenant = Tenant::where('slug', $data['tenant_slug'])->firstOrFail();

        $user = User::where('tenant_id', $tenant->id)
            ->where('email', $data['email'])
            ->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Credenciais inválidas'], 422);
        }

        $user->forceFill([
            'last_login_at' => now(),
        ])->save();

        $token = $user->createToken('spa')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user->load('tenant'),
            'tenant' => $tenant,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function user(Request $request)
    {
        return response()->json(
            $request->user()?->load('tenant')
        );
    }
}
