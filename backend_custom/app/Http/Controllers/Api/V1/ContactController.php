<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function index(Request $request)
    {
        $q = Contact::query();
        if ($s = $request->input('filter.status')) $q->where('status',$s);
        if ($owner = $request->input('filter.owner_id')) $q->where('owner_id',$owner);
        if ($search = $request->input('search')) {
            $q->where(function($qr) use($search) {
                $qr->where('name','like',"%$search%")
                   ->orWhere('email','like',"%$search%");
            });
        }
        if ($sort = $request->input('sort')) $q->orderBy($sort);
        return $q->paginate(20);
    }
    public function store(Request $r) { return Contact::create($r->all()); }
    public function show($id) { return Contact::findOrFail($id); }
    public function update(Request $r, $id) { $m = Contact::findOrFail($id); $m->update($r->all()); return $m; }
    public function destroy($id) { Contact::findOrFail($id)->delete(); return response()->noContent(); }
}
