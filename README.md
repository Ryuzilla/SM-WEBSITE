# SM Sales Analytics — Executive Dashboard

A premium, production-ready **Sales Analytics Dashboard** for business executives. Built with **Next.js 15**, **React 19**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Recharts**, and **Supabase** (PostgreSQL + Auth), deployable on **Vercel**.

> 💡 **Runs out of the box.** With no environment configured, the app boots in **Demo Mode** using a bundled, realistic ~18-month synthetic dataset — so you can explore every screen immediately. Add Supabase credentials to switch to live data + authentication.

---

## ✨ Features

| Module | Highlights |
| --- | --- |
| **Executive Overview** | 8 dynamic KPI cards: Total Revenue, Orders, Unique Customers, Unique Companies, Avg Order Value, Monthly Growth %, Daily Revenue, Target Achievement % |
| **Sales Trend Analytics** | Monthly revenue line chart, Year-over-Year comparison, Month-over-Month growth, **linear-regression revenue forecast**, date-range + year filters, hover tooltips, **PNG export** |
| **Daily Sales Monitoring** | Daily revenue vs target (line), order volume (area), best/worst day detection |
| **Top 10 Products** | Horizontal bar chart, search, revenue share %, **Excel export** |
| **Top 10 Customers** | Sortable/searchable ranking table, last purchase recency, medal ranks |
| **Top 10 Companies** | Ranked table + bar chart, revenue contribution % |
| **Salesperson Performance** | Ranking table, composite performance score, target achievement, **Top Performer badge** |
| **Global Filters** | Year, Month, Quarter, Province, Customer, Company, Category, Product, Salesperson — **all charts update instantly** |
| **Excel Upload** | Drag & drop `.xlsx`, automatic column validation, live preview, bulk import (admin only) |
| **Reports** | One-click **PDF**, **Excel** (multi-sheet), and **CSV** exports + auto-generated executive summary |
| **Auth & RBAC** | Email/password auth, three roles — **Admin / Manager / Salesperson** — enforced via middleware + PostgreSQL Row Level Security |
| **UI/UX** | Modern SaaS layout, **dark/light mode**, responsive (desktop-first, mobile-friendly), smooth animations |

---

## 🧱 Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components, Server Actions)
- **Language:** TypeScript (strict)
- **UI:** Tailwind CSS + shadcn/ui (Radix primitives) + lucide-react icons
- **Charts:** Recharts
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **Exports:** `xlsx` (Excel/CSV), `jspdf` + `jspdf-autotable` (PDF), `html-to-image` (PNG)
- **Theming:** `next-themes`
- **Deployment:** Vercel

---

## 📁 Project Structure

```
.
├── middleware.ts                 # Session refresh + route protection
├── next.config.ts
├── tailwind.config.ts
├── components.json               # shadcn config
├── supabase/
│   ├── schema.sql                # Tables, enums, indexes, constraints, triggers
│   ├── policies.sql              # Row Level Security policies
│   └── seed.sql                  # Optional sample data
└── src/
    ├── app/
    │   ├── layout.tsx            # Root layout (theme + toaster)
    │   ├── globals.css           # Design tokens (light/dark)
    │   ├── login/                # Auth pages + server actions
    │   ├── auth/callback/        # OAuth/email confirmation handler
    │   ├── api/upload/           # Bulk import API (admin-only, service role)
    │   └── dashboard/
    │       ├── layout.tsx        # Loads profile + data → DashboardProvider + AppShell
    │       ├── page.tsx          # Overview
    │       ├── sales-trend/
    │       ├── daily-sales/
    │       ├── products/
    │       ├── customers/
    │       ├── companies/
    │       ├── salespersons/
    │       ├── upload/
    │       ├── reports/
    │       └── users/            # RBAC management (admin)
    ├── components/
    │   ├── ui/                   # shadcn primitives
    │   ├── charts/               # Recharts wrappers
    │   ├── dashboard/            # KPI cards, chart cards, page header
    │   ├── filters/              # Global filter bar
    │   ├── layout/               # Sidebar, header, user menu
    │   └── providers/            # DashboardProvider (filters + analytics)
    └── lib/
        ├── types.ts              # Domain types (single source of truth)
        ├── analytics.ts          # Pure aggregation engine (KPIs, trends, ranks)
        ├── sample-data.ts        # Deterministic demo dataset
        ├── data.ts               # Role-scoped data access
        ├── auth.ts               # Profile/role resolution
        ├── excel-import.ts       # Parse + validate + map uploads
        ├── export.ts             # CSV / Excel / PNG
        ├── report.ts             # Executive PDF
        ├── supabase/             # client / server / middleware clients
        ├── env.ts                # Config + demo-mode detection
        └── utils.ts              # Formatters
```

