<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GameRoomController;

Route::prefix('v1')->group(function () {
    Route::post('/rooms', [GameRoomController::class, 'store']);
    Route::post('/rooms/join', [GameRoomController::class, 'join']);
    Route::get('/rooms/{code}', [GameRoomController::class, 'show']);
    Route::post('/rooms/{code}/actions', [GameRoomController::class, 'action']);
});
