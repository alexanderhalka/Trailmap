# TrailMap

Small web app for Banff/Canmore day hikes: filter trails, geocode a base, rough time estimates, save plans to Postgres.

## Stack

- Next.js (App Router), TypeScript, Tailwind
- PostgreSQL, Prisma (`pg` + `@prisma/adapter-pg`)
- Docker Compose for local Postgres
- Geocoding via OpenStreetMap Nominatim
- Home map: Leaflet + OpenStreetMap tiles (trailhead pins + your base)

## Travel (list vs detail)

There are only three ways to reach a trailhead: **walk**, **transit**, **car**. On the home page you **combine** them with checkboxes. A trail appears if it is flagged for **at least one** option you checked.

Trail detail and saved plans still store **one** leg for the crude time estimate (`car` | `transit` | `walking`), picked from your selection (transit preferred, then walk, then car).

**API:** `GET /api/trails?walk=1&transit=1&car=0` (each `0` or `1`, or `true` / `false`). If none of `walk` / `transit` / `car` are sent, old `travel=` / `mode=` is still read for backwards compatibility (`all`, `transit_or_walk`, `no_car`, `transit`, `walking`, `car`).

## Exposure

Each trail has an exposure score 1–5 in the DB.

## Local setup

1. Copy env: `cp .env.example .env` (Windows: `copy .env.example .env`), then adjust `DATABASE_URL` if needed.
2. `docker compose up -d`
3. `npm install` then `npm run db:push` and `npm run db:seed`
4. `npm run dev` → [http://localhost:3000](http://localhost:3000)

If the schema changed and migrations conflict: `docker compose down -v`, then `up -d`, then `db:push` and `db:seed` again.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run db:push` | Apply `schema.prisma` to the database |
| `npm run db:migrate` | Create / apply migrations |
| `npm run db:seed` | Upsert trail rows from `src/lib/seed-trails.ts` |
| `npm run db:generate` | Regenerate Prisma client |

## API

- `GET /api/trails` — `walk`, `transit`, `car` (each `0`/`1` or boolean string), optional legacy `travel` / `mode`, plus `maxPhysical`, `maxTechnical`, `maxExposure`
- `GET /api/trails/:id`
- `POST /api/geocode`
- `POST /api/estimate-trip`
- `GET` / `POST /api/trip-plans`
