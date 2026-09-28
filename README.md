# SchoolSaavy — Frontend

React frontend for the [SchoolSaavy Laravel API](https://github.com/kksingh000/SchoolSaavy-Backend_updated).
Multi-tenant school management: one app, four roles, every request scoped to the
school carried in the bearer token.

```
React 18 · TypeScript · Vite 6 · Tailwind v4 · TanStack Query v5 · React Router 6 · Recharts
```

---

## Quick start

```bash
npm install
cp .env.example .env          # point VITE_API_BASE_URL at your API
npm run dev                   # http://localhost:5173
```

```bash
npm run build                 # tsc -b && vite build  →  dist/
npm run preview               # serve the built bundle
```

### Environment

| Variable | What it does |
|---|---|
| `VITE_API_BASE_URL` | Base URL **including** `/api`, e.g. `https://schoolsaavy-api.onrender.com/api`. Set it to `/api` to use the dev proxy instead. |
| `VITE_DEV_PROXY_TARGET` | Only used by `npm run dev` when the base URL is relative. Defaults to `http://localhost:8000`. |

The backend's `config/cors.php` already allows `*` on `api/*`, so no CORS work is
needed for either route.

---

## Architecture

```
src/
├── app/
│   ├── auth-context.tsx     session, role helpers, token bootstrap
│   ├── navigation.ts        sidebar map — role + module gated
│   └── routes.tsx           route tree with RequireAuth / RequireRole
├── lib/
│   ├── http.ts              axios instance, envelope unwrapping, ApiError
│   └── utils.ts             ₹ formatting, dates, cn()
├── services/                one module per backend domain
│   ├── auth.ts   people.ts   academics.ts   fees.ts   ops.ts
├── types/api.ts             mirrors app/Http/Resources/*.php
├── components/
│   ├── ui/                  Button, Card, Field, Table, Modal, Feedback, Primitives
│   ├── charts/Charts.tsx    one categorical ramp for the whole app
│   └── layout/AppShell.tsx  sidebar + topbar
└── features/                one folder per screen area
```

### Talking to the API

The backend is not consistent about response envelopes — `BaseController`
returns `{ status, message, data }`, `AuthController` returns the payload at
the top level, and paginated endpoints add `meta` / `links`. `lib/http.ts`
normalises all three:

```ts
api.get<Student>(`/students/${id}`)        // unwraps .data if present
api.paginated<Student>('/students', { params })   // → { items, meta }
```

Errors arrive as a typed `ApiError` carrying Laravel's 422 validation bag, so
forms can put messages on the right field:

```ts
onError: (err: ApiError) => setError(err)
// then:  <Input error={error?.fieldError('admission_number')} />
```

A 401 on anything other than the login call clears the token and drops the
session. Queries never retry 401 / 403 / 404 / 422.

### Roles

Mirrors the backend's `user.type` middleware. The login form sends
`user_type`, which the API requires.

| Role | Sees |
|---|---|
| `school_admin` | Everything — people, academics, fees, settings, activity log |
| `teacher` | Their classes, attendance, assignments, assessments, timetable |
| `parent` | Their children, notifications, fees, events, gallery |
| `super_admin` | Platform routes exist in the API but have no UI here yet |

Two guards: `RequireAuth` validates the stored token against `/auth/me` before
rendering, `RequireRole` bounces a wrong-role URL back to the dashboard. The
sidebar additionally hides anything whose backend module slug isn't active for
the school (`GET /modules/school`).

---

## Design system

Navy `#0A0F2C` and gold `#C9A84C`, defined once as Tailwind v4 theme tokens in
`src/index.css` and used as ordinary utilities (`bg-navy-900`, `text-gold-500`,
`rounded-card`).

- **Type** — Fraunces for headings, Inter for UI, tabular numerals on every
  column of figures.
- **Elevation** — hairline borders first; shadows only on cards and popovers.
- **Charts** — one 8-colour categorical ramp, ordered so neighbours stay
  distinguishable in greyscale. Currency axes use `en-IN` compact notation
  (₹18.5L, not ₹1,850,000).
- **States** — every list has an explicit loading skeleton, error state with
  retry, and an empty state that says what to do next.

---

## Screens

| Route | Role | Notes |
|---|---|---|
| `/` | all | Role-switched dashboard; admin view has attendance, fee and distribution charts |
| `/students`, `/students/:id` | staff | Filterable roster, create/edit, per-student attendance + fee + assignment tabs |
| `/teachers` | admin | Staff list, create with auto-generated employee ID |
| `/parents` | admin | Guardian accounts |
| `/classes` | staff | Enrolment cards with capacity bars |
| `/subjects` | admin | Subject catalogue |
| `/attendance` | staff | **Daily register** — pre-seeded from saved marks, mark-all, single bulk submit |
| `/timetable` | all | Weekly grid; teachers see their own schedule |
| `/assignments` | all | List + create with class→subject cascade |
| `/assessments` | staff | List + **marks entry sheet** with publish |
| `/events` | all | Cards with acknowledgment tracking |
| `/fees` | admin, parent | Outstanding installments, student plans, structures, **collect payment** |
| `/notifications` | all | Admin composer / parent inbox with unread badge |
| `/gallery` | all | Album grid |
| `/academic-years` | admin | Create and switch the current year |
| `/activity` | admin | Audit trail |
| `/settings` | admin | Active modules and stored config |
| `/profile` | all | Details and password change |

### Worth knowing

- **Attendance** reads `GET /attendance/class/{id}/date` first and seeds the
  register from it, so re-opening a saved day shows what was recorded rather
  than a blank sheet. Only marked students are submitted.
- **Adding a student** requires `parent_id` (the backend's
  `StoreStudentRequest` enforces it) — the form loads the parent picker and
  says so.
- **Academic year**: most admin routes sit behind `check.academic.year`. If
  none is set, the API returns a `notification` block on `/dashboard`, and the
  dashboard renders it as a banner linking to `/academic-years`.

---

## Deploying to Vercel

`vercel.json` is set up: Vite framework preset, SPA rewrite to `index.html`,
immutable caching on `/assets/*`.

```bash
vercel --prod
```

Set `VITE_API_BASE_URL` in the Vercel project's environment variables to the
Render API URL, including `/api`.

---

## Not built yet

- Super-admin console (`/super-admin/*` — schools, platform analytics, module assignment)
- Camera streaming (`/cameras/*`, media-server tokens)
- Bulk student import wizard (the API endpoints are wired in `services/people.ts`)
- Promotion workflow UI (endpoints wired in `services/academics.ts`)
- Bulk timetable builder (read-only grid for now)
