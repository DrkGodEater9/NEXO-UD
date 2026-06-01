-- ============================================================
--  NEXO-UD  |  V16__add_missing_fks_and_fix_constraints.sql
--
--  Agrega las 10 FK faltantes documentadas en la sección 1.6
--  y corrige 2 comportamientos ON DELETE inconsistentes entre
--  la documentación y las migraciones anteriores.
--
--  Problemas corregidos:
--    A) 9 FK nunca declaradas en V1 (relaciones huérfanas)
--    B) 1 columna (campuses.created_by) directamente ausente
--    C) 5 columnas NOT NULL que deberían ser nullable (ON DELETE SET NULL
--       requiere que la columna acepte NULL)
--    D) 2 FK con ON DELETE CASCADE declaradas incorrectamente;
--       la sección 1.6 especifica RESTRICT para ambas
-- ============================================================


-- ============================================================
--  SECCIÓN A — FK faltantes en tablas de contenido / usuarios
--
--  Contexto: announcements, calendar_events, welfare_contents,
--  classroom_photos y academic_offers tienen columnas created_by /
--  uploaded_by declaradas NOT NULL en V1, pero la sección 1.6
--  especifica ON DELETE SET NULL para todas ellas, lo cual requiere
--  que la columna sea nullable. Se elimina la restricción NOT NULL
--  antes de agregar la FK.
-- ============================================================

-- 1. announcements.created_by → users(id)  |  SET NULL / CASCADE
--    "Un aviso institucional puede mantenerse publicado aunque el
--     autor sea eliminado." (sección 1.6)
ALTER TABLE announcements
    ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE announcements
    ADD CONSTRAINT fk_announcements_created_by
        FOREIGN KEY (created_by)
        REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;

-- 2. calendar_events.created_by → users(id)  |  SET NULL / CASCADE
--    "Los eventos del calendario deben persistir independientemente
--     del autor." (sección 1.6)
ALTER TABLE calendar_events
    ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE calendar_events
    ADD CONSTRAINT fk_calendar_events_created_by
        FOREIGN KEY (created_by)
        REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;

-- 3. welfare_contents.created_by → users(id)  |  SET NULL / CASCADE
--    "El contenido de bienestar tiene valor institucional; el autor
--     puede eliminarse sin perder el contenido." (sección 1.6)
ALTER TABLE welfare_contents
    ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE welfare_contents
    ADD CONSTRAINT fk_welfare_contents_created_by
        FOREIGN KEY (created_by)
        REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;

-- 4. classroom_photos.uploaded_by → users(id)  |  SET NULL / CASCADE
--    "La foto del salón conserva su valor institucional aunque el
--     autor haya sido eliminado." (sección 1.6)
ALTER TABLE classroom_photos
    ALTER COLUMN uploaded_by DROP NOT NULL;

ALTER TABLE classroom_photos
    ADD CONSTRAINT fk_classroom_photos_uploaded_by
        FOREIGN KEY (uploaded_by)
        REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;

-- 5. academic_offers.uploaded_by → users(id)  |  SET NULL / CASCADE
--    "La oferta académica debe mantenerse disponible aunque el usuario
--     que la publicó sea eliminado." (sección 1.6)
ALTER TABLE academic_offers
    ALTER COLUMN uploaded_by DROP NOT NULL;

ALTER TABLE academic_offers
    ADD CONSTRAINT fk_academic_offers_uploaded_by
        FOREIGN KEY (uploaded_by)
        REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;

-- 6. reports.user_id → users(id)  |  RESTRICT / CASCADE
--    "Los reportes son registros históricos; no deben perderse al
--     eliminar un usuario." (sección 1.6)
--    La columna ya es NOT NULL en V1 — compatible con RESTRICT.
ALTER TABLE reports
    ADD CONSTRAINT fk_reports_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE;


-- ============================================================
--  SECCIÓN B — FK faltantes en schedules y schedule_blocks
--
--  schedules.user_id era NOT NULL sin referencia declarada.
--  schedule_blocks.group_id y subject_id eran columnas sueltas
--  sin FK, lo que rompe la integridad referencial del constructor
--  de horarios.
-- ============================================================

-- 7. schedules.user_id → users(id)  |  CASCADE / CASCADE
--    "Un horario personalizado no tiene sentido sin el usuario
--     que lo creó." (sección 1.6)
ALTER TABLE schedules
    ADD CONSTRAINT fk_schedules_user
        FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE;

-- 8. schedule_blocks.group_id → subject_groups(id)  |  CASCADE / CASCADE
--    "El bloque pierde significado si el grupo al que referencia
--     es eliminado." (sección 1.6)
ALTER TABLE schedule_blocks
    ADD CONSTRAINT fk_schedule_blocks_group
        FOREIGN KEY (group_id)
        REFERENCES subject_groups (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE;

-- 9. schedule_blocks.subject_id → subjects(id)  |  CASCADE / CASCADE
--    "Sin la materia, el bloque de horario no tiene referencia
--     académica válida." (sección 1.6)
ALTER TABLE schedule_blocks
    ADD CONSTRAINT fk_schedule_blocks_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE;


-- ============================================================
--  SECCIÓN C — Columna faltante: campuses.created_by
--
--  La sección 1.6 documenta campuses.created_by → users(id)
--  con ON DELETE SET NULL, pero esa columna no existía en V1.
-- ============================================================

-- 10. Agregar columna created_by a campuses y su FK
--     "La sede universitaria debe persistir como entidad
--      independientemente de quién la registró." (sección 1.6)
ALTER TABLE campuses
    ADD COLUMN IF NOT EXISTS created_by BIGINT;

ALTER TABLE campuses
    ADD CONSTRAINT fk_campuses_created_by
        FOREIGN KEY (created_by)
        REFERENCES users (id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;


-- ============================================================
--  SECCIÓN D — Corregir ON DELETE inconsistentes con sección 1.6
--
--  Ambas FK se crearon con ON DELETE CASCADE en V1, pero la
--  documentación especifica RESTRICT en los dos casos para
--  proteger registros académicos históricos.
-- ============================================================

-- 11. user_academic_progress.study_plan_id: CASCADE → RESTRICT
--     "No se puede eliminar un plan si hay estudiantes inscritos;
--      destruiría registros académicos activos." (sección 1.6)
--
--     PostgreSQL genera el nombre de la constraint inline como
--     user_academic_progress_study_plan_id_fkey
ALTER TABLE user_academic_progress
    DROP CONSTRAINT IF EXISTS user_academic_progress_study_plan_id_fkey;

ALTER TABLE user_academic_progress
    ADD CONSTRAINT fk_uap_study_plan
        FOREIGN KEY (study_plan_id)
        REFERENCES study_plans (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE;

-- 12. user_subject_progress.curriculum_subject_id: CASCADE → RESTRICT
--     "No se puede eliminar una materia de la malla si hay
--      estudiantes con progreso registrado (datos históricos)."
--      (sección 1.6)
ALTER TABLE user_subject_progress
    DROP CONSTRAINT IF EXISTS user_subject_progress_curriculum_subject_id_fkey;

ALTER TABLE user_subject_progress
    ADD CONSTRAINT fk_usp_curriculum_subject
        FOREIGN KEY (curriculum_subject_id)
        REFERENCES curriculum_subjects (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE;
