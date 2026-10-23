<?php

use App\Models\GamePlayer;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('game-room.{code}', function ($user, string $code): bool {
    return GamePlayer::query()
        ->where('session_key', session()->getId())
        ->whereHas('room', fn ($query) => $query->where('code', $code))
        ->exists();
});
