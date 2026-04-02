-- ============================================================
--  NEXO-UD  |  V1__init.sql  |  Esquema inicial completo
-- ============================================================

-- ── Usuarios ─────────────────────────────────────────────────

CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    nickname      VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL,
    updated_at    TIMESTAMP
);

CREATE TABLE user_roles (
    id          BIGSERIAL PRIMARY KEY,
    role_name   VARCHAR(50)  NOT NULL,
    assigned_at TIMESTAMP    NOT NULL,
    assigned_by BIGINT,
    user_id     BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_user_role UNIQUE (user_id, role_name)
);

-- ── Verificación de correo ────────────────────────────────────

CREATE TABLE verification_codes (
    id         BIGSERIAL PRIMARY KEY,
    email      VARCHAR(255) NOT NULL,
    code       VARCHAR(6)   NOT NULL,
    created_at TIMESTAMP    NOT NULL,
    expires_at TIMESTAMP    NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT FALSE,
    attempts   INT          NOT NULL DEFAULT 0
);

-- ── Oferta académica ─────────────────────────────────────────

CREATE TABLE academic_offers (
    id          BIGSERIAL PRIMARY KEY,
    semester    VARCHAR(20)  NOT NULL,
    uploaded_at TIMESTAMP    NOT NULL,
    uploaded_by BIGINT       NOT NULL,
    active      BOOLEAN      NOT NULL DEFAULT FALSE
);

-- ── Planes de estudio ─────────────────────────────────────────

CREATE TABLE study_plans (
    id          BIGSERIAL PRIMARY KEY,
    codigo_plan VARCHAR(50)  NOT NULL UNIQUE,
    nombre      VARCHAR(255) NOT NULL,
    facultad    VARCHAR(255) NOT NULL
);

-- ── Materias del catálogo curricular (para avance académico) ──

CREATE TABLE curriculum_subjects (
    id            BIGSERIAL PRIMARY KEY,
    codigo        VARCHAR(50)  NOT NULL,
    nombre        VARCHAR(255) NOT NULL,
    credits       INT          NOT NULL,
    semester      INT,
    study_plan_id BIGINT       NOT NULL REFERENCES study_plans (id) ON DELETE CASCADE,
    CONSTRAINT uk_curriculum_subject_code_plan UNIQUE (codigo, study_plan_id)
);

-- ── Materias del extractor de horarios ───────────────────────

CREATE TABLE subjects (
    id            BIGSERIAL PRIMARY KEY,
    codigo        VARCHAR(50)  NOT NULL,
    nombre        VARCHAR(255) NOT NULL,
    study_plan_id BIGINT       NOT NULL REFERENCES study_plans (id) ON DELETE CASCADE
);

-- ── Grupos de una materia ─────────────────────────────────────

CREATE TABLE subject_groups (
    id                BIGSERIAL PRIMARY KEY,
    grupo_code        VARCHAR(20)  NOT NULL,
    inscritos         INT          NOT NULL DEFAULT 0,
    docente           VARCHAR(255) NOT NULL,
    subject_id        BIGINT       NOT NULL REFERENCES subjects (id) ON DELETE CASCADE,
    academic_offer_id BIGINT       REFERENCES academic_offers (id) ON DELETE SET NULL
);

-- ── Bloques horarios de un grupo ──────────────────────────────

CREATE TABLE time_blocks (
    id               BIGSERIAL PRIMARY KEY,
    dia              VARCHAR(20)  NOT NULL,
    hora_inicio      INT          NOT NULL,
    hora_fin         INT          NOT NULL,
    ubicacion        VARCHAR(255) NOT NULL,
    subject_group_id BIGINT       NOT NULL REFERENCES subject_groups (id) ON DELETE CASCADE
);

-- ── Avance académico del usuario ──────────────────────────────

CREATE TABLE user_academic_progress (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    study_plan_id BIGINT    NOT NULL REFERENCES study_plans (id) ON DELETE CASCADE,
    enrolled_at   TIMESTAMP NOT NULL,
    CONSTRAINT uk_user_study_plan UNIQUE (user_id, study_plan_id)
);

CREATE TABLE user_subject_progress (
    id                     BIGSERIAL PRIMARY KEY,
    academic_progress_id   BIGINT       NOT NULL REFERENCES user_academic_progress (id) ON DELETE CASCADE,
    curriculum_subject_id  BIGINT       NOT NULL REFERENCES curriculum_subjects (id) ON DELETE CASCADE,
    status                 VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE',
    grade                  DOUBLE PRECISION,
    CONSTRAINT uk_progress_subject UNIQUE (academic_progress_id, curriculum_subject_id)
);

-- ── Sedes y salones ───────────────────────────────────────────

