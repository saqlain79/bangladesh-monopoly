<?php

namespace App\Http\Controllers;

use App\Events\GameStateUpdated;
use App\Http\Requests\GameActionRequest;
use App\Http\Requests\JoinGameRoomRequest;
use App\Http\Requests\StoreGameRoomRequest;
use App\Models\GameRoom;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class GameRoomController extends Controller
{
    public function show(GameRoom $room): Response
    {
        $room->load(['players' => fn ($query) => $query->orderBy('seat')]);

        return Inertia::render('Game', [
            'room' => $room,
            'playerId' => $room->players
                ->firstWhere('session_key', session()->getId())
                ?->id,
        ]);
    }

    public function store(StoreGameRoomRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $room = DB::transaction(function () use ($data): GameRoom {
            do {
                $code = Str::upper(Str::random(6));
            } while (GameRoom::query()->where('code', $code)->exists());

            $room = GameRoom::query()->create([
                'code' => $code,
                'name' => $data['name'],
                'host_name' => $data['player_name'],
                'status' => 'lobby',
                'state' => ['turn' => 0, 'properties' => [], 'dice' => null],
            ]);

            $room->players()->create([
                'session_key' => session()->getId(),
                'name' => $data['player_name'],
                'token' => '🛺',
                'cash' => 1500,
                'position' => 0,
                'seat' => 0,
                'is_connected' => true,
            ]);

            return $room;
        });

        return to_route('rooms.show', $room);
    }

    public function join(JoinGameRoomRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $room = GameRoom::query()->where('code', Str::upper($data['code']))->firstOrFail();

        $player = DB::transaction(function () use ($data, $room) {
            $lockedRoom = GameRoom::query()->whereKey($room->id)->lockForUpdate()->firstOrFail();

            if ($lockedRoom->status !== 'lobby') {
                throw ValidationException::withMessages(['code' => 'This game has already started.']);
            }

            if ($lockedRoom->players()->count() >= 6) {
                throw ValidationException::withMessages(['code' => 'This room is full.']);
            }

            if ($lockedRoom->players()->where('session_key', session()->getId())->exists()) {
                throw ValidationException::withMessages(['code' => 'This browser has already joined the room.']);
            }

            $player = $lockedRoom->players()->create([
                'session_key' => session()->getId(),
                'name' => $data['player_name'],
                'token' => ['🐯', '🐘', '🦚', '🐬', '🦌'][$lockedRoom->players()->count() - 1],
                'cash' => 1500,
                'position' => 0,
                'seat' => $lockedRoom->players()->count(),
                'is_connected' => true,
            ]);

            if ($lockedRoom->players()->count() >= 2) {
                $lockedRoom->update(['status' => 'playing']);
            }

            return $player;
        });

        $room->refresh()->load('players');
        broadcast(new GameStateUpdated($room));

        return to_route('rooms.show', $room);
    }

    public function action(GameActionRequest $request, GameRoom $room): RedirectResponse
    {
        $data = $request->validated();
        $updatedRoom = DB::transaction(function () use ($data, $room): ?GameRoom {
            $lockedRoom = GameRoom::query()->whereKey($room->id)->lockForUpdate()->firstOrFail();
            $players = $lockedRoom->players()->orderBy('seat')->lockForUpdate()->get();
            $player = $players->firstWhere('session_key', session()->getId());

            if ($player === null) {
                throw ValidationException::withMessages(['player' => 'This browser is not a player in this room.']);
            }

            $state = $lockedRoom->state ?? ['turn' => 0, 'properties' => [], 'dice' => null];

            if ($data['type'] === 'leave') {
                foreach ($state['properties'] ?? [] as $space => $ownerId) {
                    if ((int) $ownerId === $player->id) {
                        unset($state['properties'][$space]);
                    }
                }

                $player->delete();
                $remainingPlayers = $lockedRoom->players()->orderBy('seat')->get();

                if ($remainingPlayers->isEmpty()) {
                    $lockedRoom->delete();

                    return null;
                }

                $state['turn'] = 0;
                $state['dice'] = null;
                $lockedRoom->update([
                    'status' => $remainingPlayers->count() < 2 ? 'lobby' : 'playing',
                    'state' => $state,
                ]);

                return $lockedRoom->setRelation('players', $remainingPlayers);
            }

            if ($players->isEmpty() || $players[$state['turn'] % $players->count()]->id !== $player->id) {
                throw ValidationException::withMessages(['turn' => 'It is not your turn.']);
            }

            if ($data['type'] === 'roll') {
                if (! empty($state['dice'])) {
                    throw ValidationException::withMessages(['dice' => 'You already rolled this turn.']);
                }

                $firstDie = random_int(1, 6);
                $secondDie = random_int(1, 6);
                $oldPosition = $player->position;
                $newPosition = ($oldPosition + $firstDie + $secondDie) % 40;
                $cash = $player->cash + ($oldPosition + $firstDie + $secondDie >= 40 ? 200 : 0);

                if (in_array($newPosition, [4, 38], true)) {
                    $cash -= $newPosition === 4 ? 200 : 100;
                }

                if ($newPosition === 30) {
                    $newPosition = 10;
                }

                $player->update(['position' => $newPosition, 'cash' => $cash]);
                $state['dice'] = [$firstDie, $secondDie];
                $state['last_roll'] = ['player_id' => $player->id, 'from' => $oldPosition, 'to' => $newPosition];
            } elseif ($data['type'] === 'buy') {
                $space = (int) ($data['space_id'] ?? $player->position);
                $property = config("monopoly.spaces.{$space}");

                if (! $property || ! in_array($property['type'] ?? '', ['property', 'rail', 'utility'], true)) {
                    throw ValidationException::withMessages(['space_id' => 'This space cannot be purchased.']);
                }

                if (isset($state['properties'][$space])) {
                    throw ValidationException::withMessages(['space_id' => 'This property is already owned.']);
                }

                if ($player->position !== $space || $player->cash < $property['price']) {
                    throw ValidationException::withMessages(['space_id' => 'You cannot buy this property.']);
                }

                $player->decrement('cash', $property['price']);
                $state['properties'][$space] = $player->id;
            } elseif ($data['type'] === 'end_turn') {
                if (empty($state['dice'])) {
                    throw ValidationException::withMessages(['turn' => 'Roll before ending your turn.']);
                }

                $state['turn'] = ($state['turn'] + 1) % $players->count();
                $state['dice'] = null;
            }

            $lockedRoom->update(['state' => $state]);

            return $lockedRoom->load('players');
        });

        if ($updatedRoom === null) {
            return to_route('home');
        }

        broadcast(new GameStateUpdated($updatedRoom));

        return to_route('rooms.show', $updatedRoom);
    }
}
