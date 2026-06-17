# Frontend Demo — Clickable Screen Prototype

Main React UI for the fantasy soccer app. It now talks to the Express backend in `../backend` through the Vite `/api` proxy.

**Aesthetic:** Matchday Light — soft grass-tinted background, pitch-green accents, white cards, classic football pitch visuals, Oswald + Source Sans 3 typography.

## Quick start

Start the backend first:

```bash
cd ../backend
npm install
npm run dev
```

Then start this frontend:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

The backend must have MongoDB and `API_FOOTBALL_KEY` configured in `backend/.env`.

## Screen map

| Screen | Route | Auth |
|--------|-------|------|
| Home Page | `/` | Public |
| Login | `/login` | Guest |
| Register | `/register` | Guest |
| Dashboard | `/dashboard` | Protected |
| Create Fantasy Team | `/team/create` | Protected |
| Player Selection | `/team/select` | Protected |
| My Team | `/team/my` | Protected |
| Leagues / Leaderboard | `/leagues`, `/leagues/:id` | Protected |

## User flow

1. **Home** (`/`) → Get Started → Register, or Sign in
2. **Login/Register** — real accounts are stored by the backend
3. **Dashboard** — overview + links to team and leagues
4. **Create Team** — name + formation → Continue
5. **Player Selection** — pick 11 players on pitch → Save
6. **My Team** — read-only lineup view → Edit returns to Player Selection
7. **Leagues** — create a league, share its code, or join another league by code

## Data source

- Auth, fantasy teams, leagues, memberships, and scores are stored in MongoDB
- Players, fixtures, and standings come from API-Football through `../backend`
- The old `src/mocks/` files are no longer used at runtime

## Backend connection

`vite.config.ts` proxies `/api` to `http://localhost:5000`.

Use `.env.example` if you want an explicit frontend env file:

```bash
VITE_API_URL=/api
```
