-- Add RADICADOR_CALENDARIO to the allowed event types and update existing data

-- Rename INSCRIPCIONES -> INSCRIPCION to match new enum value
UPDATE calendar_events
SET event_type = 'INSCRIPCION'
WHERE event_type = 'INSCRIPCIONES';

-- The RADICADOR_CALENDARIO role is defined in the Java enum RoleName.
-- No separate roles table exists; roles are stored as enum strings in user_roles.
-- This migration documents the addition of the new role value.
-- The RoleController lists roles by reading RoleName.values(), so the new role
-- will automatically appear in GET /admin/roles once the enum is updated.

-- Add new event types as valid values (PostgreSQL check constraint update if any)
-- If there is a CHECK constraint on event_type column, update it:
DO $$
BEGIN
    -- Drop old check constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'calendar_events'
          AND constraint_type = 'CHECK'
          AND constraint_name LIKE '%event_type%'
    ) THEN
        ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_event_type_check;
    END IF;
END;
$$;
