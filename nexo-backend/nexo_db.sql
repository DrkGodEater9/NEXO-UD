-- ============================================================================
-- NEXO_DB — Script completo de creación de base de datos PostgreSQL
-- Proyecto: NEXO Backend (Universidad Distrital)
-- ============================================================================

-- ============================================================================
-- 0. CREAR BASE DE DATOS Y CONECTAR
-- ============================================================================
-- Ejecutar esta sección conectado como superusuario (postgres):
--
--   CREATE DATABASE nexo_db
--       WITH OWNER = postgres
--       ENCODING = 'UTF8'
--       LC_COLLATE = 'es_CO.UTF-8'
--       LC_CTYPE = 'es_CO.UTF-8'
--       TEMPLATE = template0;
--
--   \c nexo_db
-- ============================================================================

-- ============================================================================
-- 1. LIMPIEZA (DROP en orden inverso de dependencias)
-- ============================================================================

DROP TABLE IF EXISTS classroom_photos    CASCADE;
DROP TABLE IF EXISTS time_blocks         CASCADE;
DROP TABLE IF EXISTS schedule_blocks     CASCADE;
DROP TABLE IF EXISTS classrooms          CASCADE;
DROP TABLE IF EXISTS subject_groups      CASCADE;
DROP TABLE IF EXISTS user_subject_progress CASCADE;
DROP TABLE IF EXISTS curriculum_subjects CASCADE;
DROP TABLE IF EXISTS subjects            CASCADE;
DROP TABLE IF EXISTS user_academic_progress CASCADE;
DROP TABLE IF EXISTS user_roles          CASCADE;
DROP TABLE IF EXISTS schedule_blocks     CASCADE;
DROP TABLE IF EXISTS schedules           CASCADE;
DROP TABLE IF EXISTS reports             CASCADE;
DROP TABLE IF EXISTS welfare_contents    CASCADE;
DROP TABLE IF EXISTS calendar_events     CASCADE;
DROP TABLE IF EXISTS announcements       CASCADE;
DROP TABLE IF EXISTS campuses            CASCADE;
DROP TABLE IF EXISTS academic_offers     CASCADE;
DROP TABLE IF EXISTS study_plans         CASCADE;
DROP TABLE IF EXISTS users               CASCADE;
DROP TABLE IF EXISTS verification_codes  CASCADE;

-- ============================================================================
-- 2. TABLAS INDEPENDIENTES (sin foreign keys)
-- ============================================================================

