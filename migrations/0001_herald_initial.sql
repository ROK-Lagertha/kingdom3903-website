-- The Citadel / Royal Herald: initial database schema (V3.13.1)
-- Execute once on the production D1 database citadel-herald-db.
-- Does not change public news content or enable article publishing.
CREATE TABLE IF NOT EXISTS herald_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Kingdom News',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  author_discord_id TEXT NOT NULL,
  author_display_name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  published_at TEXT,
  CHECK (status != 'published' OR published_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_herald_articles_status_published ON herald_articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_herald_articles_category ON herald_articles(category);

-- Only published articles may appear in Kingdom Pulse; enforce in application code.
-- Fixed slots 1..4 prevent a fifth homepage ticker article.
CREATE TABLE IF NOT EXISTS herald_pulse_slots (
  slot INTEGER PRIMARY KEY CHECK (slot BETWEEN 1 AND 4),
  article_id INTEGER NOT NULL UNIQUE REFERENCES herald_articles(id) ON DELETE CASCADE,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_by_discord_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS herald_article_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL REFERENCES herald_articles(id) ON DELETE CASCADE,
  actor_discord_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create','update','publish','unpublish','archive','restore','delete','pulse_add','pulse_remove','pulse_reorder')),
  occurred_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  details_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_herald_audit_article_time ON herald_article_audit(article_id,occurred_at DESC);
