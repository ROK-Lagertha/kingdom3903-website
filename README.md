# V3.12.4 — Discord Rate Limit Fix

Discord returned HTTP 429 while the OAuth callback was checking the Reporter role. This release reduces Discord calls to one membership lookup per login, retries a short 429 once when Retry-After permits, and stores a verified role snapshot in an encrypted HttpOnly cookie for up to 15 minutes. `/api/herald/me` and `/news/admin/` verify the signed, expiring snapshot without calling Discord repeatedly. Once expired, users must log in again, so role revocations can take up to 15 minutes to take effect. Failed membership checks never grant access. No changes to secrets, client ID, guild ID, Reporter role ID, or callback URLs. Publishing remains disabled.


## V3.12.5
Fix Cloudflare asset canonical redirect loop: protected admin route fetches dashboard.html instead of index.html. Keep /news/admin/ server-side authorization.
