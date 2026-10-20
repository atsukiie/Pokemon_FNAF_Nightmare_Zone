# Pokemon_FNAF_Nightmare_Zone
Pokémon × FNAF: Nightmare Zone is a browser-based horror mini-game inspired by Pokémon Mezastar. Players select Pokémon, battle Ghost-types and hostile animatronics, and survive nights in an abandoned pizzeria. Gameplay data powers four analytics types to explain results, uncover patterns, predict survival, and recommend strategies.

## Technology Stack

| Part | Framework / Technology |
| --- | --- |
| Frontend | Next.js + React |
| Backend | NestJS |
| Database | Supabase (PostgreSQL) |
| 3D graphics | Three.js |
| Styling | CSS |

## Project structure

```text
frontend/                 Next.js App Router + React + CSS
  src/app/                Admin dashboard and responsive CSS
  src/components/         Interactive charts, icons, optional Three.js scene
  src/lib/dashboard.ts    Typed records, sample fixtures, analytics
  public/                 Bundled artwork, fonts, and attribution
backend/                  NestJS REST API
  src/supabase/           Supabase PostgreSQL client service
  src/gameplay/           Adapter for the game's existing Supabase records
  supabase/migrations/    Legacy alternate schema (not used by the game adapter)
```

## Local setup

Use Node.js 22.12+ (Node.js 24 recommended) and npm. Run commands from the repository root. On Windows PowerShell, use `npm.cmd` if execution policy blocks `npm`.

```powershell
npm.cmd install
Copy-Item frontend/.env.local.example frontend/.env.local
Copy-Item backend/.env.example backend/.env
```

The configured local backend reads the neighboring game's server environment through `GAME_ENV_FILE=../../PokemonzApp/backend-gameplay/api/.env`, resolved from the `backend` working directory. No credentials are copied into the frontend. Alternatively, set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` directly in the ignored `backend/.env`. Never put the service-role key in a `NEXT_PUBLIC_` variable.

Start the dashboard from the repository root:

```powershell
npm.cmd run dev
```

This starts the dashboard frontend at http://localhost:3000 and its NestJS backend at http://127.0.0.1:3002. The separate game API remains on port 3001. In PowerShell, `npm.cmd` avoids the script execution policy that can block `npm.ps1`. Stop already running dashboard development servers before starting both together.

To run the frontend and backend separately, use two terminals:

```powershell
npm.cmd run dev:frontend
```

```powershell
npm.cmd run dev:backend
```

Frontend: http://localhost:3000

Dashboard backend health: http://127.0.0.1:3002/api/health

Open **http://localhost:3000** for the dashboard UI. Port 3002 serves its backend API; its root URL redirects to the frontend configured by `FRONTEND_URL`.

The dashboard defaults to **Connected game** mode and loads actual records. Settings also offers a clearly marked sample workspace with five fictional trainers and 100 fictional battles; your mode preference is saved locally. Connection failures never silently substitute sample data. The health endpoint reports credential configuration; `GET /api/dashboard` verifies actual database reads.

## Admin dashboard

The Player Status screen includes Pokémon cards, search, night/session/condition filters, current roster summaries, four chart metrics, sortable player statistics, a paginated table, and player detail dialogs. Team Overview has a separate team-level layout: healthy-and-active readiness, Pokémon type composition, member comparisons, team performance, night-by-night results, opponent matchup evidence, and recovery priorities. Both views use the same filtered records. Analytics Dashboard explains the four analytics categories. Strategy Center contains a local review list; applying a recommendation does not mutate gameplay. Settings switches between sample and actual records and controls 30-second polling.

All battle statistics, recommendations, and correlations are derived from the selected records. In live mode, roster HP represents the **latest completed encounter**, independently of historical period filters. Conditions are explicitly labeled HP-based heuristics: zero HP → Critical; ≤40% → Injured; ≤60% → Tired; otherwise Healthy. These are dashboard labels, not conditions persisted by the game. Missing HP is Unknown. The game resets HP for each new night, so these are historical damage-review flags, not claims about a currently injured player. Level and current activity are not recorded and display as unavailable. Historical Wilson intervals are exploratory uncertainty estimates, not validated forecasts.

### Connect the separate game repository

The existing `../PokemonzApp` game repository was inspected read-only. Its source and database schema were not modified. The integration uses its existing `players`, `encounters`, `pokemon`, and related `turns` records. It does not require the old `nz_*` schema or an additional database migration.

1. Configure `backend/.env` using the existing game environment path or the same Supabase server credentials.
2. Set `NEXT_PUBLIC_API_URL=http://127.0.0.1:3002/api` in `frontend/.env` (or `.env.local`). Restart the frontend if needed. Set `FRONTEND_URL` on the backend to the frontend origin.
3. For local development, explicitly enable `DASHBOARD_LOCAL_MODE=true`. The backend binds to `127.0.0.1`, checks the actual socket address, and only permits requests without an Origin header or with the exact configured frontend Origin. Forwarded client-IP headers are not trusted.
4. For production, set `NODE_ENV=production`, disable local mode, and use a Supabase Auth account whose trusted **app metadata** `role` is `admin`. The backend verifies access tokens through Supabase Auth before reading records. User-editable metadata is not accepted.
5. When admin authentication is required, enter the access token in dashboard Settings. Tokens stay in tab memory and are not persisted. A full sign-in UI and automatic token renewal remain outside this integration.

`GET /api/dashboard` returns `{ players, sessions, battles, metadata }` after enforcing local-development access or verified admin authentication. Service-role credentials remain on the server; this adapter only reads the game tables. It filters encounters to `data_source = real`, preserves registered players with no completed battles, groups chart sessions by game session + night, and includes the saved Pokémon roster. Simulated battles never mix with real gameplay. Missing tokens return 401, non-admins return 403, and unavailable database records return 503. Refresh failures retain the last successful snapshot with an error message.

Keyset pagination avoids silently truncating tables at Supabase's usual row limit. Each table is capped at 20,000 records; larger datasets need server-side period aggregation. Damage received is summed from complete logged turns because switching makes `hp_start - hp_end` invalid as a damage total. Missing historical turns produce unavailable damage, not an invented zero. The game currently has no item consumption; legacy non-null item markers are not treated as complete item counts. The legacy alternate-schema endpoint is retained at `/api/dashboard/legacy` and is not used by this integration.

Completed game encounters appear after saving to Supabase and the next dashboard refresh (30 seconds by default). Ongoing runs are not exposed by the game's aggregate API as individual records, so current presence/ongoing HP cannot be inferred from it. No game write actions, account changes, or database migrations were performed.

Pokémon sample artwork and open-license fonts are bundled locally, with attribution/license files in `frontend/public`. New Pokémon IDs use external PokeAPI artwork with a text fallback. The optional Three.js component remains available; analytics charts use accessible SVG.

## Validation and production builds

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e --workspace frontend
npm.cmd run check:connection
```

After building, start each production app with `npm.cmd run start --workspace frontend` and `npm.cmd run start --workspace backend` in separate terminals.

Browser tests use installed Microsoft Edge, launch a temporary production server on port 3200, and use sample fixtures or mocked API responses. The separate `check:connection` command requires the dashboard frontend and backend to be running; it verifies the actual browser → NestJS → shared game database connection without creating records. Screenshots are saved under the ignored `frontend/test-results/` folder. Change the Playwright browser channel if Edge is unavailable.
