# Monopoly Bangladesh Lobby

The frontend now opens on a landing/lobby screen. Enter a player name, then choose **Host a game** or enter a room code and choose **Join game**. Hosting generates a room code in the browser. The Lobby button in the game screen returns to the landing page.

## Multiplayer status
This is a frontend prototype. Room-code validation and screen transitions work locally, but rooms are not yet shared between browsers. Real hosted rooms require Laravel API endpoints to create/find rooms and persist players/game state, plus Laravel Reverb (or another realtime transport) for live join/turn updates.

## Run locally

```bash
cd frontend
npm install
npm run dev
```
