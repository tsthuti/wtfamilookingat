# wtf am i looking at

a personal browsing analytics dashboard = tracks time spent per site, category breakdowns, and daily patterns — built as a chrome extension + React dashboard backed by Supabase! 

---

## what it does

- **chrome extension** silently tracks active tab time in the background, categorises sites automatically (Dev, Social, Productivity, etc.), and syncs to Supabase every 2 minutes
- **dashboard** visualises the data across three views:
  - **Today** — hero stats, ranked site list, category donut
  - **Patterns** — hourly × day-of-week heatmap, peak hour detection
  - **History** — 7-day bar chart with per-day drill-down and category breakdown

---

## stack

| Layer | Tech |
|-------|------|
| Extension | Chrome MV3, vanilla JS, ES modules |
| Database | Supabase (Postgres + REST API) |
| Dashboard | React 18, Recharts, Supabase JS client |
| Hosting | Vercel |

---

## repo structure

```
extension/     # Chrome extension
├── manifest.json
├── background.js         # Service worker: tab tracking, idle detection, flush
├── utils.js              # Domain parsing + category map
├── config.js             # Supabase credentials
├── popup.html / popup.js # Extension popup UI
└── icons/

dashboard/     # React dashboard
├── src/
│   ├── App.jsx           # Shell + tab navigation
│   ├── supabase.js       # Supabase client
│   ├── index.css         # Global styles + design tokens
│   └── components/
│       ├── Today.jsx
│       ├── Patterns.jsx
│       ├── History.jsx
│       └── ui.jsx        # Shared primitives
└── public/
```

---

## setup

### 1. Supabase

create a free project at [supabase.com](https://supabase.com), then run this in the SQL editor:

```sql
create table visits (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  duration_seconds integer not null,
  category text not null default 'Other',
  visited_at timestamptz not null,
  hour_of_day integer,
  day_of_week integer,
  created_at timestamptz default now()
);

create index on visits (domain);
create index on visits (visited_at);
create index on visits (category);

alter table visits enable row level security;

create policy "Allow anon inserts"
  on visits for insert to anon with check (true);

create policy "Allow anon reads"
  on visits for select to anon using (true);
```

### 2. chrome extension

1. fill in `browsewise-extension/config.js` with your Supabase URL and anon key
2. go to `chrome://extensions` → enable **Developer Mode** → **Load unpacked** → select the `browsewise-extension/` folder
3. browse around, hit **sync** in the popup, verify rows appear in your Supabase `visits` table

### 3. dashboard (local)

```bash
cd dashboard
npm install
npm start
```

### 4. deploy to Vercel

```bash
npm install -g vercel
cd dashboard
vercel
```

accept all defaults - Vercel detects Create React App automatically and gives you a live URL!

> if you're nosy, here are my stats: https://wtfamilookingat.vercel.app/ 
