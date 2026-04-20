-- ============================================================
--  V5 — Tabla de semestres (configuración administrativa)
-- ============================================================

CREATE TABLE semesters (
    id         BIGSERIAL    PRIMARY KEY,
    name       VARCHAR(20)  NOT NULL UNIQUE,
    active     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL
);
