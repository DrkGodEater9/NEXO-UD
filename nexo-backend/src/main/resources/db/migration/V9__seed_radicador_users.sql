-- ============================================================
--  NEXO-UD  |  V9__seed_radicador_users.sql
--  Inserta 4 usuarios de prueba con roles de radicador.
--  Contraseña para todos: admin123
--  Hash BCrypt cost-10 de 'admin123' (mismo que el super admin)
-- ============================================================

-- ── 1. RADICADOR_AVISOS ──────────────────────────────────────
INSERT INTO users (email, nickname, password_hash, active, created_at, updated_at)
VALUES (
    'radicador.avisos@udistrital.edu.co',
    'Rad_Avisos',
    '$2a$10$AQ5j4S0mlQuqFwMbpD8bv.iOBZ13G4R79d8X7j3zG9p0Pbnqt7wca',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (role_name, assigned_at, user_id)
SELECT 'ESTUDIANTE', CURRENT_TIMESTAMP, u.id
FROM users u
WHERE u.email = 'radicador.avisos@udistrital.edu.co'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role_name = 'ESTUDIANTE'
  );

INSERT INTO user_roles (role_name, assigned_at, user_id)
SELECT 'RADICADOR_AVISOS', CURRENT_TIMESTAMP, u.id
FROM users u
WHERE u.email = 'radicador.avisos@udistrital.edu.co'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role_name = 'RADICADOR_AVISOS'
  );

-- ── 2. RADICADOR_BIENESTAR ───────────────────────────────────
INSERT INTO users (email, nickname, password_hash, active, created_at, updated_at)
VALUES (
    'radicador.bienestar@udistrital.edu.co',
    'Rad_Bienestar',
    '$2a$10$AQ5j4S0mlQuqFwMbpD8bv.iOBZ13G4R79d8X7j3zG9p0Pbnqt7wca',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (role_name, assigned_at, user_id)
SELECT 'ESTUDIANTE', CURRENT_TIMESTAMP, u.id
FROM users u
WHERE u.email = 'radicador.bienestar@udistrital.edu.co'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role_name = 'ESTUDIANTE'
  );

INSERT INTO user_roles (role_name, assigned_at, user_id)
SELECT 'RADICADOR_BIENESTAR', CURRENT_TIMESTAMP, u.id
FROM users u
WHERE u.email = 'radicador.bienestar@udistrital.edu.co'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role_name = 'RADICADOR_BIENESTAR'
  );

-- ── 3. RADICADOR_SEDES ───────────────────────────────────────
INSERT INTO users (email, nickname, password_hash, active, created_at, updated_at)
VALUES (
    'radicador.sedes@udistrital.edu.co',
    'Rad_Sedes',
    '$2a$10$AQ5j4S0mlQuqFwMbpD8bv.iOBZ13G4R79d8X7j3zG9p0Pbnqt7wca',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (role_name, assigned_at, user_id)
SELECT 'ESTUDIANTE', CURRENT_TIMESTAMP, u.id
FROM users u
WHERE u.email = 'radicador.sedes@udistrital.edu.co'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role_name = 'ESTUDIANTE'
  );

INSERT INTO user_roles (role_name, assigned_at, user_id)
SELECT 'RADICADOR_SEDES', CURRENT_TIMESTAMP, u.id
FROM users u
WHERE u.email = 'radicador.sedes@udistrital.edu.co'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role_name = 'RADICADOR_SEDES'
  );

-- ── 4. RADICADOR_CALENDARIO ──────────────────────────────────
INSERT INTO users (email, nickname, password_hash, active, created_at, updated_at)
VALUES (
    'radicador.calendario@udistrital.edu.co',
    'Rad_Calendario',
    '$2a$10$AQ5j4S0mlQuqFwMbpD8bv.iOBZ13G4R79d8X7j3zG9p0Pbnqt7wca',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (role_name, assigned_at, user_id)
SELECT 'ESTUDIANTE', CURRENT_TIMESTAMP, u.id
FROM users u
WHERE u.email = 'radicador.calendario@udistrital.edu.co'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role_name = 'ESTUDIANTE'
  );

INSERT INTO user_roles (role_name, assigned_at, user_id)
SELECT 'RADICADOR_CALENDARIO', CURRENT_TIMESTAMP, u.id
FROM users u
WHERE u.email = 'radicador.calendario@udistrital.edu.co'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role_name = 'RADICADOR_CALENDARIO'
  );
