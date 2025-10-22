<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAiSettingsController extends Controller
{
    public function show(Tenant $tenant): JsonResponse
    {
        $aiSettings = data_get($tenant->settings, 'ai', []);

        return response()->json([
            'model' => data_get($aiSettings, 'model'),
            'openai_key' => data_get($aiSettings, 'openai_key'),
            'prompt' => data_get($aiSettings, 'prompt'),
        ]);
    }

    public function update(Request $request, Tenant $tenant): JsonResponse
    {
        $data = $request->validate([
            'model' => ['required', 'string', 'max:255'],
            'openai_key' => ['required', 'string', 'max:255'],
            'prompt' => ['required', 'string', 'max:5000'],
        ]);

        $settings = $tenant->settings ?? [];
        $settings['ai'] = [
            'model' => $data['model'],
            'openai_key' => $data['openai_key'],
            'prompt' => $data['prompt'],
        ];

        $tenant->settings = $settings;
        $tenant->save();

        return response()->json($settings['ai']);
    }
}