-- ─────────────────────────────────────────────
-- verification_codes
-- Códigos de verificación enviados por email
-- ─────────────────────────────────────────────
CREATE TABLE verification_codes (
    id              BIGSERIAL       PRIMARY KEY,
    email           VARCHAR(255)    NOT NULL,
    code            VARCHAR(6)      NOT NULL,
    created_at      TIMESTAMP       NOT NULL,
    expires_at      TIMESTAMP       NOT NULL,
    used            BOOLEAN         NOT NULL DEFAULT false,
    attempts        INTEGER         NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────────
-- users
-- Usuarios registrados en la plataforma
-- ─────────────────────────────────────────────
CREATE TABLE users (
    id              BIGSERIAL       PRIMARY KEY,
    email           VARCHAR(255)    NOT NULL,
    nickname        VARCHAR(255)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    active          BOOLEAN         NOT NULL DEFAULT true,
    created_at      TIMESTAMP       NOT NULL,
    updated_at      TIMESTAMP,

    CONSTRAINT uq_user_email    UNIQUE (email),
    CONSTRAINT uq_user_nickname UNIQUE (nickname)
);

-- ─────────────────────────────────────────────
-- study_plans
-- Planes de estudio / carreras universitarias
-- ─────────────────────────────────────────────
CREATE TABLE study_plans (
    id              BIGSERIAL       PRIMARY KEY,
    codigo_plan     VARCHAR(255)    NOT NULL,
    nombre          VARCHAR(255)    NOT NULL,
    facultad        VARCHAR(255)    NOT NULL,

    CONSTRAINT uq_plan_codigo UNIQUE (codigo_plan)
);

-- ─────────────────────────────────────────────
-- academic_offers
-- Ofertas académicas por semestre
-- ─────────────────────────────────────────────
CREATE TABLE academic_offers (
    id              BIGSERIAL       PRIMARY KEY,
    semester        VARCHAR(255)    NOT NULL,
    uploaded_at     TIMESTAMP       NOT NULL,
    uploaded_by     BIGINT          NOT NULL,
    active          BOOLEAN         NOT NULL DEFAULT false
);

-- ─────────────────────────────────────────────
-- campuses
-- Sedes universitarias
-- ─────────────────────────────────────────────
CREATE TABLE campuses (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(255)    NOT NULL,
    address         VARCHAR(255),
    faculty         VARCHAR(255)    NOT NULL,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    map_url         VARCHAR(255),
    updated_at      TIMESTAMP
);

-- ─────────────────────────────────────────────
-- schedules
-- Horarios personalizados de estudiantes
-- ─────────────────────────────────────────────
CREATE TABLE schedules (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    name            VARCHAR(255)    NOT NULL,
    semester        VARCHAR(255)    NOT NULL,
    notes           VARCHAR(2000),
    total_credits   INTEGER         NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       NOT NULL,
    updated_at      TIMESTAMP,
    archived        BOOLEAN         NOT NULL DEFAULT false
);

-- ─────────────────────────────────────────────
-- announcements
-- Avisos institucionales
-- ─────────────────────────────────────────────
CREATE TABLE announcements (
    id              BIGSERIAL       PRIMARY KEY,
    title           VARCHAR(255)    NOT NULL,
    body            VARCHAR(5000)   NOT NULL,
    scope           VARCHAR(20)     NOT NULL,
    type            VARCHAR(20)     NOT NULL,
    faculty         VARCHAR(255),
    created_by      BIGINT          NOT NULL,
    created_at      TIMESTAMP       NOT NULL,
    updated_at      TIMESTAMP,

    CONSTRAINT chk_announce_scope CHECK (scope IN ('FACULTAD', 'UNIVERSIDAD')),
    CONSTRAINT chk_announce_type  CHECK (type  IN ('GENERAL', 'ASAMBLEA'))
);

-- ─────────────────────────────────────────────
-- calendar_events
-- Eventos del calendario académico
-- ─────────────────────────────────────────────
CREATE TABLE calendar_events (
    id              BIGSERIAL       PRIMARY KEY,
    title           VARCHAR(255)    NOT NULL,
    description     VARCHAR(255),
    event_type      VARCHAR(20)     NOT NULL,
    start_date      DATE            NOT NULL,
    end_date        DATE,
    created_by      BIGINT          NOT NULL,

    CONSTRAINT chk_event_type CHECK (event_type IN ('FESTIVO', 'PARO', 'INSCRIPCIONES', 'OTRO'))
);

-- ─────────────────────────────────────────────
-- welfare_contents
-- Contenido de bienestar universitario
-- ─────────────────────────────────────────────
CREATE TABLE welfare_contents (
    id              BIGSERIAL       PRIMARY KEY,
    title           VARCHAR(255)    NOT NULL,
    description     VARCHAR(5000)   NOT NULL,
    category        VARCHAR(30)     NOT NULL,
    links           VARCHAR(255),
    created_by      BIGINT          NOT NULL,
    created_at      TIMESTAMP       NOT NULL,
    updated_at      TIMESTAMP,

    CONSTRAINT chk_welfare_cat CHECK (category IN ('APOYO_ALIMENTARIO', 'BECAS', 'SALUD_MENTAL', 'SERVICIOS_SALUD'))
);

-- ─────────────────────────────────────────────
-- reports
-- Reportes de errores y solicitudes
-- ─────────────────────────────────────────────
CREATE TABLE reports (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    report_type     VARCHAR(30)     NOT NULL,
    description     VARCHAR(2000)   NOT NULL,
    evidence_url    VARCHAR(255),
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDIENTE',
    created_at      TIMESTAMP       NOT NULL,
    resolved_at     TIMESTAMP,

    CONSTRAINT chk_report_type   CHECK (report_type IN ('ERROR_HORARIO', 'CAMBIO_SALON', 'INFORMACION_INCORRECTA', 'OTRO')),
    CONSTRAINT chk_report_status CHECK (status      IN ('PENDIENTE', 'EN_REVISION', 'RESUELTO', 'DESCARTADO'))
);

-- ============================================================================
-- 3. TABLAS DEPENDIENTES — NIVEL 1
-- ============================================================================

-- ─────────────────────────────────────────────
-- user_roles
-- Roles asignados a cada usuario
-- ─────────────────────────────────────────────
CREATE TABLE user_roles (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    role_name       VARCHAR(50)     NOT NULL,
    assigned_at     TIMESTAMP       NOT NULL,
    assigned_by     BIGINT,

    CONSTRAINT fk_role_user  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_role  UNIQUE (user_id, role_name),
    CONSTRAINT chk_role_name CHECK (role_name IN (
        'ADMINISTRADOR',
        'ESTUDIANTE',
        'RADICADOR_AVISOS',
        'RADICADOR_BIENESTAR',
        'RADICADOR_SEDES'
    ))
);

-- ─────────────────────────────────────────────
-- user_academic_progress
-- Inscripción de un usuario en un plan de estudio
-- ─────────────────────────────────────────────
CREATE TABLE user_academic_progress (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    study_plan_id   BIGINT          NOT NULL,
    enrolled_at     TIMESTAMP       NOT NULL,

    CONSTRAINT fk_progress_user     FOREIGN KEY (user_id)       REFERENCES users(id)        ON DELETE CASCADE,
    CONSTRAINT fk_progress_plan     FOREIGN KEY (study_plan_id) REFERENCES study_plans(id)  ON DELETE RESTRICT,
    CONSTRAINT uk_user_study_plan   UNIQUE (user_id, study_plan_id)
);

-- ─────────────────────────────────────────────
-- curriculum_subjects
-- Materias de la malla curricular de un plan
-- ─────────────────────────────────────────────
CREATE TABLE curriculum_subjects (
    id              BIGSERIAL       PRIMARY KEY,
    codigo          VARCHAR(255)    NOT NULL,
    nombre          VARCHAR(255)    NOT NULL,
    credits         INTEGER         NOT NULL,
    semester        INTEGER,
    study_plan_id   BIGINT          NOT NULL,

    CONSTRAINT fk_curriculum_plan               FOREIGN KEY (study_plan_id) REFERENCES study_plans(id) ON DELETE CASCADE,
    CONSTRAINT uk_curriculum_subject_code_plan   UNIQUE (codigo, study_plan_id)
);

-- ─────────────────────────────────────────────
-- subjects
-- Materias extraídas de la oferta académica
-- ─────────────────────────────────────────────
CREATE TABLE subjects (
    id              BIGSERIAL       PRIMARY KEY,
    codigo          VARCHAR(255)    NOT NULL,
    nombre          VARCHAR(255)    NOT NULL,
    study_plan_id   BIGINT          NOT NULL,

    CONSTRAINT fk_subject_plan FOREIGN KEY (study_plan_id) REFERENCES study_plans(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- classrooms
-- Salones de clase dentro de una sede
-- ─────────────────────────────────────────────
CREATE TABLE classrooms (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(255)    NOT NULL,
    building        VARCHAR(255),
    floor           VARCHAR(255),
    is_lab          BOOLEAN         NOT NULL DEFAULT false,
    campus_id       BIGINT          NOT NULL,

    CONSTRAINT fk_classroom_campus FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- schedule_blocks
-- Bloques individuales dentro de un horario
-- ─────────────────────────────────────────────
CREATE TABLE schedule_blocks (
    id                  BIGSERIAL       PRIMARY KEY,
    schedule_id         BIGINT          NOT NULL,
    group_id            BIGINT,
    subject_id          BIGINT,
    color               VARCHAR(255),
    manual              BOOLEAN         NOT NULL DEFAULT false,
    manual_label        VARCHAR(255),
    manual_day          VARCHAR(20),
    manual_start_time   TIME,
    manual_end_time     TIME,

    CONSTRAINT fk_schedblock_sched FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

-- ============================================================================
-- 4. TABLAS DEPENDIENTES — NIVEL 2
-- ============================================================================

-- ─────────────────────────────────────────────
-- user_subject_progress
-- Progreso de un estudiante en cada materia
-- ─────────────────────────────────────────────
CREATE TABLE user_subject_progress (
    id                      BIGSERIAL           PRIMARY KEY,
    academic_progress_id    BIGINT              NOT NULL,
    curriculum_subject_id   BIGINT              NOT NULL,
    status                  VARCHAR(20)         NOT NULL DEFAULT 'PENDIENTE',
    grade                   DOUBLE PRECISION,

    CONSTRAINT fk_subj_progress_academic    FOREIGN KEY (academic_progress_id)  REFERENCES user_academic_progress(id)   ON DELETE CASCADE,
    CONSTRAINT fk_subj_progress_curriculum  FOREIGN KEY (curriculum_subject_id) REFERENCES curriculum_subjects(id)      ON DELETE RESTRICT,
    CONSTRAINT uk_progress_subject          UNIQUE (academic_progress_id, curriculum_subject_id),
    CONSTRAINT chk_subj_status             CHECK (status IN ('PENDIENTE', 'CURSANDO', 'APROBADA'))
);

-- ─────────────────────────────────────────────
-- subject_groups
-- Grupos de una materia en la oferta académica
-- ─────────────────────────────────────────────
CREATE TABLE subject_groups (
    id                  BIGSERIAL       PRIMARY KEY,
    grupo_code          VARCHAR(255)    NOT NULL,
    inscritos           INTEGER         NOT NULL,
    docente             VARCHAR(255)    NOT NULL,
    subject_id          BIGINT          NOT NULL,
    academic_offer_id   BIGINT,

    CONSTRAINT fk_group_subject FOREIGN KEY (subject_id)        REFERENCES subjects(id)         ON DELETE CASCADE,
    CONSTRAINT fk_group_offer   FOREIGN KEY (academic_offer_id) REFERENCES academic_offers(id)  ON DELETE SET NULL
);

-- ─────────────────────────────────────────────
-- classroom_photos
-- Fotos de referencia de los salones
-- ─────────────────────────────────────────────
CREATE TABLE classroom_photos (
    id              BIGSERIAL       PRIMARY KEY,
    photo_url       VARCHAR(255)    NOT NULL,
    uploaded_by     BIGINT          NOT NULL,
    uploaded_at     TIMESTAMP       NOT NULL,
    classroom_id    BIGINT          NOT NULL,

    CONSTRAINT fk_photo_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
);

-- ============================================================================
-- 5. TABLAS DEPENDIENTES — NIVEL 3
-- ============================================================================

-- ─────────────────────────────────────────────
-- time_blocks
-- Bloques de horario de cada grupo
-- ─────────────────────────────────────────────
CREATE TABLE time_blocks (
    id                  BIGSERIAL       PRIMARY KEY,
    dia                 VARCHAR(20)     NOT NULL,
    hora_inicio         INTEGER         NOT NULL,
    hora_fin            INTEGER         NOT NULL,
    ubicacion           VARCHAR(255)    NOT NULL,
    subject_group_id    BIGINT          NOT NULL,

    CONSTRAINT fk_timeblock_group FOREIGN KEY (subject_group_id) REFERENCES subject_groups(id) ON DELETE CASCADE,
    CONSTRAINT chk_dia            CHECK (dia IN ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO')),
    CONSTRAINT chk_hora_inicio    CHECK (hora_inicio >= 0 AND hora_inicio <= 23),
    CONSTRAINT chk_hora_fin       CHECK (hora_fin   >= 0 AND hora_fin   <= 23)
);

-- ============================================================================
-- 6. ÍNDICES DE RENDIMIENTO
-- ============================================================================

-- Auth ──────────────────────────────────────
CREATE INDEX idx_verif_email_created        ON verification_codes (email, created_at DESC);
CREATE INDEX idx_verif_expires              ON verification_codes (expires_at);

-- Users ─────────────────────────────────────
CREATE INDEX idx_user_email_lower           ON users (LOWER(email));

-- Roles ─────────────────────────────────────
CREATE INDEX idx_role_user_id               ON user_roles (user_id);

-- Academic Progress ─────────────────────────
CREATE INDEX idx_acad_progress_user         ON user_academic_progress (user_id);
CREATE INDEX idx_acad_progress_plan         ON user_academic_progress (study_plan_id);

-- Subject Progress ──────────────────────────
CREATE INDEX idx_subj_progress_academic     ON user_subject_progress (academic_progress_id);
CREATE INDEX idx_subj_progress_curriculum   ON user_subject_progress (curriculum_subject_id);
CREATE INDEX idx_subj_progress_status       ON user_subject_progress (academic_progress_id, status);

-- Academic Offers (índice parcial) ──────────
CREATE INDEX idx_offer_active               ON academic_offers (active) WHERE active = true;

-- Study Plans ───────────────────────────────
CREATE INDEX idx_plan_faculty_name          ON study_plans (facultad, nombre);

-- Subjects ──────────────────────────────────
CREATE INDEX idx_subject_plan               ON subjects (study_plan_id);
CREATE INDEX idx_subject_code_plan          ON subjects (codigo, study_plan_id);

-- Subject Groups ────────────────────────────
CREATE INDEX idx_group_subject              ON subject_groups (subject_id);
CREATE INDEX idx_group_offer                ON subject_groups (academic_offer_id);

-- Time Blocks ───────────────────────────────
CREATE INDEX idx_timeblock_group            ON time_blocks (subject_group_id);
CREATE INDEX idx_timeblock_day_hour         ON time_blocks (dia, hora_inicio);

-- Curriculum Subjects ───────────────────────
CREATE INDEX idx_curriculum_plan            ON curriculum_subjects (study_plan_id);

-- Schedules ─────────────────────────────────
CREATE INDEX idx_schedule_user              ON schedules (user_id, created_at DESC);

-- Schedule Blocks ───────────────────────────
CREATE INDEX idx_schedblock_schedule        ON schedule_blocks (schedule_id);

-- Announcements ─────────────────────────────
CREATE INDEX idx_announce_scope_type        ON announcements (scope, type);
CREATE INDEX idx_announce_created           ON announcements (created_at DESC);
CREATE INDEX idx_announce_faculty           ON announcements (faculty);

-- Calendar Events ───────────────────────────
CREATE INDEX idx_calendar_start             ON calendar_events (start_date);
CREATE INDEX idx_calendar_type              ON calendar_events (event_type);

-- Welfare ───────────────────────────────────
CREATE INDEX idx_welfare_category           ON welfare_contents (category, created_at DESC);

-- Campuses ──────────────────────────────────
CREATE INDEX idx_campus_faculty             ON campuses (faculty);

-- Classrooms ────────────────────────────────
CREATE INDEX idx_classroom_campus           ON classrooms (campus_id);

-- Classroom Photos ──────────────────────────
CREATE INDEX idx_photo_classroom            ON classroom_photos (classroom_id);

-- Reports ───────────────────────────────────
CREATE INDEX idx_report_user                ON reports (user_id, created_at DESC);
CREATE INDEX idx_report_status_type         ON reports (status, report_type);

-- ============================================================================
-- 7. VERIFICACIÓN FINAL
-- ============================================================================

-- Contar tablas creadas (esperado: 20)
SELECT
    'Tablas creadas: ' || COUNT(*)::TEXT AS resultado
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type   = 'BASE TABLE';

-- Listar todas las tablas con sus columnas
SELECT
    t.table_name,
    COUNT(c.column_name) AS columnas
FROM information_schema.tables t
JOIN information_schema.columns c
    ON c.table_schema = t.table_schema
    AND c.table_name  = t.table_name
WHERE t.table_schema = 'public'
  AND t.table_type   = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;

-- ============================================================================
-- FIN — nexo_db creada exitosamente
-- ============================================================================