---

## 🚀 Getting Started (Local)

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Configure environment — skip to run in Demo Mode
cp .env.example .env.local

# 3. Run the dev server
npm run dev
# → http://localhost:3000  (redirects to /dashboard)
```

In **Demo Mode** (no env), click **"Enter Demo"** on the login screen.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run lint` | Lint |

---

## 🗄️ Supabase Setup (Live Mode)

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the scripts **in order**:
   1. `supabase/schema.sql` — tables, enums, indexes, constraints, auto-profile trigger
   2. `supabase/policies.sql` — Row Level Security
   3. `supabase/seed.sql` — *(optional)* sample data
3. In **Project Settings → API**, copy your keys into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server-only; never exposed
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_USE_SAMPLE_DATA=false
```

4. **Create the first admin.** Sign up via the app (new users default to `salesperson`), then promote in SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'you@company.com';
```

### Roles & Permissions

| Role | Access |
| --- | --- |
| **Admin** | Full access — import data, manage users/roles, view everything |
| **Manager** | View all sales data and analytics |
| **Salesperson** | View **only their own** sales (enforced by RLS via the linked salesperson name) |

> Salesperson scoping links `profiles.salesperson_id → salespersons.id`; sales rows are filtered where `sales.salesperson = <that salesperson's name>`.

---

## 📤 Excel Upload Format

Upload `.xlsx` files with **exactly** these columns (admin only):

```
Date | Invoice_No | Customer_Name | Company_Name | Salesperson |
Product_Code | Product_Name | Category | Quantity | Unit_Price |
Sales_Amount | Province
```

The uploader parses the file in the browser, validates required columns and per-row data, shows a preview, then bulk-inserts via the `/api/upload` route using the service-role key. `Date` accepts `YYYY-MM-DD`, `DD/MM/YYYY`, or Excel date cells.

---

## ▲ Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Add the environment variables (from `.env.local`) in **Project → Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` → your production URL (e.g. `https://your-app.vercel.app`)
   - `NEXT_PUBLIC_USE_SAMPLE_DATA` → `false`
4. In **Supabase → Authentication → URL Configuration**, add your Vercel URL to **Site URL** and **Redirect URLs** (`https://your-app.vercel.app/auth/callback`).
5. Deploy. Vercel auto-detects Next.js — no extra config required.

> Leaving env vars unset deploys a fully working **Demo Mode** preview.

---

## 🔐 Security Notes

- The **service-role key** is used **only** in server-side route handlers/actions and is never bundled into client code.
- Route protection is enforced in `middleware.ts`; data access is additionally protected by **Row Level Security** in PostgreSQL.
- Imports are restricted to admins both in the API route and via RLS write policies.

---

## 📊 Analytics Notes

- **Forecast** uses least-squares linear regression over the trailing 6 months of revenue, projected 3 months forward.
- **Performance Score** blends target achievement (50%), revenue rank (35%) and customer breadth (15%), normalised 0–100.
- Default monthly target is `500,000` per salesperson; in production, override using the `targets` table.

---

## 📄 License

Proprietary — © SM Sales Analytics. For internal/executive use.
