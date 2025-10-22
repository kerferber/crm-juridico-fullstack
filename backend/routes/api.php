<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Admin\AdminAiSettingsController;
use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\AdminMetricsController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\LawsuitController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Api\V1\CalendarEventController;
use App\Http\Controllers\Api\V1\TransactionController;
use App\Http\Controllers\Api\V1\GamificationController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\TenantController;
use App\Http\Controllers\Api\V1\AiSettingsController;
use App\Http\Controllers\Api\V1\PaymentScheduleController;
use App\Http\Controllers\Api\V1\PaymentInstallmentController;

Route::prefix('admin')->group(function () {
    Route::post('login', [AdminAuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'admin.auth'])->group(function () {
        Route::post('logout', [AdminAuthController::class, 'logout']);
        Route::get('tenants', [TenantController::class, 'index']);
        Route::post('tenants', [TenantController::class, 'store']);
        Route::delete('tenants/{tenant}', [TenantController::class, 'destroy']);
        Route::get('metrics/overview', [AdminMetricsController::class, 'overview']);
        Route::get('metrics/timeseries', [AdminMetricsController::class, 'timeseries']);
        Route::get('tenants/{tenant}/ai-settings', [AdminAiSettingsController::class, 'show']);
        Route::put('tenants/{tenant}/ai-settings', [AdminAiSettingsController::class, 'update']);
    });
});

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
    });
});

$registerProtectedRoutes = function () {
    Route::apiResource('users', UserController::class)->only(['index','show','store','update','destroy']);
    Route::apiResource('contacts', ContactController::class);
    Route::apiResource('lawsuits', LawsuitController::class);
    Route::put('lawsuits/{id}/kanban', [LawsuitController::class, 'updateKanban']);
    Route::apiResource('tasks', TaskController::class);
    Route::put('tasks/{id}/status', [TaskController::class, 'updateStatus']);
    Route::apiResource('calendar-events', CalendarEventController::class);
    Route::apiResource('transactions', TransactionController::class);
    Route::get('ai-settings', [AiSettingsController::class, 'show']);
    Route::get('payment-schedules', [PaymentScheduleController::class, 'index']);
    Route::post('payment-schedules', [PaymentScheduleController::class, 'store']);
    Route::get('payment-schedules/{paymentSchedule}', [PaymentScheduleController::class, 'show']);
    Route::put('payment-schedules/{paymentSchedule}', [PaymentScheduleController::class, 'update']);
    Route::delete('payment-schedules/{paymentSchedule}', [PaymentScheduleController::class, 'destroy']);
    Route::post('payment-installments/{paymentInstallment}/mark-paid', [PaymentInstallmentController::class, 'markPaid']);

    // Aggregations / Reports
    Route::get('dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('management/agility', [DashboardController::class, 'agility']);
    Route::get('management/productivity', [DashboardController::class, 'productivity']);
    Route::get('management/office', [DashboardController::class, 'office']);

    // Gamification
    Route::get('gamification/status', [GamificationController::class, 'status']);
    Route::get('gamification/ranking', [GamificationController::class, 'ranking']);
};

if (config('app.disable_api_auth')) {
    // Auth is temporarily disabled via DISABLE_API_AUTH env flag.
    $registerProtectedRoutes();
} else {
    Route::middleware('auth:sanctum')->group($registerProtectedRoutes);
}
