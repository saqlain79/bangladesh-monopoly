<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        RateLimiter::for('rooms', fn (Request $request): Limit => Limit::perMinute(10)
            ->by($request->session()->getId().'|'.$request->ip()));

        RateLimiter::for('game-actions', fn (Request $request): Limit => Limit::perMinute(60)
            ->by($request->session()->getId().'|'.$request->ip()));
    }
}
