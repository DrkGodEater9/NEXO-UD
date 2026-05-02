-- ============================================================
--  NEXO-UD  |  V10__add_images_to_announcements_and_welfare.sql
--  Agrega columna images (TEXT, JSON array de base64) a ambas tablas
-- ============================================================

ALTER TABLE announcements
    ADD COLUMN IF NOT EXISTS images TEXT;

ALTER TABLE welfare_contents
    ADD COLUMN IF NOT EXISTS images TEXT;
