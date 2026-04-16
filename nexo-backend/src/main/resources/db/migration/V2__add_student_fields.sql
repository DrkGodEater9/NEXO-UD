-- ============================================================
--  NEXO-UD  |  V2__add_student_fields.sql
--  Adds student_code and entry_semester columns to users table
-- ============================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS student_code    VARCHAR(20) UNIQUE,
    ADD COLUMN IF NOT EXISTS entry_semester  VARCHAR(10);
