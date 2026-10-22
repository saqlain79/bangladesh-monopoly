<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GameRoom extends Model
{
    protected $fillable = ['code', 'name', 'status', 'host_name', 'state'];
    protected $casts = ['state' => 'array'];

    public function players(): HasMany
    {
        return $this->hasMany(GamePlayer::class);
    }
}
