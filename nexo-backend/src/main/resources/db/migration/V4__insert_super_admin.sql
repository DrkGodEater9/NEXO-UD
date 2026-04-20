-- ============================================================
--  NEXO-UD  |  V4__insert_super_admin.sql
--  Inserta credenciales del administrador inicial
-- ============================================================

-- Inserta el super admin con contraseña 'admin123'
INSERT INTO users (email, nickname, password_hash, active, created_at, updated_at)
VALUES (
    'admin@udistrital.edu.co',
    'Admin_SD',
    '$2a$10$AQ5j4S0mlQuqFwMbpD8bv.iOBZ13G4R79d8X7j3zG9p0Pbnqt7wca',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

-- Asigna rol ADMINISTRADOR recursivamente
INSERT INTO user_roles (role_name, assigned_at, user_id)
SELECT 'ADMINISTRADOR', CURRENT_TIMESTAMP, id
FROM users
WHERE email = 'admin@udistrital.edu.co'
ON CONFLICT ON CONSTRAINT uk_user_role DO NOTHING;
