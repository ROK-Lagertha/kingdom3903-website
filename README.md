# The Citadel V3.11.0 — Royal Herald news page

- Replaces `/news/` placeholder with responsive Royal Herald landing page.
- Displays four current homepage headlines as an initial news archive.
- Adds a Discord login entry point at `/api/herald/login`.
- Includes a hidden administrator HTML editor; it is revealed only after `/api/herald/me` confirms `authenticated=true` AND `isAdmin=true`.
- Publishing is wired to `/api/herald/articles`, but **these server endpoints are not implemented in this release**. The login/editor will not work until the secure backend, Discord OAuth callback, role validation, HTML sanitization and D1 storage are deployed.
- Never add a frontend-only role bypass. Server must enforce role `1462585046329200700` on every write.
- Existing homepage, Kingdom Pulse, cards, and navigation are unchanged.
