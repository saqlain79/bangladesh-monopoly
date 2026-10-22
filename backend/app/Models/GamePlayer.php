<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GamePlayer extends Model
{
    protected $fillable = ['game_room_id', 'name', 'token', 'cash', 'position', 'seat', 'is_connected', 'is_bankrupt'];

    public function room(): BelongsTo
    {
        return $this->belongsTo(GameRoom::class, 'game_room_id');
    }
}
