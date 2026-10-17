# The Citadel V3.12.1 — Royal Herald Admin Routing

- Successful Discord OAuth2 login now redirects to `/news/admin/`.
- The public `/news/` page remains available to all visitors.
- The admin dashboard is separate from the public news page.
- **Server-side protection:** Worker checks the encrypted session and live Discord Reporter role `1561084418246844477` before returning admin HTML.
- Wrangler assets `run_worker_first` now includes `/news/admin` and `/news/admin/*` to prevent direct static asset bypass.
- The dashboard includes a logout, placeholder article editor and Kingdom Pulse checkbox.
- Publishing is deliberately disabled until D1 storage, server-side authorization, CSRF and HTML sanitization are implemented.
- No new Cloudflare secrets or Discord redirect URLs are needed. Existing OAuth callback remains `/api/herald/callback`.

Deploy with existing `npx wrangler deploy` setup. Do not remove the `run_worker_first` rules.

## V3.12.2
- Switched the Royal Herald access role to Reporter (`1561084418246844477`).
- Discord login, guild ID, callback URL and session handling remain unchanged.
- A fresh Discord login is required to test the role. If access still fails, investigate HTTP 401 vs 403 and OAuth membership response rather than changing more role IDs.
