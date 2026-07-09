# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is not a git repository (the `frontend/` subfolder has its own nested git repo, auto-created by `create-next-app` — harmless but be aware of it if this project is ever git-initialized at the root). It contains three things:

- `crud-phyton/` — a working FastAPI backend implementing the full **SmartPOS** data model: Master (User, Category, Unit, Product), Transaksi (Sales/Penjualan, Stock Movements), and Laporan (reports + dashboard).
- `frontend/` — a working Next.js (App Router, TypeScript, Tailwind v4) client that consumes the backend over HTTP. Covers every page in the PRD menu.
- `PRD_SmartPOS.md` — the product spec. §3 Modul, §4 Role, §5 Business Rules and §6 Menu are the source of truth for field names, role permissions, and navigation grouping — check it before adding or renaming anything.

## Commands

Backend (run from `crud-phyton/`):
```
python -m pip install -r requirements.txt
python main.py                        # dev server with --reload, http://127.0.0.1:8001
```
Swagger UI: `http://127.0.0.1:8001/docs`. On first startup (empty `users` table) it seeds a default admin: `admin` / `admin123` — change this outside local dev, it's logged to stdout as a reminder, not enforced.

**Windows/Git-Bash gotcha**: `uvicorn --reload` (`StatReload`) has been observed leaving an orphaned worker process bound to the port after the reloader itself is killed — `taskkill //PID <reloader>` doesn't always kill the child. If a code change (e.g. middleware) doesn't seem to take effect, check `netstat -ano | grep :8001` for a second stale PID and kill it directly, or just kill everything on the port and restart clean.

Frontend (run from `frontend/`):
```
npm install
npm run dev                           # Turbopack dev server, http://localhost:3000
```
Requires the backend running and reachable at `NEXT_PUBLIC_API_URL` (`frontend/.env.local`, defaults to `http://127.0.0.1:8001`) — CORS on the backend defaults to `localhost:3000`/`127.0.0.1:3000`, overridable via the `CORS_ORIGINS` env var (comma-separated) for production origins (see `main.py`).

There is no test suite or lint step wired into CI on either side yet.

## Backend architecture

