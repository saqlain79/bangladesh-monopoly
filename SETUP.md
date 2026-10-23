# Laravel API setup for Monopoly Bangladesh

These files are a backend module for a fresh Laravel 11/12 application. The browser uses the Laravel API and polls room state every ~1.8 seconds, so basic shared-room play does not require Reverb to be configured. Reverb can be added for lower-latency updates later.

## 1. Create the Laravel backend

```bash
composer create-project laravel/laravel backend-app
cd backend-app
php artisan install:api
```

Copy this project's `backend/app/Models`, `backend/app/Http/Controllers/GameRoomController.php`, `backend/database/migrations`, `backend/config/monopoly.php`, and `backend/routes/api.php` into the new Laravel project. If Laravel already has a `routes/api.php`, merge the `v1` routes instead of overwriting unrelated routes.

## 2. Configure MySQL

Create a MySQL database named `bangladesh_monopoly`, then configure `.env`:

```env
APP_URL=http://127.0.0.1:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=bangladesh_monopoly
DB_USERNAME=root
DB_PASSWORD=
```

Run:

```bash
php artisan key:generate
php artisan migrate
php artisan serve --host=0.0.0.0 --port=8000
```

## 3. Configure the frontend

In `frontend`, copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL` to the reachable Laravel API, including `/api/v1`. For local development, `http://127.0.0.1:8000/api/v1` is correct. Restart Vite after changing the environment file:

```bash
npm install
npm run dev -- --host 0.0.0.0
```

When testing on another device on your LAN, use the host computer's LAN IP instead of `127.0.0.1` in the frontend API URL. Configure Laravel CORS to allow the frontend origin (for example `http://localhost:5173`). If the frontend and API are on different origins, ensure Laravel's `config/cors.php` allows `api/*`, the frontend origin, and `POST, GET, OPTIONS` methods.

## MVP behavior and limitations

- Room codes and players are stored in MySQL, not generated locally.
- The host creates a room; another browser joins with the six-character code.
- The second player starts shared play automatically; both browsers poll the server for updates.
- Dice, movement, cash, property ownership, and turn order are handled by the Laravel action endpoint.
- The current rules engine is an MVP, not a complete Monopoly implementation: rent/card handling, jail rules, doubles, bankruptcy, and full validation need more work.
- This scaffold does not yet authenticate player ownership. Do not expose it publicly until player-session tokens, rate limiting, and stronger authorization are implemented.
