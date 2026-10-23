<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('game_rooms', function (Blueprint $table) {
            $table->id();
            $table->string('code', 8)->unique();
            $table->string('name', 50);
            $table->string('status', 16)->default('lobby');
            $table->string('host_name', 24);
            $table->json('state')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('game_rooms'); }
};
