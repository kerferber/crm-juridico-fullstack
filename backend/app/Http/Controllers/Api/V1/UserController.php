<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);

        return User::where('tenant_id', $tenantId)
            ->orderBy('name')
            ->paginate(20);
    }

    public function store(Request $request)
    {
        $tenantId = $this->ensureTenantId($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->where('tenant_id', $tenantId)],
            'password' => ['required', 'string', 'min:8'],
            'avatar' => ['nullable', 'string'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'personal_email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'secondary_phone' => ['nullable', 'string', 'max:255'],
            'whatsapp' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'birthdate' => ['nullable', 'date'],
            'linkedin_url' => ['nullable', 'string', 'max:255'],
            'instagram_url' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string'],
            'is_tenant_admin' => ['sometimes', 'boolean'],
        ]);

        $payload = [
            'tenant_id' => $tenantId,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'avatar' => $data['avatar'] ?? null,
            'job_title' => $data['job_title'] ?? null,
            'personal_email' => $data['personal_email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'secondary_phone' => $data['secondary_phone'] ?? null,
            'whatsapp' => $data['whatsapp'] ?? null,
            'address' => $data['address'] ?? null,
            'city' => $data['city'] ?? null,
            'state' => $data['state'] ?? null,
            'postal_code' => $data['postal_code'] ?? null,
            'birthdate' => $data['birthdate'] ?? null,
            'linkedin_url' => $data['linkedin_url'] ?? null,
            'instagram_url' => $data['instagram_url'] ?? null,
            'bio' => $data['bio'] ?? null,
        ];

        if ($request->user()?->is_tenant_admin ?? false) {
            $payload['is_tenant_admin'] = $data['is_tenant_admin'] ?? false;
        }

        $user = User::create($payload);

        return response()->json($user->load('tenant'), 201);
    }

    public function show(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        return User::where('tenant_id', $tenantId)
            ->with('tenant')
            ->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $user = User::where('tenant_id', $tenantId)->findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')
                    ->where('tenant_id', $tenantId)
                    ->ignore($user->id),
            ],
            'password' => ['nullable', 'string', 'min:8'],
            'avatar' => ['nullable', 'string'],
            'job_title' => ['nullable', 'string', 'max:255'],
            'personal_email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'secondary_phone' => ['nullable', 'string', 'max:255'],
            'whatsapp' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'state' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'birthdate' => ['nullable', 'date'],
            'linkedin_url' => ['nullable', 'string', 'max:255'],
            'instagram_url' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string'],
            'is_tenant_admin' => ['sometimes', 'boolean'],
        ]);

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        if (!$request->user()?->is_tenant_admin ?? true) {
            unset($data['is_tenant_admin']);
        }

        $user->update($data);

        return $user->load('tenant');
    }

    public function destroy(Request $request, $id)
    {
        $tenantId = $this->ensureTenantId($request);

        $user = User::where('tenant_id', $tenantId)->findOrFail($id);

        abort_if(
            !$request->user()?->is_tenant_admin,
            403,
            'Somente administradores do tenant podem excluir usuários.'
        );

        abort_if(
            $request->user()->id === $user->id,
            422,
            'Não é possível remover o próprio usuário ativo.'
        );

        $user->delete();

        return response()->noContent();
    }
}
