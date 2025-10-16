<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $r) {
        $q = Transaction::query();
        if ($type = $r->input('filter.type')) $q->where('type',$type);
        if ($sort = $r->input('sort')) $q->orderBy($sort);
        return $q->paginate(50);
    }
    public function store(Request $r) { return Transaction::create($r->all()); }
    public function show($id) { return Transaction::findOrFail($id); }
    public function update(Request $r, $id) { $m = Transaction::findOrFail($id); $m->update($r->all()); return $m; }
    public function destroy($id) { Transaction::findOrFail($id)->delete(); return response()->noContent(); }
}
