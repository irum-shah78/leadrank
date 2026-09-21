# LeadRank

LeadRank cleans a raw lead list, scores every lead against a company's Ideal Customer Profile (ICP) and tells a sales rep who to contact first and why.

Built for the Caprae Capital AI-readiness challenge as an improvement layer on top of SaaSquatch.

- Live app: https://leadrank-rosy.vercel.app/
- API: https://leadrank-production.up.railway.app (health check at `/api/health`, interactive docs at `/docs`)
- Video walkthrough: https://drive.google.com/file/d/19jrm4WXFXM3l8YS-gOmh-29RK1sDyLty/view?usp=sharing

## Why this exists

A scraper like SaaSquatch is good at finding leads in volume. The list it produces is still raw: duplicates, missing or invalid emails, shared inboxes like info@, and contacts who are the wrong seniority or at the wrong kind of company. Reps lose hours sorting that out by hand.

LeadRank is the step after sourcing. It takes any list, fixes the data, ranks the leads against the ICP, explains each score in plain English, and exports the result in a format a CRM can import.

I chose this over rebuilding a scraper on purpose. Scraping is fragile (site changes, CAPTCHAs, IP limits) and Caprae already has SaaSquatch. The value that was missing was deciding which of the leads are worth a rep's time.

## What it does

1. Define an ICP: target industries, employee range, job title keywords, and countries.
2. Load leads with the built-in sample or upload a CSV.
3. The backend cleans and dedupes the list, then scores every lead from 0 to 100.
4. The results table shows the score, a Hot / Warm / Cold tier, and reason chips explaining the score. Warnings appear first.
5. Filter by tier, country, and industry, search by name, company or email, and hide invalid emails.
6. Export the filtered list as CSV, or as a CRM-ready file (valid emails only).

Other details:

- Scores refresh automatically after a load and shortly after any ICP change.
- A "Top contact" badge marks the best person to approach at each company that has more than one usable lead.
- A stats strip shows leads loaded, duplicates removed, invalid emails, and Hot leads, with two short insight lines.

## How scoring works

Scoring is rule-based on purpose. A sales rep can read exactly why a lead is Hot, and there is no black box to trust.

| Signal | Points |
|---|---|
| Industry matches the ICP | 30 |
| Job title matches an ICP keyword | 30 |
| Company size inside the employee range | 20 |
| Country matches the ICP | 10 |
| Email quality (valid, not free-mail, not a role address) | 10 |

- Hot is 75 or more, Warm is 40 to 74, Cold is below 40.
- A lead with no usable email is capped at 60, so it cannot be Hot until the email is fixed.
- Title keywords match whole words only, so "cto" does not match "Director".
- Country names are normalized, so USA, U.S., UK and UAE match their full names.
- If an ICP field is left empty, that signal gives partial credit instead of zero.
- Every point awarded or withheld produces a reason, shown as a chip on the lead.

Data cleaning applied on load: whitespace and casing normalized, duplicates removed (by email, or by name plus company when the email is blank), email syntax validated, free-mail and role addresses flagged, company domain derived from the website or email, missing fields flagged.

## Architecture

```
Browser -> Next.js on Vercel -> HTTPS -> FastAPI on Railway -> PostgreSQL on Neon
```

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Frontend hosting | Vercel (serverless, deploys from this repo) |
| Backend | FastAPI (Python), plain SQL with psycopg 3, no ORM |
| Backend hosting | Railway (always-on container, deploys from this repo) |
| Database | PostgreSQL hosted on Neon |
| Cache | In-memory dictionary keyed by the ICP JSON, cleared whenever new leads are loaded |

Design decisions:

- Scoring runs on the server so the rules live in one place and the frontend stays a thin view.
- Loading leads replaces the previous list. That keeps the stats, the dedupe, and the scores consistent, and makes loading safe to repeat.
- A single-row `load_stats` table stores the last load summary, so the stats strip survives a server restart.
- The backend is an always-on container rather than serverless so the in-memory cache actually persists between requests.
- Plain SQL keeps the data layer small and easy to read for a project this size.

### API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/leads/sample` | Load the built-in sample list |
| POST | `/api/leads/upload` | Upload a CSV (multipart form, field `file`) |
| POST | `/api/score` | Score the loaded leads against an ICP, returns leads, stats and insights |

### Project structure

```
backend/
  main.py            app, CORS, startup
  config.py          env vars and constants
  schemas.py         ICP model
  database.py        Postgres access
  services/          cleaning.py, scoring.py
  routers/           leads.py, score.py
  sample_leads.csv   synthetic sample data
frontend/
  app/page.tsx       page composition and filter state
  components/        ICP panel, stats, filters, results table
  hooks/             lead loading and scoring state
  lib/               types, API client, CSV export, helpers
```

## CSV format

Header row required, columns in any order:

`first_name, last_name, email, title, company, website, industry, employees, country, linkedin_url`

Files must be UTF-8. Values containing commas must be quoted.

## Run locally

Backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```
DATABASE_URL=postgresql://user:password@host/dbname
ALLOWED_ORIGIN=http://localhost:3000
```

```bash
uvicorn main:app --reload
```

Frontend, in a second terminal:

```bash
cd frontend
npm install
echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
npm run dev
```

Open http://localhost:3000, click "Load sample leads", and the ranked results appear.

## Deployment

1. Database: create a PostgreSQL database on Neon and copy the connection string. The backend creates its tables on startup.
2. Backend on Railway: create a service from this repo with the root directory set to `backend`. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`. Variables: `DATABASE_URL` and `ALLOWED_ORIGIN`.
3. Frontend on Vercel: import this repo with the root directory set to `frontend`. Variable: `NEXT_PUBLIC_API_URL` set to the Railway URL.
4. Set `ALLOWED_ORIGIN` on Railway to the exact Vercel URL with no trailing slash, then redeploy the backend. Without it the browser blocks the frontend's requests.

`NEXT_PUBLIC_API_URL` is read at build time, so Vercel must be redeployed after changing it.

Both platforms redeploy automatically on every push to the main branch.