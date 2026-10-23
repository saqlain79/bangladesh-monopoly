<?php

use App\Http\Controllers\GameRoomController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => Inertia::render('Landing'))->name('home');

Route::get('/rooms/{room:code}', [GameRoomController::class, 'show'])->name('rooms.show');
Route::post('/rooms', [GameRoomController::class, 'store'])
    ->middleware('throttle:rooms')
    ->name('rooms.store');
Route::post('/rooms/join', [GameRoomController::class, 'join'])
    ->middleware('throttle:rooms')
    ->name('rooms.join');
Route::post('/rooms/{room:code}/actions', [GameRoomController::class, 'action'])
    ->middleware('throttle:game-actions')
    ->name('rooms.actions');
