# The Citadel V3.12.0 — Discord Login for Royal Herald

## What's included
- Cloudflare Worker static assets + `/api/herald/login`, `/callback`, `/me`, `/logout`.
- Discord OAuth2 authorization-code flow with `identify guilds.members.read` scopes.
- OAuth state verification; encrypted, HttpOnly, Secure, SameSite=Lax session cookie.
- **Every `/me` request re-checks live guild membership and Administrator role `1462585046329200700`** in guild `1462581217722368074`.
- Role and session validation is server-side; no privileged data from browser assertions.
- HTML editor is revealed only after successful `/me` admin verification.
- `/api/herald/articles` intentionally returns HTTP 501 until D1 + CSRF + HTML sanitization are implemented.

## Cloudflare Worker deployment
This version changes the project layout: website static files are in `public/`, while `worker.js` handles API routes.
1. Connect the repository to a Cloudflare **Worker** using Wrangler config `wrangler.jsonc`; build command can be left empty, deploy command `npx wrangler deploy` if your Git integration requires it. Do NOT deploy only the `public/` folder, or auth endpoints will not exist.
2. In Cloudflare Worker settings, configure **encrypted secrets** (not GitHub files):
   - `DISCORD_CLIENT_SECRET` — Discord application client secret
   - `HERALD_SESSION_SECRET` — a random secret string of at least 32 characters
3. Optional environment variable `HERALD_CALLBACK_URL` = `https://kingdom3903.com/api/herald/callback`. The Worker derives the callback from the incoming host if unset, but an explicit canonical callback is recommended.
4. In the **existing BattleTrack Discord application** (client ID `1557797621832360027`), add redirect `https://kingdom3903.com/api/herald/callback` under OAuth2 Redirects. If testing on workers.dev, add that domain's matching callback separately.
5. Verify your custom domain `kingdom3903.com` routes to this Worker and the static asset binding works.
6. Test with admin and non-admin Discord users. The login should deny users lacking the admin role.

IMPORTANT: If your existing deployment is **Cloudflare Pages** or a Worker with a different Wrangler configuration, review and merge settings instead of replacing the live worker configuration blindly. Domain, routes and custom bindings are not configured in this ZIP. Deploying without secrets will return 503 from the auth API. No D1 or editor publishing is enabled.
