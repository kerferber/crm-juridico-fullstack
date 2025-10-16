<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\ContactController;
use App\Http\Controllers\Api\V1\LawsuitController;
use App\Http\Controllers\Api\V1\TaskController;
use App\Http\Controllers\Api\V1\CalendarEventController;
use App\Http\Controllers\Api\V1\TransactionController;
use App\Http\Controllers\Api\V1\GamificationController;
use App\Http\Controllers\Api\V1\DashboardController;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('users', UserController::class)->only(['index','show','update','destroy']);
    Route::apiResource('contacts', ContactController::class);
    Route::apiResource('lawsuits', LawsuitController::class);
    Route::put('lawsuits/{id}/kanban', [LawsuitController::class, 'updateKanban']);
    Route::apiResource('tasks', TaskController::class);
    Route::put('tasks/{id}/status', [TaskController::class, 'updateStatus']);
    Route::apiResource('calendar-events', CalendarEventController::class);
    Route::apiResource('transactions', TransactionController::class);

    // Aggregations / Reports
    Route::get('dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('management/agility', [DashboardController::class, 'agility']);
    Route::get('management/productivity', [DashboardController::class, 'productivity']);
    Route::get('management/office', [DashboardController::class, 'office']);

    // Gamification
    Route::get('gamification/status', [GamificationController::class, 'status']);
    Route::get('gamification/ranking', [GamificationController::class, 'ranking']);
});
