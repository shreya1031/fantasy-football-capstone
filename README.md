Fantasy Soccer League Web Application

A full-stack MERN web application that allows users to create and manage fantasy soccer teams using real-world soccer data. Users can build teams, join leagues, earn fantasy points based on live player performances, and compete against other users through dynamic leaderboards and rankings.

## Project Overview

The Fantasy Soccer League Web Application is designed for soccer fans who want an interactive fantasy sports experience similar to professional fantasy football platforms. The application integrates real-world soccer statistics through the API-Football API and converts player performances into fantasy points using custom scoring logic.

Users can:

- Register and log into the platform
- Create and manage fantasy soccer teams
- Select real-world soccer players
- Join or create fantasy leagues
- Track fantasy points and rankings
- View fixtures, standings, and player statistics
- Compete against other users through leaderboards

## Technology Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Motion, React Query, Zustand |
| Backend | Node.js, Express 5, Mongoose 8 |
| Database | MongoDB |
| Auth | JWT (access) + httpOnly refresh cookie, bcrypt |
| External API | API-Football (TTL-proxied via LRU + Mongo write-through cache) |

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- [API-Football](https://www.api-football.com/) API key

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secrets, and API-Football key
npm install
npm run dev
```

API runs at `http://localhost:5000`. Health check: `GET /api/health`.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App runs at `http://localhost:5173`.

### Frontend Demo (no backend)

For UI/UX user testing without MongoDB or the API:

```bash
cd frontend-demo
npm install
npm run dev
```

Any email/password works on login. Screen flow: Home → Register/Login → Dashboard → Create Team → Player Selection → My Team → Leagues. Join code `DEMO42` for testing. See [frontend-demo/README.md](frontend-demo/README.md).

### Tests

```bash
cd backend
npm test
```

## Architecture

- **Single sports data gateway** — all API-Football calls go through `services/sportsData.js` with per-endpoint TTL caching and single-flight deduplication.
- **Score-on-read** — fantasy points are computed when requested, persisted in `GameweekScore`, and idempotent for finished gameweeks.
- **Clean UI mental model** — left-rail nav, live fixture ticker, one primary action per screen.

## Deployment

| Service | Suggested host |
|---------|----------------|
| Backend | [Render](https://render.com) or [Railway](https://railway.app) |
| Database | [MongoDB Atlas](https://www.mongodb.com/atlas) |
| Frontend | [Vercel](https://vercel.com) |

Set environment variables from `backend/.env.example` and `frontend/.env.example` on each platform. Point `CORS_ORIGIN` to your frontend URL and `VITE_API_URL` to your deployed API.

## Features

- User authentication (register, login, JWT, protected routes)
- Fantasy team management (CRUD, formation validation, duplicate prevention)
- Player & match data (players, fixtures, standings via API-Football proxy)
- Fantasy scoring (goals, assists, clean sheets, saves, cards, captain bonus)
- League & leaderboard system (create/join by 6-char code, gameweek rankings)
- Responsive UI with Retro Arcade Telecast aesthetic (restrained for data legibility)
