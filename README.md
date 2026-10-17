# The Citadel V3.11.1 — Royal Herald Branding

- Added existing Citadel logo to the news-page navigation.
- Removed redundant NEWS link from news-page header.
- Introduced custom typographic Royal Herald emblem.
- Added a homepage ticker checkbox for featured articles, **visible only after server-verified admin login**.
- Added homepage ticker preference to editor UI, but no backend persistence yet.
- Removed the public publishing-access message; it appears only when the backend authenticates an administrator.
- Existing login API endpoints are still placeholders: `/api/herald/login`, `/api/herald/me`, `/api/herald/articles`.
- **Security:** Never trust checkbox state or editor visibility for access control. Implement Discord OAuth2 role `1462585046329200700`, CSRF protection, HTML sanitization, and server-side D1 writes before activating.
