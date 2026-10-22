# Laravel backend integration

These files are intended to be copied into a fresh Laravel 11/12 application. The `App\Models` files assume the standard `App\` namespace.

## Install
```bash
composer create-project laravel/laravel backend-app
cd backend-app
composer require laravel/reverb
```
Copy this folder's `app/`, `database/`, and `routes/api.php` into the Laravel project. Add `BroadcastServiceProvider`/broadcasting configuration as appropriate for your Laravel version, configure `.env`, then run `php artisan migrate`.

## Environment
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=bangladesh_monopoly
DB_USERNAME=root
DB_PASSWORD=
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=local-app
REVERB_APP_KEY=local-key
REVERB_APP_SECRET=local-secret
REVERB_HOST=127.0.0.1
REVERB_PORT=8080
REVERB_SCHEME=http
```

This scaffold intentionally leaves production authentication policy open: protect room creation/joining/actions with Laravel Sanctum or your chosen auth. Never expose private game channels without authorization.
