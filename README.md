# Bangladesh Monopoly — starter project

A Bangladesh-themed Monopoly-style browser game starter. The React client includes a playable local prototype (room lobby, 40-space board, dice, buying properties, rent, cards, turns). The board uses a refreshed compact, dark-navy layout with vivid property-group strips, active-position highlighting, and live turn/dice/player information in the center. Laravel files provide the API, persistence schema, room endpoints and Reverb broadcast event scaffolding for online private rooms.

## Stack
- Frontend: React + TypeScript + Vite
- Backend: Laravel 11/12-compatible structure, Sanctum-ready API, MySQL
- Realtime: Laravel Reverb / Laravel broadcasting

## Run the frontend prototype
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL. The current browser prototype is playable locally; its room codes are client-side demo codes and are not shared across browsers yet.

## Run the Laravel API
Create a Laravel project, then copy `backend/app`, `backend/database`, `backend/routes`, and `backend/config` into it:
```bash
composer create-project laravel/laravel backend-app
cd backend-app
composer require laravel/reverb
cp .env.example .env
php artisan key:generate
```
Set MySQL credentials in `.env`, then:
```bash
php artisan migrate
php artisan serve
```
For Reverb, configure `BROADCAST_CONNECTION=reverb` and the `REVERB_*` values in `.env`, then run:
```bash
php artisan reverb:start
```
See `backend/SETUP.md` for the intended copy/setup details.

## Current implementation boundary
- The frontend is a functional single-browser prototype, not yet production multiplayer.
- The Laravel API implements room creation/joining and a game-state action endpoint scaffold. The action handler is deliberately server-authoritative in structure; expand validation and turn rules before public deployment.
- Do not trust client-supplied dice rolls, balances, rent amounts, or ownership in production. Generate random values and calculate all game effects on the server.
- Add authentication, rate limiting, reconnect handling, transactions/row locks, tests and anti-cheat validation before launch.
