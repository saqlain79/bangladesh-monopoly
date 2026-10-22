# Monopoly Bangladesh

Bangladesh-themed browser board-game prototype with React + TypeScript, Laravel API, and MySQL room persistence.

## Local development

1. Set up the Laravel backend using `backend/SETUP.md`.
2. Copy `frontend/.env.example` to `frontend/.env.local` and confirm the API URL.
3. Run `npm install` and `npm run dev` inside `frontend`.
4. Open the frontend in two separate browsers, host a room in one, and join with the code in the other.

Room state is stored by Laravel and refreshed by polling. Reverb is not required for this MVP; it can be added later for push updates. Read `backend/SETUP.md` for current limitations and security notes.
