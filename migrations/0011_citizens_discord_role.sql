-- V3.18.56 - execute once on the existing Citizens D1 database.
ALTER TABLE citizen_profiles ADD COLUMN discord_role TEXT NOT NULL DEFAULT 'citizen';
