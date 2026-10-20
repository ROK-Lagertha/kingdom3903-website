The Citadel — Lara preflight V3.18.21

This is a SAFE preparatory patch, NOT an active Lara translation integration.

1. Back up Cloudflare D1 database citadel-herald-db.
2. In Cloudflare D1 SQL Console execute migrations/0003_herald_translations.sql ONCE.
3. Copy worker.js into the repository root, commit, and push via GitHub Desktop.
4. Sign in to /news/admin/ using your existing Reporter login.
5. In the SAME browser open https://kingdom3903.com/api/herald/lara/status
   Expected JSON: credentialsConfigured=true, translationTableReady=true,
   translationApiTested=false, automaticPublishingEnabled=false.
   Without a Reporter login the endpoint returns 401.

Do not paste any credential values into chats or GitHub.
No article translation is performed by this patch. The next phase will use the
Lara SDK, validate language coverage and perform a controlled translation test.
