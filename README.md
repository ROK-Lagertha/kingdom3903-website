# V3.12.3 — Discord authorization diagnostics

No changes to Discord credentials, role ID or callback.

The OAuth callback now distinguishes three failure classes without exposing tokens, usernames, or role lists:
- `discord_identity_unavailable`: Discord identity request failed
- `discord_membership_unavailable`: membership endpoint failed; displays HTTP status
- `reporter_role_not_present`: Discord returned membership but not Reporter role

Cloudflare logs also record the failure class and HTTP status (no credentials).

This is a diagnostic release, not a claim that the role issue has been fixed. If membership is HTTP 403, check whether Discord OAuth2 `guilds.members.read` is granted and whether Discord application membership access is permitted. If HTTP 404, verify guild membership and endpoint authorization. If role not present, confirm the Reporter role is assigned to the account authorizing the application.

Do not paste cookies, authorization codes, tokens or secrets into chat.
