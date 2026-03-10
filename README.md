# Volleyball Rotation Visualizer

A web app for visualizing volleyball rotations. Users can drag players on an interactive court, draw arrows to represent routes, save lineups and rotation configs with auth, export rotation sheets as PDF, and use a “Plan ahead” view to compare two teams’ rotations side by side to see potential matchups. Built for coaches and players who want to move from paper diagrams to a digital, exportable tool.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture overview](#architecture-overview-vercel--railway)
- [Key design decisions](#key-frontend-and-backend-design-decisions)
- [How it works](#how-the-system-works-end-to-end)
- [Setup instructions](#setup-instructions)
- [Examples / How to use](#examples--how-to-use)
- [Project structure](#project-structure)
- [Environment variables reference](#environment-variables-reference)

---

## Features

- **Interactive court** — Drag players on a canvas court, draw arrows or custom routes, while enforcing rules of volleyball rotations.
- **Save lineups and configs** — Store lineups and rotation configurations in your account (Firebase sign-in); load them anytime.
- **Plan ahead** — Compare two teams’ rotations side by side to see blocking match-ups.
- **PDF export** — Export a one-page rotation sheet (tables + court diagrams) from the visualizer.
- **Use without signing in** — Use the visualizer and plan-ahead without auth; sign in when you want to save or sync.

---

## Tech stack

**Front end**
- React, TypeScript, Vite
- react-konva (canvas court)
- Firebase Auth
- pdf-lib (PDF export)

**Back end**
- FastAPI
- PostgreSQL (Supabase)
- Firebase (Auth)

---

## Architecture overview

The app runs as a static front end on Vercel and an API on Railway. When a user opens the site, the browser loads the React app from Vercel. When the user signs in, the front end uses Firebase to get an ID token and sends that token with every request to the backend. The backend (FastAPI on Railway) receives requests at `/lineups` and `/configs`, verifies the token with Firebase’s public keys, and then reads or writes data in PostgreSQL on Supabase. Lineups and configs are stored per user (by Firebase `uid`).

---

## Key frontend and backend design decisions

**Frontend**

- **Single-page app:** One React app; routing is client-side. Vercel rewrites ensure non-API paths serve `index.html`.
- **Canvas court:** The court is drawn with **react-konva** (Rect, Line, Circle) instead of an image asset, so it scales and stays sharp; players are draggable nodes. Why React-Konva? Using react-konva allowed the court to be rendered as vector shapes instead of a static image. This makes the court scalable and allows player nodes to be draggable without complex  calculations.
- **State:** Main UI state lives in a custom hook (`useVisualizerState`) and is passed via context to the visualizer and plan-ahead views. Lineups and configs are synced with the backend when the user is signed in; otherwise they can use local-only storage for demos.
- **API client:** One `api/client.ts` that builds the request URL from `VITE_API_URL`, sends the Firebase token, and handles JSON and errors. Same code path for local (localhost backend) and production (Railway).

**Backend**

- **Auth:** Every protected route depends on `get_current_user_id`, which validates the Bearer token with Firebase’s public keys and returns the `uid`. No sessions; stateless JWT verification.
- **ORM:** SQLAlchemy with asyncpg. Two tables: `lineups` (user_id, name, payload JSONB, show_number, show_name) and `visualizer_configs` (user_id, name, system, rotations JSONB). Tables are created and managed in Supabase; the app does not run `create_all` at startup.
- **Schemas:** Pydantic models for request/response (Create, Update, Out) with validation and camelCase serialization for the frontend. Names and lengths are validated; optional fields for updates.
- **Rate limiting:** SlowAPI with a default of 20 requests per minute per client IP to reduce abuse.

---

## How the system works end to end

1. **User opens the app** (Vercel URL). The React app loads; Firebase SDK initializes. If the user is not signed in, they can still use the visualizer and plan-ahead with local state, but saving lineups/configs requires sign-in.
2. **Sign-in:** User signs in with Firebase (e.g. email/password or Google). The frontend holds the ID token and sends it on every request to the backend.
3. **Visualizer tab:** User picks between 5-1, 6-2 (types of rotations) and rotation number (1-6), loads a lineup (optional), and drags players on the court. They can save the current rotation set as a “config” and save the lineup. Both are sent to the backend and stored in Postgres keyed by `user_id`.
4. **Plan ahead tab:** User sets two teams (lineups, systems, starting rotations, serve). The view shows two courts side by side for comparison.
5. **Export:** From the visualizer, the user can export a one-page PDF (rotation tables + court diagrams). The PDF is generated in the browser with pdf-lib and either downloaded or previewed in a modal.
6. **Backend:** Requests to `/lineups` and `/configs` are validated, then the app reads/writes Postgres returns JSON.

---

## Setup instructions for running locally

### Prerequisites

- Node.js 18+ and npm
- Python 3.12+
- A Firebase project (Auth enabled)
- A Supabase project (Postgres)

### Running locally

1. **Clone and install**

   ```bash
   git clone https://github.com/jwu2002/Volleyball-Rotation-Visualizer.git
   cd Volleyball-Rotation-Visualizer
   cd frontend && npm install
   cd ../backend && python -m venv .venv && .venv\Scripts\activate   # Windows
   pip install -r requirements.txt
   ```

2. **Backend env** (in `backend/.env`)

   - `DATABASE_URL` — Supabase Session pooler connection string (URI with port 6543).
   - `FIREBASE_PROJECT_ID` — Your Firebase project ID (for token verification).

3. **Frontend env** (in `frontend/.env.local`)

   - `VITE_API_URL` — Backend URL, e.g. `http://localhost:8000`.
   - Firebase: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID` (from Firebase Console).

4. **Run**

   - Backend: `cd backend && uvicorn main:app --reload --port 8000`
   - Frontend: `cd frontend && npm run dev`
   - Open `http://localhost:5173`.



### Demo account

Create demo account

---

## Examples / How to use

### Understanding 5-1 rotations

Quick video on 5-1:

https://www.youtube.com/watch?v=pi7Lf6uO7dE

Credit: https://www.youtube.com/@SDVolleyballVideos


### From paper to app

Put image here

### What you can do in the app

Put screenshot here

### PDF export

The app can export a one-page rotation sheet (tables + court diagrams) from the Visualizer tab via **File → Export**. Preview in the modal, then save the PDF.

---

## Project structure

```
Volleyball-Rotation-Visualizer/
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── api/              # Backend API client (lineups, configs)
│   │   ├── components/       # Court, PlanAhead, Modals, AppHeader, etc.
│   │   ├── data/             # Default 5-1 / 6-2 rotation data
│   │   ├── hooks/            # useAuth, useVisualizerState
│   │   ├── storage/          # configStorage (sync with backend + local fallback)
│   │   ├── styles/           # CSS per view/component
│   │   ├── types/            # savedConfig types
│   │   ├── utils/            # lineupHelpers, visualizerRotations, etc.
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── firebaseConfig.ts
│   │   └── constants.ts
│   ├── index.html
│   ├── vercel.json           
│   └── package.json
├── backend/                  # FastAPI
│   ├── api/
│   │   ├── deps.py           # Auth, slowapi rate limiter
│   │   └── routes/           # lineups.py, configs.py
│   ├── config.py             # Settings from env
│   ├── db/                   # session.py, base.py
│   ├── models/               # SQLAlchemy ORM: Lineup, VisualizerConfig
│   ├── schemas/              # Create, Update
│   ├── main.py
│   └── requirements.txt
└── README.md
```

---

## Environment variables reference

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_API_URL` | Frontend | Backend base URL (e.g. `http://localhost:8000` or Railway URL). |
| `VITE_FIREBASE_*` | Frontend | Firebase project config (apiKey, authDomain, projectId, etc.). |
| `DATABASE_URL` | Backend | Postgres connection string (Supabase Session pooler recommended). |
| `FIREBASE_PROJECT_ID` | Backend | Firebase project ID for ID token verification. |
| `CORS_ORIGINS` | Backend | Comma-separated allowed origins (e.g. Vercel URL). |
| `RATE_LIMIT` | Backend | Optional; default `20/minute`. |

---

