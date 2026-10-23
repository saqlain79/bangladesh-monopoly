<?php

use App\Events\GameStateUpdated;
use App\Models\GameRoom;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;

it('creates a room for the browser session and redirects to its game page', function () {
    Str::createRandomStringsUsing(fn (): string => 'DHAKA7');

    $response = $this->post('/rooms', [
        'name' => 'Friday Night Game',
        'player_name' => 'Ayesha',
    ]);

    $room = GameRoom::query()->where('code', 'DHAKA7')->firstOrFail();

    $response->assertRedirect(route('rooms.show', $room));
    $this->assertDatabaseHas('game_players', [
        'game_room_id' => $room->id,
        'name' => 'Ayesha',
        'session_key' => session()->getId(),
    ]);

    Str::createRandomStringsNormally();
});

it('renders the game page with the session player identity', function () {
    Str::createRandomStringsUsing(fn (): string => 'DHAKA7');

    $this->post('/rooms', [
        'name' => 'Friday Night Game',
        'player_name' => 'Ayesha',
    ]);

    $room = GameRoom::query()->where('code', 'DHAKA7')->firstOrFail();
    $player = $room->players()->firstOrFail();

    $response = $this->get(route('rooms.show', $room));

    $response->assertOk();
    $response->assertViewIs('app');
    $response->assertViewHas('page.component', 'Game');
    $response->assertViewHas('page.props.playerId', $player->id);

    Str::createRandomStringsNormally();
});

it('rejects a game action from a different browser session', function () {
    $room = GameRoom::query()->create([
        'code' => 'DHAKA7',
        'name' => 'Friday Night Game',
        'host_name' => 'Ayesha',
        'state' => ['turn' => 0, 'properties' => [], 'dice' => null],
    ]);
    $room->players()->create([
        'session_key' => 'another-browser-session',
        'name' => 'Ayesha',
        'token' => '🛺',
        'cash' => 1500,
        'position' => 0,
        'seat' => 0,
        'is_connected' => true,
    ]);

    $response = $this->from(route('rooms.show', $room))->post(route('rooms.actions', $room), [
        'type' => 'roll',
    ]);

    $response->assertRedirect(route('rooms.show', $room));
    $response->assertSessionHasErrors('player');
});

it('broadcasts a state update after a valid roll', function () {
    Event::fake([GameStateUpdated::class]);
    Str::createRandomStringsUsing(fn (): string => 'DHAKA7');

    $this->post('/rooms', [
        'name' => 'Friday Night Game',
        'player_name' => 'Ayesha',
    ]);

    $room = GameRoom::query()->where('code', 'DHAKA7')->firstOrFail();
    $room->update(['status' => 'playing']);

    $response = $this->from(route('rooms.show', $room))->post(route('rooms.actions', $room), ['type' => 'roll']);

    $response->assertRedirect(route('rooms.show', $room));
    Event::assertDispatched(GameStateUpdated::class);

    Str::createRandomStringsNormally();
});
