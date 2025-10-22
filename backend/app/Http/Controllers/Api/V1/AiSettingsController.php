<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiSettingsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $tenantId = $this->ensureTenantId($request);
        $tenant = Tenant::findOrFail($tenantId);

        $aiSettings = data_get($tenant->settings, 'ai', []);

        return response()->json([
            'model' => data_get($aiSettings, 'model'),
            'openai_key' => data_get($aiSettings, 'openai_key'),
            'prompt' => data_get($aiSettings, 'prompt'),
        ]);
    }
}
