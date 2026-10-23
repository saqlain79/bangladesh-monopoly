<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('game_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_room_id')->constrained('game_rooms')->cascadeOnDelete();
            $table->string('name', 24);
            $table->string('token', 12)->default('🛺');
            $table->unsignedInteger('cash')->default(1500);
            $table->unsignedTinyInteger('position')->default(0);
            $table->unsignedTinyInteger('seat');
            $table->boolean('is_connected')->default(false);
            $table->boolean('is_bankrupt')->default(false);
            $table->timestamps();
            $table->unique(['game_room_id', 'seat']);
        });
    }
    public function down(): void { Schema::dropIfExists('game_players'); }
};
