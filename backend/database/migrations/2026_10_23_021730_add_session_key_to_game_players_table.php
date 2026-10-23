<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('game_players', function (Blueprint $table): void {
            $table->string('session_key', 64)->nullable()->unique()->after('game_room_id');
        });
    }

    public function down(): void
    {
        Schema::table('game_players', function (Blueprint $table): void {
            $table->dropUnique(['session_key']);
            $table->dropColumn('session_key');
        });
    }
};
