# V3.12.4 — Discord Rate Limit Fix

Discord returned HTTP 429 while the OAuth callback was checking the Reporter role. This release reduces Discord calls to one membership lookup per login, retries a short 429 once when Retry-After permits, and stores a verified role snapshot in an encrypted HttpOnly cookie for up to 15 minutes. `/api/herald/me` and `/news/admin/` verify the signed, expiring snapshot without calling Discord repeatedly. Once expired, users must log in again, so role revocations can take up to 15 minutes to take effect. Failed membership checks never grant access. No changes to secrets, client ID, guild ID, Reporter role ID, or callback URLs. Publishing remains disabled.


## V3.12.5
Fix Cloudflare asset canonical redirect loop: protected admin route fetches dashboard.html instead of index.html. Keep /news/admin/ server-side authorization.

## V3.12.6 — Royal Herald Visual Refresh
Removed public Royal Desk sidebar and public homepage ticker checkbox. Expanded featured headline. Refined feature and dispatch card borders with soft golden illumination and reflective crown accents. Removed placeholder ticker checkbox from admin editor; article-to-Pulse selection is planned as a dedicated admin article list. No authentication or publishing changes.


## V3.12.7 – Kingdom Jewel Frames
- Crown ornaments are tilted and hang over upper-left card borders.
- Blue diamond jewels centered on top and bottom borders.
- Removed previous crown glyphs placed inside card content.
- Refined gold filigree borders; all auth and worker code unchanged.


## V3.12.8 – Royal Herald card spacing
- Wider horizontal and vertical gutters for the jewel-framed news cards.
- Prevent adjacent top and bottom gems from visually touching.
- Increased separation between featured headline and Latest Dispatches.
- Preserved crown positioning, jewels, OAuth, and Worker configuration.
