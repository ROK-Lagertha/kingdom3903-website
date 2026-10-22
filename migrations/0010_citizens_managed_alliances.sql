-- V3.18.54: Run ONCE against existing Citizens D1 database.
ALTER TABLE citizen_profiles ADD COLUMN managed_alliances TEXT NOT NULL DEFAULT '[]';
