-- ============================================================
--  NEXO-UD  |  V11__alter_reports_evidence_url_to_text.sql
--  Amplía evidence_url de VARCHAR(255) a TEXT para soportar
--  arrays de imágenes base64
-- ============================================================

ALTER TABLE reports
    ALTER COLUMN evidence_url TYPE TEXT;