CREATE TABLE campuses (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    address    VARCHAR(255),
    faculty    VARCHAR(255) NOT NULL,
    latitude   DOUBLE PRECISION,
    longitude  DOUBLE PRECISION,
    map_url    VARCHAR(500),
    updated_at TIMESTAMP
);

CREATE TABLE classrooms (
    id        BIGSERIAL PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    building  VARCHAR(100),
    floor     VARCHAR(20),
    is_lab    BOOLEAN      NOT NULL DEFAULT FALSE,
    campus_id BIGINT       NOT NULL REFERENCES campuses (id) ON DELETE CASCADE
);

CREATE TABLE classroom_photos (
    id           BIGSERIAL PRIMARY KEY,
    photo_url    VARCHAR(500) NOT NULL,
    uploaded_by  BIGINT       NOT NULL,
    uploaded_at  TIMESTAMP    NOT NULL,
    classroom_id BIGINT       NOT NULL REFERENCES classrooms (id) ON DELETE CASCADE
);

-- ── Horarios guardados por el estudiante ─────────────────────

CREATE TABLE schedules (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT        NOT NULL,
    name          VARCHAR(255)  NOT NULL,
    semester      VARCHAR(20)   NOT NULL,
    notes         VARCHAR(2000),
    total_credits INT           NOT NULL DEFAULT 0,
    archived      BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP     NOT NULL,
    updated_at    TIMESTAMP
);

CREATE TABLE schedule_blocks (
    id                BIGSERIAL PRIMARY KEY,
    group_id          BIGINT,
    subject_id        BIGINT,
    color             VARCHAR(20),
    manual            BOOLEAN     NOT NULL DEFAULT FALSE,
    manual_label      VARCHAR(255),
    manual_day        VARCHAR(20),
    manual_start_time TIME,
    manual_end_time   TIME,
    schedule_id       BIGINT      NOT NULL REFERENCES schedules (id) ON DELETE CASCADE
);

-- ── Contenido informativo ─────────────────────────────────────

CREATE TABLE announcements (
    id         BIGSERIAL PRIMARY KEY,
    title      VARCHAR(255)  NOT NULL,
    body       VARCHAR(5000) NOT NULL,
    scope      VARCHAR(30)   NOT NULL,
    type       VARCHAR(30)   NOT NULL,
    faculty    VARCHAR(255),
    created_by BIGINT        NOT NULL,
    created_at TIMESTAMP     NOT NULL,
    updated_at TIMESTAMP
);

CREATE TABLE calendar_events (
    id         BIGSERIAL PRIMARY KEY,
    title      VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    event_type VARCHAR(30)  NOT NULL,
    start_date DATE         NOT NULL,
    end_date   DATE,
    created_by BIGINT       NOT NULL
);

CREATE TABLE welfare_contents (
    id          BIGSERIAL PRIMARY KEY,
    title       VARCHAR(255)  NOT NULL,
    description VARCHAR(5000) NOT NULL,
    category    VARCHAR(50)   NOT NULL,
    links       TEXT,
    created_by  BIGINT        NOT NULL,
    created_at  TIMESTAMP     NOT NULL,
    updated_at  TIMESTAMP
);

-- ── Reportes de errores ───────────────────────────────────────

CREATE TABLE reports (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT        NOT NULL,
    report_type  VARCHAR(50)   NOT NULL,
    description  VARCHAR(2000) NOT NULL,
    evidence_url VARCHAR(500),
    status       VARCHAR(30)   NOT NULL DEFAULT 'PENDIENTE',
    created_at   TIMESTAMP     NOT NULL,
    resolved_at  TIMESTAMP
);

-- ── Índices de rendimiento ────────────────────────────────────

CREATE INDEX idx_user_roles_user_id         ON user_roles (user_id);
CREATE INDEX idx_verification_codes_email   ON verification_codes (email);
CREATE INDEX idx_subjects_study_plan        ON subjects (study_plan_id);
CREATE INDEX idx_subject_groups_subject     ON subject_groups (subject_id);
CREATE INDEX idx_subject_groups_offer       ON subject_groups (academic_offer_id);
CREATE INDEX idx_time_blocks_group          ON time_blocks (subject_group_id);
CREATE INDEX idx_uap_user                   ON user_academic_progress (user_id);
CREATE INDEX idx_usp_progress               ON user_subject_progress (academic_progress_id);
CREATE INDEX idx_schedules_user             ON schedules (user_id);
CREATE INDEX idx_schedule_blocks_schedule   ON schedule_blocks (schedule_id);
CREATE INDEX idx_announcements_scope        ON announcements (scope);
CREATE INDEX idx_calendar_events_start_date ON calendar_events (start_date);
CREATE INDEX idx_welfare_contents_category  ON welfare_contents (category);
CREATE INDEX idx_reports_user               ON reports (user_id);
CREATE INDEX idx_reports_status             ON reports (status);
