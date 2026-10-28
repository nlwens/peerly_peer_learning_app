# Peerly

Turborepo monorepo: Expo app in `client/`, ASP.NET Core API in `server/`.

## Prerequisites

- Node.js 20+
- .NET SDK 10
- Docker (Postgres + server tests)
- For the app: Android Studio / Expo Go on the same Wi‑Fi

## Setup

```sh
npm install
docker compose -f server/compose.yaml up -d
cd server && dotnet tool restore && dotnet ef database update --project src && cd ..
npm run dev                  # both; or: npm run dev:client / npm run dev:server
```

API: `http://localhost:3000` · Swagger `/swagger` · health `/health`  
Root scripts: `lint` · `typecheck` · `test` · `build`

## Client

Expo DevTools shows a QR code. In the terminal:

- `a` — Android emulator
- `s` — Expo Go (phone must be on the same Wi‑Fi)
- open the “Web is waiting on …” URL for browser

Demo logins: `alice@example.com` / `bob@example.com` · password `password123`  
(More seeds in `client/scripts/seedUsers.ts`.)

Port busy → `npx expo start --port <n>`. QR unreachable → same Wi‑Fi, or `npx expo start --tunnel`. Stale app data → wipe the emulator / `adb shell pm clear com.anonymous.client`.

## Server

Code in `server/src` (Controllers / Services / Dtos / Models / Data / Hubs); tests in `server/tests`.

| Setting | Env var |
| --- | --- |
| Postgres | `ConnectionStrings__Peerly` |
| JWT secret (≥32 chars) | `Jwt__Secret` |

```sh
cd server
dotnet ef migrations add <Name> --project src --output-dir Data/Migrations
dotnet ef database update --project src
```

Tests need Docker (Testcontainers). Override with `TEST_DATABASE_CONNECTION_STRING` if needed (CI does).

SignalR hub: `/hubs/peerly` — `ReceiveMessage`, `RequestCreated` / `Updated` / `Deleted`; send with `SendMessage(receiverId, content)`.
