# Early Student Support System (ESS) — Phase 1

> AI-driven early intervention, risk trajectory monitoring, and student success analytics.

## Stack
- **Frontend**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS (glassmorphism dark theme)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password, role-based)
- **Deployment**: Vercel

## Phase 1 Deliverables
- ✅ 9-table PostgreSQL schema with FK constraints & indexes
- ✅ 50 synthetic students across 5 behavioral cohorts
- ✅ 2,000 attendance + 600 academic + 400 engagement records
- ✅ Risk assessment tiers: GREEN / AMBER / RED / CRITICAL
- ✅ Root cause diagnostics + intervention tracking
- ✅ 3 demo auth accounts (admin / faculty / counselor)
- ✅ Next.js dashboard with role switcher & data browser

## Database Setup

```bash
# 1. Run schema in Supabase SQL Editor
supabase/schema.sql

# 2. Run seed data
npm run seed  # generates supabase/seed.sql
# then run supabase/seed.sql in SQL Editor
```

## Environment Variables

```bash
cp .env.example .env.local
# Fill in your Supabase project URL and anon key
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@college.edu | demo123 |
| Faculty | faculty@college.edu | demo123 |
| Counselor | counselor@college.edu | demo123 |

## Student Cohorts

| Category | Count | Pattern |
|----------|-------|----------|
| Normal | 15 | Attendance >92%, grades 85–97% |
| Declining | 10 | Good → bad over 8 weeks |
| Recovering | 8 | Bad → good post-intervention |
| At-Risk | 12 | Chronic failure signals |
| Unclear | 5 | Bimodal, erratic patterns |

## Run Locally

```bash
npm install
npm run dev
```
