-- ============================================================
--  NEXO-UD  |  V15__create_views.sql
--  Crea las vistas requeridas por el Requerimiento R4
--  Requerimiento R4: Vista (VIEW) — 15 pts
-- ============================================================

-- ============================================================
--  VISTA: vista_horario_completo
--  Propósito: Combina las tablas schedules, schedule_blocks,
--             subjects y subject_groups para exponer el horario
--             completo de un estudiante con nombre de materia,
--             docente, día y franja horaria, sin necesidad de
--             hacer JOIN en la capa de aplicación.
--  Usada en: GET /api/v1/schedules/{scheduleId}
--            (ScheduleRepository.findByIdAndUserIdWithBlocks)
-- ============================================================

CREATE OR REPLACE VIEW vista_horario_completo AS
SELECT
    s.id                AS schedule_id,
    s.name              AS schedule_name,
    s.semester          AS schedule_semester,
    s.user_id,
    s.total_credits,
    s.archived,
    s.created_at        AS schedule_created_at,

    sb.id               AS block_id,
    sb.color,
    sb.manual,
    sb.manual_label,
    sb.manual_day,
    sb.manual_start_time,
    sb.manual_end_time,

    sub.id              AS subject_id,
    sub.nombre          AS subject_nombre,
    sub.codigo          AS subject_codigo,

    sg.id               AS group_id,
    sg.grupo_code,
    sg.docente,
    sg.inscritos,

    tb.dia,
    tb.hora_inicio,
    tb.hora_fin,
    tb.ubicacion

FROM schedules s
LEFT JOIN schedule_blocks sb  ON sb.schedule_id  = s.id
LEFT JOIN subjects        sub ON sub.id          = sb.subject_id
LEFT JOIN subject_groups  sg  ON sg.id           = sb.group_id
LEFT JOIN time_blocks     tb  ON tb.subject_group_id = sb.group_id;

-- ============================================================
--  VISTA: vista_avance_creditos
--  Propósito: Consolida el avance crediticio de cada estudiante
--             por plan de estudios y estado de las materias
--             (APROBADO, CURSANDO, PENDIENTE, REPROBADO).
--             Simplifica el endpoint GET /progress/{id}/summary
--             que antes requería 4 queries separadas.
--  Usada en: GET /api/v1/progress/{progressId}/summary
-- ============================================================

CREATE OR REPLACE VIEW vista_avance_creditos AS
SELECT
    uap.id              AS progress_id,
    uap.user_id,
    uap.study_plan_id,
    sp.nombre           AS plan_nombre,
    sp.facultad,

    usp.status,
    cs.credits,
    cs.nombre           AS subject_nombre,
    cs.codigo           AS subject_codigo,
    cs.semester         AS subject_semester,
    usp.grade

FROM user_academic_progress uap
JOIN study_plans            sp  ON sp.id  = uap.study_plan_id
JOIN user_subject_progress  usp ON usp.academic_progress_id  = uap.id
JOIN curriculum_subjects    cs  ON cs.id  = usp.curriculum_subject_id;
