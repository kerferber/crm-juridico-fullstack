<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        return User::paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
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
        ]);

        $user = User::create([
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
        ]);

        return response()->json($user, 201);
    }

    public function show($id) { return User::findOrFail($id); }
    public function update(Request $request, $id) {
        $user = User::findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', 'unique:users,email,' . $user->id],
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
        ]);

        $user->update($data);
        return $user;
    }
    public function destroy($id) { User::findOrFail($id)->delete(); return response()->noContent(); }
}
