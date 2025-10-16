<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function index()
    {
        return User::paginate(20);
    }
    public function show($id) { return User::findOrFail($id); }
    public function update(Request $request, $id) {
        $user = User::findOrFail($id);
        $user->update($request->only(['name','email','avatar']));
        return $user;
    }
    public function destroy($id) { User::findOrFail($id)->delete(); return response()->noContent(); }
}
