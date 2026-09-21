# LeadRank

Demo: (add your Vercel frontend URL here)
API: (add your Render backend URL here)

LeadRank helps sales teams turn raw lead lists into a cleaned, deduplicated, and ranked queue. SaaSquatch-style scraping gets you contacts; LeadRank decides who to call first and why, using a simple Ideal Customer Profile (ICP).

## Why this exists

Raw scraped lists are noisy. Duplicate rows, free-mail addresses, and people outside your ICP waste outreach time. LeadRank scores every lead 0-100 against industry, title, company size, country, and email quality, then sorts them into Hot, Warm, and Cold tiers with plain-English reasons.

## Architecture

- Frontend: Next.js (App Router) + TypeScript + Tailwind, deployed on Vercel
- Backend: FastAPI web service on Render (always-on so the in-memory score cache survives across requests)
- Database: PostgreSQL on Neon, accessed with psycopg and plain SQL (no ORM)
- Cache: in-memory dict keyed by ICP JSON; cleared when new leads are loaded
- No paid external APIs

Postgres is used because lead data is relational, needs to persist between scoring runs, and is easy to query/filter. Neon keeps setup cheap and simple for a demo.

## Local setup

### Backend

1. Create a Neon Postgres database and copy `DATABASE_URL`.
2. From `backend/`:

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
set DATABASE_URL=your_neon_url
set ALLOWED_ORIGIN=http://localhost:3000
uvicorn main:app --reload --port 8000
```

On PowerShell use `$env:DATABASE_URL="..."` and `$env:ALLOWED_ORIGIN="http://localhost:3000"`.

### Frontend

```bash
cd frontend
npm install
set NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Open http://localhost:3000

CSV columns expected: `first_name,last_name,email,title,company,website,industry,employees,country,linkedin_url`

## Deployment

1. Push this repo to GitHub (one repo with `backend/` and `frontend/`).
2. Neon: create a project, copy `DATABASE_URL`.
3. Render: New Web Service from the repo
   - Root Directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Env: `DATABASE_URL`
4. Vercel: import the same repo
   - Root Directory: `frontend`
   - Env: `NEXT_PUBLIC_API_URL` = your Render URL (no trailing slash)
5. Back on Render, set `ALLOWED_ORIGIN` to your Vercel URL and redeploy so CORS works.

Env vars:

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | Render | Neon Postgres connection string |
| `ALLOWED_ORIGIN` | Render | Frontend origin for CORS |
| `NEXT_PUBLIC_API_URL` | Vercel | Backend base URL |

## Design decisions and tradeoffs

- Quality over quantity: one focused prioritization flow instead of cloning every SaaSquatch feature.
- Rule-based scoring only (no LLM) so results are predictable, free, and fast within a 5-hour build.
- Always-on Render for the API because an in-memory cache does not work well on Vercel serverless.
- Deduping by email (fallback: name + company) and flagging free/role emails to protect outreach quality.
- Client-side CSV export of the filtered table so reps can drop Hot leads into a CRM quickly.

Known limitations: cache is per-process (resets on Render restart), scoring weights are fixed, there is no auth or multi-tenant support, and company size/industry matching is string/range based rather than enriched from third parties.

## Data ethics

The included `sample_leads.csv` is synthetic (fake names and example-style domains). LeadRank does not scrape the web. It only processes lists you upload. You are responsible for consent, suppression lists, and outreach rules under GDPR, CAN-SPAM, and similar laws.
