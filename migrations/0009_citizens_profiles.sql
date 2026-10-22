-- Citizens of 3903: separate from Herald editorial tables.
CREATE TABLE IF NOT EXISTS citizen_profiles (
 discord_id TEXT PRIMARY KEY,
 governor_name TEXT NOT NULL,
 alliance TEXT NOT NULL DEFAULT '',
 about TEXT NOT NULL DEFAULT '',
 languages TEXT NOT NULL DEFAULT '',
 responsibilities TEXT NOT NULL DEFAULT '',
 categories TEXT NOT NULL DEFAULT '[]',
 image_key TEXT,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','rejected')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_citizen_profiles_status ON citizen_profiles(status,updated_at);