- `database.py` — SQLAlchemy engine/session. Reads `DATABASE_URL` env var; defaults to SQLite at `crud-phyton/test.db` for local dev if unset. In production (Railway) this is set to a Postgres connection string instead — the ORM code is DB-agnostic (all report queries use the portable `cast(col, Date)` rather than SQLite-specific `func.date()`), so no other code changes between environments. `test.db` is gitignored; delete it to reset the local schema (SQLAlchemy does not migrate existing tables — there is no Alembic here, on SQLite or Postgres).
- `models.py` — all SQLAlchemy ORM models in one file: `User` (role: admin/kasir), `Category`, `Unit`, `Product`, `ProductUnit`, `StoreSetting`, `StockMovement`, `Sale`, `SaleItem`.
- `schemas.py` — all Pydantic request/response models in one file. `*Create` schemas are generally reused for update (PUT) too, except `User` which has a separate `UserUpdate` (password optional, so updates don't force a rehash). Response schemas never expose `hashed_password`.
- `security.py` — password hashing (`bcrypt` directly, not passlib) and JWT create/decode (`pyjwt`). `SECRET_KEY` comes from the `SECRET_KEY` env var, falling back to a hardcoded dev value — must be overridden outside local dev.
- `exceptions.py` — plain-Python domain exceptions (`NotFoundError`, `ValidationError`, `InsufficientStockError`, `InsufficientPaymentError`) raised from `crud.py`. Routers catch these and translate to HTTP status codes; `crud.py` itself never imports FastAPI.
- `crud.py` — all DB access + business logic in one file, organized by entity with `# ----- Section -----` comment headers. The two non-obvious pieces of logic live here:
  - **Unit conversion & stock**: `Product.stock` is always in the product's base unit. Every `ProductUnit` row stores `conversion` (how many base units it equals), plus its own `buy_price`/`sell_price`. Sales and stock movements convert `qty_input * conversion` to get the base-unit delta before touching `Product.stock`.
  - **Stock movement types**: `in`/`out` apply `qty_input * conversion` as a delta (rejecting `out` if it would go negative); `adjustment` treats `qty_input` as the *new absolute stock* in the given unit, not a delta — see the comment in `create_stock_movement`.
  - **Sales are all-or-nothing**: `create_sale` validates every line item (product exists, unit exists for that product, sufficient stock) before creating any DB rows, then decrements stock per item. Invoice numbers are generated from `StoreSetting.transaction_number_format` via `_format_invoice_number`, which supports `{YYYYMMDD}`/`{YYYY}`/`{MM}`/`{DD}` tokens plus a zero-padded sequence token like `{0001}`.
- `deps.py` — `get_db`, `get_current_user` (decodes the bearer JWT), and `require_roles(*roles)` (a dependency factory for role-gating routes).
- `routers/` — one file per PRD menu leaf (`auth`, `users`, `categories`, `units`, `products`, `store_settings`, `stock`, `sales`, `reports`, `dashboard`), each an `APIRouter` included in `main.py`. This mirrors §6 Menu of the PRD 1:1, so a new menu item should become a new router file rather than growing an existing one.

### Role permissions (see PRD §4)

`admin` has full access. `kasir` is restricted to: reading Master data (products/categories/units/store-settings, needed to search products at checkout), creating/reading Sales (Penjualan + Riwayat Transaksi). Everything else — Users, Master mutations, Stock Movements, Reports, Dashboard — is `admin`-only, enforced via `require_roles("admin")` at the router or route level in `deps.py`. When adding a new endpoint, decide its role gate by checking which pages Kasir has access to in the PRD rather than defaulting to admin-only or open.

### Referential integrity

SQLite here does not enforce foreign keys, and several FKs are `nullable=False` (e.g. `Product.category_id`, `Product.base_unit_id`), so deleting a referenced row would otherwise corrupt data or crash on SQLAlchemy's nullify-on-delete behavior. This is handled at the application layer: `crud.category_has_products` / `crud.unit_in_use` block deletion when a `Category`/`Unit` is still referenced by a `Product`. Follow the same pattern for any new FK relationship rather than relying on the database to catch it.

## Frontend architecture

Everything is a client component (`"use client"`) — there are no Server Components doing data fetching, no Server Actions, no use of `cookies()`/`headers()`/`searchParams`. This was a deliberate choice: Next.js 16 made those APIs async-only (breaking change from 15), and since the backend is a separate FastAPI service reached via plain `fetch`, there was no reason to take on that complexity. Keep new pages client-side and fetching via `lib/api.ts` unless there's a concrete reason to reach for the App Router's server-side data story.

- `src/lib/api.ts` — the only place that calls `fetch` against the backend. `api.get/post/put/del` attach the JWT from `localStorage` automatically and throw `ApiError` (with the backend's `detail` message) on non-2xx. `loginRequest` is separate because `/auth/login` expects `application/x-www-form-urlencoded` (FastAPI's `OAuth2PasswordRequestForm`), not JSON.
- `src/lib/auth-context.tsx` — `AuthProvider`/`useAuth()`. On mount, if a token exists in `localStorage` it's validated via `GET /auth/me`; the resulting `user.role` drives both sidebar visibility and route guarding. No cookies, no SSR session — auth state only exists client-side.
- `src/app/(app)/layout.tsx` — the route group for everything behind login. Redirects to `/login` if unauthenticated. Also enforces role gating client-side: `ADMIN_ONLY_PREFIXES` lists route prefixes a `kasir` may not view (mirrors PRD §4), and a kasir hitting one is redirected to `/transaksi/penjualan`. This is a UX convenience only — the backend's `require_roles()` is the real enforcement; a blocked page would 403 from the API even if this redirect didn't exist.
- `src/components/Sidebar.tsx` — the nav tree is hardcoded to mirror PRD §6 Menu exactly (Dashboard / Master / Transaksi / Laporan). When the backend gains a new router (new PRD menu leaf), add the page under the matching `app/(app)/<group>/<item>/` folder and a matching entry here — same 1:1 mapping convention as the backend's `routers/`.
- `src/components/Receipt.tsx` — shared between the post-checkout view (`transaksi/penjualan`) and the reprint view (`transaksi/riwayat/[id]`), per PRD's "Nota dapat dicetak ulang" rule. Printing uses the browser's native `window.print()`; `globals.css` hides everything with the `no-print` class (Sidebar, Topbar, action buttons) via `@media print`.
- `src/components/charts/LineChart.tsx` — a hand-rolled SVG line chart (no charting library) used by the two Laporan trend views. Single-hue blue (`#2a78d6`), hover crosshair + tooltip, gridlines — built following the dataviz skill's mark specs. If a new chart is needed, prefer extending this component's props over reaching for a chart library, unless the visualization need (stacked bars, multi-series) genuinely outgrows it.
- Money is always formatted with `formatCurrency` (`lib/format.ts`, `Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" })) — never interpolate a raw number with a "Rp" prefix.
- Forms generally POST/PUT the same shape as the backend's `*Create` schema (mirroring the backend's own Create-reused-for-Update convention), except Product (`units[]` is fully replaced on every save — no partial update of individual unit rows) and User (password left blank on edit means "don't change it," matching `UserUpdate.password: Optional[str]` on the backend).
