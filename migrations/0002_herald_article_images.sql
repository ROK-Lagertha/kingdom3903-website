-- V3.13.9: Run ONCE on production D1 before deploying the new Worker.
-- Existing articles, Pulse selections and audit records are preserved.
CREATE TABLE IF NOT EXISTS herald_article_images (
 article_id INTEGER PRIMARY KEY REFERENCES herald_articles(id) ON DELETE CASCADE,
 object_key TEXT NOT NULL UNIQUE,
 content_type TEXT NOT NULL,
 byte_size INTEGER NOT NULL,
 updated_by_discord_id TEXT NOT NULL,
 updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
