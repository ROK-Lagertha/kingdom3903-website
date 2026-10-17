# The Citadel V3.12.1 — Royal Herald Admin Routing

- Successful Discord OAuth2 login now redirects to `/news/admin/`.
- The public `/news/` page remains available to all visitors.
- The admin dashboard is separate from the public news page.
- **Server-side protection:** Worker checks the encrypted session and live Discord Administrator role `1462585046329200700` before returning admin HTML.
- Wrangler assets `run_worker_first` now includes `/news/admin` and `/news/admin/*` to prevent direct static asset bypass.
- The dashboard includes a logout, placeholder article editor and Kingdom Pulse checkbox.
- Publishing is deliberately disabled until D1 storage, server-side authorization, CSRF and HTML sanitization are implemented.
- No new Cloudflare secrets or Discord redirect URLs are needed. Existing OAuth callback remains `/api/herald/callback`.

Deploy with existing `npx wrangler deploy` setup. Do not remove the `run_worker_first` rules.
