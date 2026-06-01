-- ============================================================
--  NEXO-UD  |  V14__add_check_constraints.sql
--  Agrega restricciones CHECK documentadas en la sección 1.5
--  Requerimiento R1: Base de datos relacional (20 pts)
-- ============================================================

-- ── Tabla: users ─────────────────────────────────────────────

-- El correo debe contener el símbolo @ para ser válido
ALTER TABLE users
    ADD CONSTRAINT chk_users_email_format
        CHECK (email LIKE '%@%');

-- El código estudiantil debe tener exactamente 11 dígitos numéricos
ALTER TABLE users
    ADD CONSTRAINT chk_users_student_code_digits
        CHECK (student_code IS NULL OR student_code ~ '^\d{11}$');

-- El semestre de ingreso debe tener formato YYYY-1 o YYYY-2
ALTER TABLE users
    ADD CONSTRAINT chk_users_entry_semester_format
        CHECK (entry_semester IS NULL OR entry_semester ~ '^\d{4}-[12]$');

-- ── Tabla: schedules ─────────────────────────────────────────

-- Los créditos totales del horario no pueden ser un valor negativo
ALTER TABLE schedules
    ADD CONSTRAINT chk_schedules_total_credits_nonneg
        CHECK (total_credits >= 0);

-- El semestre del horario debe seguir el formato YYYY-1 o YYYY-2
ALTER TABLE schedules
    ADD CONSTRAINT chk_schedules_semester_format
        CHECK (semester ~ '^\d{4}-[12]$');

-- ── Tabla: curriculum_subjects ────────────────────────────────

-- Los créditos deben ser positivos; ningún espacio académico tiene 0 créditos
ALTER TABLE curriculum_subjects
    ADD CONSTRAINT chk_curriculum_credits_positive
        CHECK (credits > 0);

-- El semestre curricular de la materia debe estar entre 1 y 10
ALTER TABLE curriculum_subjects
    ADD CONSTRAINT chk_curriculum_semester_range
        CHECK (semester IS NULL OR semester BETWEEN 1 AND 10);

-- El nombre no puede ser una cadena vacía ni contener solo espacios
ALTER TABLE curriculum_subjects
    ADD CONSTRAINT chk_curriculum_nombre_nonempty
        CHECK (TRIM(nombre) <> '');

-- ── Tabla: reports ────────────────────────────────────────────

-- La descripción del reporte no puede estar vacía ni ser solo espacios
ALTER TABLE reports
    ADD CONSTRAINT chk_reports_description_nonempty
        CHECK (TRIM(description) <> '');

-- Si el estado es RESUELTO o DESCARTADO, resolved_at no puede ser NULL
ALTER TABLE reports
    ADD CONSTRAINT chk_reports_resolved_at_required
        CHECK (
            status NOT IN ('RESUELTO', 'DESCARTADO')
            OR resolved_at IS NOT NULL
        );

-- ── Tabla: time_blocks ────────────────────────────────────────

-- La hora de fin debe ser posterior a la hora de inicio del bloque
ALTER TABLE time_blocks
    ADD CONSTRAINT chk_time_blocks_hora_orden
        CHECK (hora_fin > hora_inicio);
