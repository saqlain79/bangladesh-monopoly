<?php

namespace App\Http\Controllers;

use App\Events\GameStateUpdated;
use App\Models\GamePlayer;
use App\Models\GameRoom;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class GameRoomController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:50'],
            'player_name' => ['required', 'string', 'min:2', 'max:24'],
        ]);
        $code = strtoupper(Str::random(6));
        $room = DB::transaction(function () use ($data, $code) {
            $room = GameRoom::create([
                'code' => $code, 'name' => $data['name'], 'host_name' => $data['player_name'],
                'status' => 'lobby', 'state' => ['turn' => 0, 'properties' => [], 'dice' => null],
            ]);
            $room->players()->create([
                'name' => $data['player_name'], 'token' => '🛺', 'cash' => 1500,
                'position' => 0, 'seat' => 0, 'is_connected' => true,
            ]);
            return $room->load('players');
        });
        return response()->json(['data' => $room], 201);
    }

    public function join(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'size:6'],
            'player_name' => ['required', 'string', 'min:2', 'max:24'],
        ]);
        $room = GameRoom::where('code', strtoupper($data['code']))->firstOrFail();
        $player = DB::transaction(function () use ($room, $data) {
            $locked = GameRoom::whereKey($room->id)->lockForUpdate()->firstOrFail();
            if ($locked->status !== 'lobby') {
                throw ValidationException::withMessages(['room' => 'This game has already started.']);
            }
            if ($locked->players()->count() >= 6) {
                throw ValidationException::withMessages(['room' => 'This room is full.']);
            }
            return $locked->players()->create([
                'name' => $data['player_name'], 'token' => '🐯', 'cash' => 1500,
                'position' => 0, 'seat' => $locked->players()->count(), 'is_connected' => true,
            ]);
        });
        $room->refresh()->load('players');
        broadcast(new GameStateUpdated($room));
        return response()->json(['data' => ['player' => $player, 'room' => $room]], 201);
    }

    public function show(string $code): JsonResponse
    {
        $room = GameRoom::where('code', strtoupper($code))->with(['players' => fn ($q) => $q->orderBy('seat')])->firstOrFail();
        return response()->json(['data' => $room]);
    }

    public function action(Request $request, string $code): JsonResponse
    {
        $data = $request->validate([
            'player_id' => ['required', 'integer'],
            'type' => ['required', 'in:start,roll,buy,end_turn'],
            'space_id' => ['nullable', 'integer', 'between:0,39'],
        ]);
        $room = DB::transaction(function () use ($code, $data) {
            $room = GameRoom::where('code', strtoupper($code))->lockForUpdate()->firstOrFail();
            $players = $room->players()->orderBy('seat')->lockForUpdate()->get();
            $player = $players->firstWhere('id', (int) $data['player_id']);
            if (!$player) throw ValidationException::withMessages(['player_id' => 'Player is not in this room.']);
            $state = $room->state ?? ['turn' => 0, 'properties' => [], 'dice' => null];
            if ($players->isEmpty() || $players[$state['turn'] % $players->count()]->id !== $player->id) {
                throw ValidationException::withMessages(['turn' => 'It is not this player’s turn.']);
            }

            // MVP server-authoritative dice and movement. Expand with a complete space registry,
            // rent calculation, cards, jail, mortgages, trades and building before public launch.
            if ($data['type'] === 'start') {
                if ($room->status !== 'lobby') throw ValidationException::withMessages(['room' => 'Game already started.']);
                if ($players->count() < 2) throw ValidationException::withMessages(['room' => 'At least two players are required.']);
                $room->status = 'playing';
            } elseif ($data['type'] === 'roll') {
                if (!empty($state['dice'])) throw ValidationException::withMessages(['dice' => 'You already rolled this turn.']);
                $a = random_int(1, 6); $b = random_int(1, 6);
                $old = $player->position; $new = ($old + $a + $b) % 40;
                $cash = $player->cash + ($old + $a + $b >= 40 ? 200 : 0);
                $space = $new;
                if (in_array($space, [4, 38], true)) $cash -= ($space === 4 ? 200 : 100);
                if ($space === 30) $new = 10;
                $player->update(['position' => $new, 'cash' => $cash]);
                $state['dice'] = [$a, $b];
                $state['last_roll'] = ['player_id' => $player->id, 'from' => $old, 'to' => $new];
            } elseif ($data['type'] === 'buy') {
                $space = (int) ($data['space_id'] ?? $player->position);
                $registry = config('monopoly.spaces', []);
                $property = $registry[$space] ?? null;
                if (!$property || !in_array($property['type'] ?? '', ['property', 'rail', 'utility'], true)) {
                    throw ValidationException::withMessages(['space_id' => 'This space cannot be purchased.']);
                }
                if (isset($state['properties'][$space])) throw ValidationException::withMessages(['space_id' => 'This property is already owned.']);
                if ($player->position !== $space) throw ValidationException::withMessages(['space_id' => 'You are not on this space.']);
                if ($player->cash < $property['price']) throw ValidationException::withMessages(['cash' => 'Not enough cash.']);
                $player->decrement('cash', $property['price']);
                $state['properties'][$space] = $player->id;
            } elseif ($data['type'] === 'end_turn') {
                if (empty($state['dice'])) throw ValidationException::withMessages(['turn' => 'Roll before ending your turn.']);
                $state['turn'] = ($state['turn'] + 1) % $players->count();
                $state['dice'] = null;
            }
            $room->state = $state;
            $room->save();
            return $room->load('players');
        });
        broadcast(new GameStateUpdated($room));
        return response()->json(['data' => $room]);
    }
}
