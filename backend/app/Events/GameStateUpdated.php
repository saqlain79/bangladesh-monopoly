<?php

namespace App\Events;

use App\Models\GameRoom;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameStateUpdated implements ShouldBroadcast, ShouldDispatchAfterCommit
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public GameRoom $room) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('game-room.'.$this->room->code)];
    }

    public function broadcastAs(): string
    {
        return 'game.state.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'code' => $this->room->code,
            'status' => $this->room->status,
            'state' => $this->room->state,
            'players' => $this->room->players()->orderBy('seat')->get(),
        ];
    }
}
