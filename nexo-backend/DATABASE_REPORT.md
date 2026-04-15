# Informe Completo de Base de Datos — NEXO Backend (PostgreSQL)

## Índice

1. [Resumen General](#1-resumen-general)
2. [Diagrama de Relaciones (ER Textual)](#2-diagrama-de-relaciones-er-textual)
3. [Tipos Enumerados](#3-tipos-enumerados)
4. [Definición de Tablas (DDL)](#4-definición-de-tablas-ddl)
5. [Relaciones y Foreign Keys](#5-relaciones-y-foreign-keys)
6. [Índices Recomendados](#6-índices-recomendados)
7. [Queries Derivados de Repositorios](#7-queries-derivados-de-repositorios)
8. [Script SQL Completo](#8-script-sql-completo)

---

## 1. Resumen General

| Módulo | Tablas | Descripción |
|--------|--------|-------------|
| **Auth** | `verification_codes` | Códigos de verificación por email |
| **User** | `users`, `user_roles`, `user_academic_progress`, `user_subject_progress` | Usuarios, roles y progreso académico |
| **Academic** | `academic_offers`, `study_plans`, `subjects`, `subject_groups`, `time_blocks`, `curriculum_subjects` | Oferta académica, planes de estudio y malla curricular |
| **Schedule** | `schedules`, `schedule_blocks` | Horarios personalizados de estudiantes |
| **Content** | `announcements`, `calendar_events`, `welfare_contents` | Avisos, calendario y bienestar |
| **Campus** | `campuses`, `classrooms`, `classroom_photos` | Sedes, salones y fotos |
| **Report** | `reports` | Reportes de errores |

**Total: 20 tablas**

---

## 2. Diagrama de Relaciones (ER Textual)

```
users ──1:N──> user_roles
users ──1:N──> user_academic_progress
                    │
                    ├──N:1──> study_plans
                    │              │
                    │              ├──1:N──> subjects ──1:N──> subject_groups ──1:N──> time_blocks
                    │              │                                │
                    │              │                                └──N:1──> academic_offers
                    │              │
                    │              └──1:N──> curriculum_subjects
                    │                              ▲
                    └──1:N──> user_subject_progress ┘
                                   (N:1 curriculum_subject)

schedules ──1:N──> schedule_blocks
  (userId → users.id, no FK explícita en entidad)

campuses ──1:N──> classrooms ──1:N──> classroom_photos

verification_codes (independiente)
announcements (independiente)
calendar_events (independiente)
welfare_contents (independiente)
reports (independiente, userId referencia a users)
```

---

## 3. Tipos Enumerados

```sql
-- Roles de usuario
CREATE TYPE role_name AS ENUM (
    'ADMINISTRADOR',
    'ESTUDIANTE',
    'RADICADOR_AVISOS',
    'RADICADOR_BIENESTAR',
    'RADICADOR_SEDES'
);

-- Estado de materia en progreso académico
CREATE TYPE subject_status AS ENUM (
    'PENDIENTE',
    'CURSANDO',
    'APROBADA'
);

-- Días de la semana (bloques de horario)
CREATE TYPE day_of_week AS ENUM (
    'LUNES',
    'MARTES',
    'MIERCOLES',
    'JUEVES',
    'VIERNES',
    'SABADO',
    'DOMINGO'
);

-- Alcance de avisos
CREATE TYPE announcement_scope AS ENUM (
    'FACULTAD',
    'UNIVERSIDAD'
);

-- Tipo de aviso
CREATE TYPE announcement_type AS ENUM (
    'GENERAL',
    'ASAMBLEA'
);

-- Tipo de evento de calendario
CREATE TYPE calendar_event_type AS ENUM (
    'FESTIVO',
    'PARO',
    'INSCRIPCIONES',
    'OTRO'
);

-- Categoría de bienestar
CREATE TYPE welfare_category AS ENUM (
    'APOYO_ALIMENTARIO',
    'BECAS',
    'SALUD_MENTAL',
    'SERVICIOS_SALUD'
);

-- Estado de reporte
CREATE TYPE report_status AS ENUM (
    'PENDIENTE',
    'EN_REVISION',
    'RESUELTO',
    'DESCARTADO'
);

-- Tipo de reporte
CREATE TYPE report_type AS ENUM (
    'ERROR_HORARIO',
    'CAMBIO_SALON',
    'INFORMACION_INCORRECTA',
    'OTRO'
);
```

> **Nota:** JPA almacena los enums como `VARCHAR` (por `@Enumerated(EnumType.STRING)`). Los tipos `CREATE TYPE ... AS ENUM` son opcionales en PostgreSQL. Si se prefiere usar `VARCHAR` con `CHECK` constraints, ver la sección del script SQL completo donde se ofrecen ambas alternativas.

---

## 4. Definición de Tablas (DDL)

### 4.1 — `verification_codes`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `BIGSERIAL` | PK, AUTO_INCREMENT |
| `email` | `VARCHAR(255)` | NOT NULL |
| `code` | `VARCHAR(6)` | NOT NULL |
| `created_at` | `TIMESTAMP` | NOT NULL |
| `expires_at` | `TIMESTAMP` | NOT NULL |
| `used` | `BOOLEAN` | NOT NULL, DEFAULT false |
| `attempts` | `INTEGER` | NOT NULL, DEFAULT 0 |

---

### 4.2 — `users`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `BIGSERIAL` | PK |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE |
| `nickname` | `VARCHAR(255)` | NOT NULL, UNIQUE |
| `password_hash` | `VARCHAR(255)` | NOT NULL |
| `active` | `BOOLEAN` | NOT NULL, DEFAULT true |
| `created_at` | `TIMESTAMP` | NOT NULL |
| `updated_at` | `TIMESTAMP` | NULL |

---

### 4.3 — `user_roles`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `BIGSERIAL` | PK |
| `user_id` | `BIGINT` | NOT NULL, FK → `users(id)` |
| `role_name` | `VARCHAR(50)` | NOT NULL |
| `assigned_at` | `TIMESTAMP` | NOT NULL |
| `assigned_by` | `BIGINT` | NULL |

**Unique constraint:** `(user_id, role_name)`

---

### 4.4 — `study_plans`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `BIGSERIAL` | PK |
| `codigo_plan` | `VARCHAR(255)` | NOT NULL, UNIQUE |
| `nombre` | `VARCHAR(255)` | NOT NULL |
| `facultad` | `VARCHAR(255)` | NOT NULL |

---

### 4.5 — `user_academic_progress`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `BIGSERIAL` | PK |
| `user_id` | `BIGINT` | NOT NULL, FK → `users(id)` |
| `study_plan_id` | `BIGINT` | NOT NULL, FK → `study_plans(id)` |
| `enrolled_at` | `TIMESTAMP` | NOT NULL |

**Unique constraint:** `uk_user_study_plan (user_id, study_plan_id)`

---

### 4.6 — `curriculum_subjects`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `BIGSERIAL` | PK |
| `codigo` | `VARCHAR(255)` | NOT NULL |
| `nombre` | `VARCHAR(255)` | NOT NULL |
| `credits` | `INTEGER` | NOT NULL |
| `semester` | `INTEGER` | NULL (semestre sugerido 1-10) |
| `study_plan_id` | `BIGINT` | NOT NULL, FK → `study_plans(id)` |

**Unique constraint:** `uk_curriculum_subject_code_plan (codigo, study_plan_id)`

---

### 4.7 — `user_subject_progress`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `BIGSERIAL` | PK |
| `academic_progress_id` | `BIGINT` | NOT NULL, FK → `user_academic_progress(id)` |
| `curriculum_subject_id` | `BIGINT` | NOT NULL, FK → `curriculum_subjects(id)` |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT 'PENDIENTE' |
| `grade` | `DOUBLE PRECISION` | NULL |

**Unique constraint:** `uk_progress_subject (academic_progress_id, curriculum_subject_id)`

---

### 4.8 — `academic_offers`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `BIGSERIAL` | PK |
| `semester` | `VARCHAR(255)` | NOT NULL |
| `uploaded_at` | `TIMESTAMP` | NOT NULL |
| `uploaded_by` | `BIGINT` | NOT NULL |
| `active` | `BOOLEAN` | NOT NULL, DEFAULT false |

---

### 4.9 — `subjects`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `BIGSERIAL` | PK |
| `codigo` | `VARCHAR(255)` | NOT NULL |
| `nombre` | `VARCHAR(255)` | NOT NULL |
| `study_plan_id` | `BIGINT` | NOT NULL, FK → `study_plans(id)` |

---

### 4.10 — `subject_groups`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `BIGSERIAL` | PK |
| `grupo_code` | `VARCHAR(255)` | NOT NULL |
| `inscritos` | `INTEGER` | NOT NULL |
| `docente` | `VARCHAR(255)` | NOT NULL |
| `subject_id` | `BIGINT` | NOT NULL, FK → `subjects(id)` |
| `academic_offer_id` | `BIGINT` | NULL, FK → `academic_offers(id)` |

---

### 4.11 — `time_blocks`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `BIGSERIAL` | PK |
| `dia` | `VARCHAR(20)` | NOT NULL |
| `hora_inicio` | `INTEGER` | NOT NULL (0-23) |
| `hora_fin` | `INTEGER` | NOT NULL (0-23) |
| `ubicacion` | `VARCHAR(255)` | NOT NULL |
| `subject_group_id` | `BIGINT` | NOT NULL, FK → `subject_groups(id)` |

---

### 4.12 — `schedules`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `BIGSERIAL` | PK |
| `user_id` | `BIGINT` | NOT NULL |
| `name` | `VARCHAR(255)` | NOT NULL |
| `semester` | `VARCHAR(255)` | NOT NULL |
| `notes` | `VARCHAR(2000)` | NULL |
| `total_credits` | `INTEGER` | NOT NULL, DEFAULT 0 |
| `created_at` | `TIMESTAMP` | NOT NULL |
| `updated_at` | `TIMESTAMP` | NULL |
| `archived` | `BOOLEAN` | NOT NULL, DEFAULT false |

---

### 4.13 — `schedule_blocks`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `BIGSERIAL` | PK |
| `schedule_id` | `BIGINT` | NOT NULL, FK → `schedules(id)` |
| `group_id` | `BIGINT` | NULL |
| `subject_id` | `BIGINT` | NULL |
| `color` | `VARCHAR(255)` | NULL |
| `manual` | `BOOLEAN` | NOT NULL, DEFAULT false |
| `manual_label` | `VARCHAR(255)` | NULL |
| `manual_day` | `VARCHAR(20)` | NULL |
| `manual_start_time` | `TIME` | NULL |
| `manual_end_time` | `TIME` | NULL |

---

### 4.14 — `announcements`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `BIGSERIAL` | PK |
| `title` | `VARCHAR(255)` | NOT NULL |
| `body` | `VARCHAR(5000)` | NOT NULL |
| `scope` | `VARCHAR(20)` | NOT NULL |
| `type` | `VARCHAR(20)` | NOT NULL |
| `faculty` | `VARCHAR(255)` | NULL |
| `created_by` | `BIGINT` | NOT NULL |
| `created_at` | `TIMESTAMP` | NOT NULL |
| `updated_at` | `TIMESTAMP` | NULL |

---

### 4.15 — `calendar_events`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `BIGSERIAL` | PK |
| `title` | `VARCHAR(255)` | NOT NULL |
| `description` | `VARCHAR(255)` | NULL |
| `event_type` | `VARCHAR(20)` | NOT NULL |
| `start_date` | `DATE` | NOT NULL |
| `end_date` | `DATE` | NULL |
| `created_by` | `BIGINT` | NOT NULL |

---

### 4.16 — `welfare_contents`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `BIGSERIAL` | PK |
| `title` | `VARCHAR(255)` | NOT NULL |
| `description` | `VARCHAR(5000)` | NOT NULL |
| `category` | `VARCHAR(30)` | NOT NULL |
| `links` | `VARCHAR(255)` | NULL |
| `created_by` | `BIGINT` | NOT NULL |
| `created_at` | `TIMESTAMP` | NOT NULL |
| `updated_at` | `TIMESTAMP` | NULL |

---

### 4.17 — `campuses`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `BIGSERIAL` | PK |
| `name` | `VARCHAR(255)` | NOT NULL |
| `address` | `VARCHAR(255)` | NULL |
| `faculty` | `VARCHAR(255)` | NOT NULL |
| `latitude` | `DOUBLE PRECISION` | NULL |
| `longitude` | `DOUBLE PRECISION` | NULL |
| `map_url` | `VARCHAR(255)` | NULL |
| `updated_at` | `TIMESTAMP` | NULL |

---

### 4.18 — `classrooms`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `BIGSERIAL` | PK |
| `name` | `VARCHAR(255)` | NOT NULL |
| `building` | `VARCHAR(255)` | NULL |
| `floor` | `VARCHAR(255)` | NULL |
| `is_lab` | `BOOLEAN` | NOT NULL, DEFAULT false |
| `campus_id` | `BIGINT` | NOT NULL, FK → `campuses(id)` |

---

### 4.19 — `classroom_photos`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `BIGSERIAL` | PK |
| `photo_url` | `VARCHAR(255)` | NOT NULL |
| `uploaded_by` | `BIGINT` | NOT NULL |
| `uploaded_at` | `TIMESTAMP` | NOT NULL |
| `classroom_id` | `BIGINT` | NOT NULL, FK → `classrooms(id)` |

---

### 4.20 — `reports`

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| `id` | `BIGSERIAL` | PK |
| `user_id` | `BIGINT` | NOT NULL |
| `report_type` | `VARCHAR(30)` | NOT NULL |
| `description` | `VARCHAR(2000)` | NOT NULL |
| `evidence_url` | `VARCHAR(255)` | NULL |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT 'PENDIENTE' |
| `created_at` | `TIMESTAMP` | NOT NULL |
| `resolved_at` | `TIMESTAMP` | NULL |

---

## 5. Relaciones y Foreign Keys

| FK Name | Tabla Origen | Columna | Tabla Destino | Columna | ON DELETE |
|---------|-------------|---------|---------------|---------|-----------|
| `fk_role_user` | `user_roles` | `user_id` | `users` | `id` | CASCADE |
| `fk_progress_user` | `user_academic_progress` | `user_id` | `users` | `id` | CASCADE |
| `fk_progress_plan` | `user_academic_progress` | `study_plan_id` | `study_plans` | `id` | RESTRICT |
| `fk_subj_progress_academic` | `user_subject_progress` | `academic_progress_id` | `user_academic_progress` | `id` | CASCADE |
| `fk_subj_progress_curriculum` | `user_subject_progress` | `curriculum_subject_id` | `curriculum_subjects` | `id` | RESTRICT |
| `fk_subject_plan` | `subjects` | `study_plan_id` | `study_plans` | `id` | CASCADE |
| `fk_group_subject` | `subject_groups` | `subject_id` | `subjects` | `id` | CASCADE |
| `fk_group_offer` | `subject_groups` | `academic_offer_id` | `academic_offers` | `id` | SET NULL |
| `fk_timeblock_group` | `time_blocks` | `subject_group_id` | `subject_groups` | `id` | CASCADE |
| `fk_curriculum_plan` | `curriculum_subjects` | `study_plan_id` | `study_plans` | `id` | CASCADE |
| `fk_schedblock_sched` | `schedule_blocks` | `schedule_id` | `schedules` | `id` | CASCADE |
| `fk_classroom_campus` | `classrooms` | `campus_id` | `campuses` | `id` | CASCADE |
| `fk_photo_classroom` | `classroom_photos` | `classroom_id` | `classrooms` | `id` | CASCADE |

> **Nota sobre ON DELETE:**
> - `CASCADE` se usa donde la entidad padre tiene `orphanRemoval=true` o `cascade=ALL`.
> - `RESTRICT` se usa para evitar borrar datos referenciados (ej. no borrar un plan de estudio si hay progreso de alumnos).
> - `SET NULL` se usa donde la FK es nullable (ej. `academic_offer_id` en `subject_groups`).

---

## 6. Índices Recomendados

Derivados de las consultas en los repositorios:

```sql
-- Auth: búsqueda y limpieza de códigos de verificación
CREATE INDEX idx_verif_email_created ON verification_codes (email, created_at DESC);
CREATE INDEX idx_verif_expires ON verification_codes (expires_at);

-- Users: búsqueda por email (ya cubierto por UNIQUE, pero para LIKE queries)
CREATE INDEX idx_user_email_lower ON users (LOWER(email));

-- Roles: consulta por usuario
CREATE INDEX idx_role_user_id ON user_roles (user_id);

-- Academic Progress: consultas por usuario y plan
CREATE INDEX idx_acad_progress_user ON user_academic_progress (user_id);
CREATE INDEX idx_acad_progress_plan ON user_academic_progress (study_plan_id);

-- Subject Progress: consulta por progreso académico y estado
CREATE INDEX idx_subj_progress_academic ON user_subject_progress (academic_progress_id);
CREATE INDEX idx_subj_progress_curriculum ON user_subject_progress (curriculum_subject_id);
CREATE INDEX idx_subj_progress_status ON user_subject_progress (academic_progress_id, status);

-- Academic Offers: búsqueda de oferta activa
CREATE INDEX idx_offer_active ON academic_offers (active) WHERE active = true;

-- Study Plans: ordenamiento
CREATE INDEX idx_plan_faculty_name ON study_plans (facultad, nombre);

-- Subjects: búsqueda por plan
CREATE INDEX idx_subject_plan ON subjects (study_plan_id);
CREATE INDEX idx_subject_code_plan ON subjects (codigo, study_plan_id);

-- Subject Groups: búsqueda por materia y oferta
CREATE INDEX idx_group_subject ON subject_groups (subject_id);
CREATE INDEX idx_group_offer ON subject_groups (academic_offer_id);

-- Time Blocks: búsqueda por grupo y ordenamiento
CREATE INDEX idx_timeblock_group ON time_blocks (subject_group_id);
CREATE INDEX idx_timeblock_day_hour ON time_blocks (dia, hora_inicio);

-- Curriculum Subjects: búsqueda por plan
CREATE INDEX idx_curriculum_plan ON curriculum_subjects (study_plan_id);

-- Schedules: búsqueda por usuario
CREATE INDEX idx_schedule_user ON schedules (user_id, created_at DESC);

-- Schedule Blocks: búsqueda por horario
CREATE INDEX idx_schedblock_schedule ON schedule_blocks (schedule_id);

-- Announcements: filtrado y ordenamiento
CREATE INDEX idx_announce_scope_type ON announcements (scope, type);
CREATE INDEX idx_announce_created ON announcements (created_at DESC);
CREATE INDEX idx_announce_faculty ON announcements (faculty);

-- Calendar Events: filtrado por fecha
CREATE INDEX idx_calendar_start ON calendar_events (start_date);
CREATE INDEX idx_calendar_type ON calendar_events (event_type);

-- Welfare: filtrado por categoría
CREATE INDEX idx_welfare_category ON welfare_contents (category, created_at DESC);

-- Campuses: filtrado por facultad
CREATE INDEX idx_campus_faculty ON campuses (faculty);

-- Classrooms: búsqueda por campus
CREATE INDEX idx_classroom_campus ON classrooms (campus_id);

-- Classroom Photos: búsqueda por salón
CREATE INDEX idx_photo_classroom ON classroom_photos (classroom_id);

-- Reports: filtrado
CREATE INDEX idx_report_user ON reports (user_id, created_at DESC);
CREATE INDEX idx_report_status_type ON reports (status, report_type);
```

---

## 7. Queries Derivados de Repositorios

### 7.1 — VerificationCodeRepository
| Método | Query Generado |
|--------|---------------|
| `findTopByEmailOrderByCreatedAtDesc(email)` | `SELECT * FROM verification_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1` |
| `deleteByExpiresAtBefore(threshold)` | `DELETE FROM verification_codes WHERE expires_at < ?` |
| `existsByEmailAndUsedFalseAndExpiresAtAfter(email, now)` | `SELECT EXISTS(SELECT 1 FROM verification_codes WHERE email = ? AND used = false AND expires_at > ?)` |

### 7.2 — UserRepository
| Método | Query Generado |
|--------|---------------|
| `findByEmail(email)` | `SELECT * FROM users WHERE email = ?` |
| `existsByEmail(email)` | `SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)` |
| `existsByNickname(nickname)` | `SELECT EXISTS(SELECT 1 FROM users WHERE nickname = ?)` |
| `findByEmailContainingIgnoreCase(email, pageable)` | `SELECT * FROM users WHERE LOWER(email) LIKE LOWER('%' \|\| ? \|\| '%') LIMIT ? OFFSET ?` |

### 7.3 — RoleRepository
| Método | Query Generado |
|--------|---------------|
| `findByUserId(userId)` | `SELECT * FROM user_roles WHERE user_id = ?` |
| `existsByUserIdAndRoleName(userId, roleName)` | `SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = ? AND role_name = ?)` |
| `countByUserId(userId)` | `SELECT COUNT(*) FROM user_roles WHERE user_id = ?` |

### 7.4 — AcademicOfferRepository
| Método | Query Generado |
|--------|---------------|
| `findByActiveTrue()` | `SELECT * FROM academic_offers WHERE active = true` |
| `deactivateAll()` | `UPDATE academic_offers SET active = false` |

### 7.5 — StudyPlanRepository
| Método | Query Generado |
|--------|---------------|
| `findByCodigoPlan(codigoPlan)` | `SELECT * FROM study_plans WHERE codigo_plan = ?` |
| `existsByCodigoPlan(codigoPlan)` | `SELECT EXISTS(SELECT 1 FROM study_plans WHERE codigo_plan = ?)` |
| `findAllOrderedByFacultyAndName()` | `SELECT * FROM study_plans ORDER BY facultad ASC, nombre ASC` |

### 7.6 — SubjectRepository
| Método | Query Generado |
|--------|---------------|
| `findByStudyPlanId(studyPlanId)` | `SELECT * FROM subjects WHERE study_plan_id = ?` |
| `findByCodigoAndStudyPlanId(codigo, studyPlanId)` | `SELECT * FROM subjects WHERE codigo = ? AND study_plan_id = ?` |
| `findByOfferIdAndOptionalStudyPlan(offerId, studyPlanId)` | `SELECT DISTINCT s.* FROM subjects s JOIN subject_groups g ON g.subject_id = s.id WHERE g.academic_offer_id = ? AND (? IS NULL OR s.study_plan_id = ?) ORDER BY s.nombre` |

### 7.7 — SubjectGroupRepository
| Método | Query Generado |
|--------|---------------|
| `findBySubjectId(subjectId)` | `SELECT * FROM subject_groups WHERE subject_id = ?` |
| `findByAcademicOfferId(offerId)` | `SELECT * FROM subject_groups WHERE academic_offer_id = ?` |
| `findTimeBlocksByGroupIds(groupIds)` | `SELECT * FROM time_blocks WHERE subject_group_id IN (?) ORDER BY dia, hora_inicio` |

### 7.8 — TimeBlockRepository
| Método | Query Generado |
|--------|---------------|
| `findBySubjectGroupId(subjectGroupId)` | `SELECT * FROM time_blocks WHERE subject_group_id = ?` |
| `deleteByAcademicOfferId(offerId)` | `DELETE FROM time_blocks WHERE subject_group_id IN (SELECT id FROM subject_groups WHERE academic_offer_id = ?)` |

### 7.9 — CurriculumSubjectRepository
| Método | Query Generado |
|--------|---------------|
| `findByStudyPlanId(studyPlanId)` | `SELECT * FROM curriculum_subjects WHERE study_plan_id = ?` |
| `existsByCodigoAndStudyPlanId(codigo, studyPlanId)` | `SELECT EXISTS(SELECT 1 FROM curriculum_subjects WHERE codigo = ? AND study_plan_id = ?)` |
| `findByIdAndStudyPlanId(id, studyPlanId)` | `SELECT * FROM curriculum_subjects WHERE id = ? AND study_plan_id = ?` |
| `sumCreditsByStudyPlanId(planId)` | `SELECT COALESCE(SUM(credits), 0) FROM curriculum_subjects WHERE study_plan_id = ?` |

### 7.10 — ScheduleRepository
| Método | Query Generado |
|--------|---------------|
| `findByUserIdOrderByCreatedAtDesc(userId)` | `SELECT * FROM schedules WHERE user_id = ? ORDER BY created_at DESC` |
| `findByIdAndUserId(id, userId)` | `SELECT * FROM schedules WHERE id = ? AND user_id = ?` |
| `findByIdAndUserIdWithBlocks(id, userId)` | `SELECT s.*, sb.* FROM schedules s LEFT JOIN schedule_blocks sb ON sb.schedule_id = s.id WHERE s.id = ? AND s.user_id = ?` |

### 7.11 — ScheduleBlockRepository
| Método | Query Generado |
|--------|---------------|
| `findByScheduleId(scheduleId)` | `SELECT * FROM schedule_blocks WHERE schedule_id = ?` |
| `deleteByScheduleId(scheduleId)` | `DELETE FROM schedule_blocks WHERE schedule_id = ?` |

### 7.12 — UserAcademicProgressRepository
| Método | Query Generado |
|--------|---------------|
| `findByUserId(userId)` | `SELECT * FROM user_academic_progress WHERE user_id = ?` |
| `existsByUserIdAndStudyPlanId(userId, studyPlanId)` | `SELECT EXISTS(SELECT 1 FROM user_academic_progress WHERE user_id = ? AND study_plan_id = ?)` |
| `findByIdAndUserId(id, userId)` | `SELECT * FROM user_academic_progress WHERE id = ? AND user_id = ?` |

### 7.13 — UserSubjectProgressRepository
| Método | Query Generado |
|--------|---------------|
| `findByAcademicProgressId(progressId)` | `SELECT * FROM user_subject_progress WHERE academic_progress_id = ?` |
| `findByAcademicProgressIdAndCurriculumSubjectId(progressId, subjectId)` | `SELECT * FROM user_subject_progress WHERE academic_progress_id = ? AND curriculum_subject_id = ?` |
| `findByIdAndAcademicProgressId(id, progressId)` | `SELECT * FROM user_subject_progress WHERE id = ? AND academic_progress_id = ?` |
| `sumCreditsByProgressIdAndStatus(progressId, status)` | `SELECT COALESCE(SUM(cs.credits), 0) FROM user_subject_progress usp JOIN curriculum_subjects cs ON cs.id = usp.curriculum_subject_id WHERE usp.academic_progress_id = ? AND usp.status = ?` |
| `existsByCurriculumSubjectId(subjectId)` | `SELECT EXISTS(SELECT 1 FROM user_subject_progress WHERE curriculum_subject_id = ?)` |

### 7.14 — AnnouncementRepository
| Método | Query Generado |
|--------|---------------|
| `findFiltered(scope, type, faculty)` | `SELECT * FROM announcements WHERE (? IS NULL OR scope = ?) AND (? IS NULL OR type = ?) AND (? IS NULL OR faculty = ?) ORDER BY created_at DESC` |

### 7.15 — CalendarEventRepository
| Método | Query Generado |
|--------|---------------|
| `findFiltered(from, to, eventType)` | `SELECT * FROM calendar_events WHERE (? IS NULL OR start_date >= ?) AND (? IS NULL OR start_date <= ?) AND (? IS NULL OR event_type = ?) ORDER BY start_date ASC` |

### 7.16 — WelfareContentRepository
| Método | Query Generado |
|--------|---------------|
| `findByCategoryOrderByCreatedAtDesc(category)` | `SELECT * FROM welfare_contents WHERE category = ? ORDER BY created_at DESC` |
| `findAllByOrderByCreatedAtDesc()` | `SELECT * FROM welfare_contents ORDER BY created_at DESC` |

### 7.17 — CampusRepository
| Método | Query Generado |
|--------|---------------|
| `findByFacultyOrderByNameAsc(faculty)` | `SELECT * FROM campuses WHERE faculty = ? ORDER BY name ASC` |
| `findAllByOrderByFacultyAscNameAsc()` | `SELECT * FROM campuses ORDER BY faculty ASC, name ASC` |

### 7.18 — ClassroomRepository
| Método | Query Generado |
|--------|---------------|
| `findByCampusId(campusId)` | `SELECT * FROM classrooms WHERE campus_id = ?` |
| `findByIdAndCampusId(id, campusId)` | `SELECT * FROM classrooms WHERE id = ? AND campus_id = ?` |
| `existsByCampusId(campusId)` | `SELECT EXISTS(SELECT 1 FROM classrooms WHERE campus_id = ?)` |

### 7.19 — ClassroomPhotoRepository
| Método | Query Generado |
|--------|---------------|
| `findByClassroomId(classroomId)` | `SELECT * FROM classroom_photos WHERE classroom_id = ?` |
| `findByIdAndClassroomId(id, classroomId)` | `SELECT * FROM classroom_photos WHERE id = ? AND classroom_id = ?` |

### 7.20 — ReportRepository
| Método | Query Generado |
|--------|---------------|
| `findByUserIdOrderByCreatedAtDesc(userId)` | `SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC` |
| `findFiltered(status, reportType)` | `SELECT * FROM reports WHERE (? IS NULL OR status = ?) AND (? IS NULL OR report_type = ?) ORDER BY created_at DESC` |

---

## 8. Script SQL Completo

```sql
-- ============================================================================
-- NEXO Backend — Script de Creación de Base de Datos PostgreSQL
-- Generado desde entidades JPA y repositorios Spring Data
-- ============================================================================

-- ============================================================================
-- 1. TABLAS INDEPENDIENTES
-- ============================================================================

-- Códigos de verificación por email
CREATE TABLE verification_codes (
    id              BIGSERIAL       PRIMARY KEY,
    email           VARCHAR(255)    NOT NULL,
    code            VARCHAR(6)      NOT NULL,
    created_at      TIMESTAMP       NOT NULL,
    expires_at      TIMESTAMP       NOT NULL,
    used            BOOLEAN         NOT NULL DEFAULT false,
    attempts        INTEGER         NOT NULL DEFAULT 0
);

-- Usuarios
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

-- Planes de estudio (carreras)
CREATE TABLE study_plans (
    id              BIGSERIAL       PRIMARY KEY,
    codigo_plan     VARCHAR(255)    NOT NULL,
    nombre          VARCHAR(255)    NOT NULL,
    facultad        VARCHAR(255)    NOT NULL,
    CONSTRAINT uq_plan_codigo   UNIQUE (codigo_plan)
);

-- Ofertas académicas (semestres)
CREATE TABLE academic_offers (
    id              BIGSERIAL       PRIMARY KEY,
    semester        VARCHAR(255)    NOT NULL,
    uploaded_at     TIMESTAMP       NOT NULL,
    uploaded_by     BIGINT          NOT NULL,
    active          BOOLEAN         NOT NULL DEFAULT false
);

-- ============================================================================
-- 2. TABLAS DEPENDIENTES — NIVEL 1
-- ============================================================================

-- Roles de usuario
CREATE TABLE user_roles (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    role_name       VARCHAR(50)     NOT NULL,
    assigned_at     TIMESTAMP       NOT NULL,
    assigned_by     BIGINT,
    CONSTRAINT fk_role_user     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_role     UNIQUE (user_id, role_name),
    CONSTRAINT chk_role_name    CHECK (role_name IN ('ADMINISTRADOR', 'ESTUDIANTE', 'RADICADOR_AVISOS', 'RADICADOR_BIENESTAR', 'RADICADOR_SEDES'))
);

-- Progreso académico del usuario (inscripción en un plan de estudio)
CREATE TABLE user_academic_progress (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    study_plan_id   BIGINT          NOT NULL,
    enrolled_at     TIMESTAMP       NOT NULL,
    CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_progress_plan FOREIGN KEY (study_plan_id) REFERENCES study_plans(id) ON DELETE RESTRICT,
    CONSTRAINT uk_user_study_plan UNIQUE (user_id, study_plan_id)
);

-- Materias del plan de estudio (malla curricular)
CREATE TABLE curriculum_subjects (
    id              BIGSERIAL       PRIMARY KEY,
    codigo          VARCHAR(255)    NOT NULL,
    nombre          VARCHAR(255)    NOT NULL,
    credits         INTEGER         NOT NULL,
    semester        INTEGER,
    study_plan_id   BIGINT          NOT NULL,
    CONSTRAINT fk_curriculum_plan FOREIGN KEY (study_plan_id) REFERENCES study_plans(id) ON DELETE CASCADE,
    CONSTRAINT uk_curriculum_subject_code_plan UNIQUE (codigo, study_plan_id)
);

-- Materias de la oferta académica
CREATE TABLE subjects (
    id              BIGSERIAL       PRIMARY KEY,
    codigo          VARCHAR(255)    NOT NULL,
    nombre          VARCHAR(255)    NOT NULL,
    study_plan_id   BIGINT          NOT NULL,
    CONSTRAINT fk_subject_plan  FOREIGN KEY (study_plan_id) REFERENCES study_plans(id) ON DELETE CASCADE
);

-- Horarios de usuario
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

-- Sedes universitarias
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

-- Avisos
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
    CONSTRAINT chk_announce_type  CHECK (type IN ('GENERAL', 'ASAMBLEA'))
);

-- Eventos de calendario
CREATE TABLE calendar_events (
    id              BIGSERIAL       PRIMARY KEY,
    title           VARCHAR(255)    NOT NULL,
    description     VARCHAR(255),
    event_type      VARCHAR(20)     NOT NULL,
    start_date      DATE            NOT NULL,
    end_date        DATE,
    created_by      BIGINT          NOT NULL,
    CONSTRAINT chk_event_type   CHECK (event_type IN ('FESTIVO', 'PARO', 'INSCRIPCIONES', 'OTRO'))
);

-- Contenido de bienestar
CREATE TABLE welfare_contents (
    id              BIGSERIAL       PRIMARY KEY,
    title           VARCHAR(255)    NOT NULL,
    description     VARCHAR(5000)   NOT NULL,
    category        VARCHAR(30)     NOT NULL,
    links           VARCHAR(255),
    created_by      BIGINT          NOT NULL,
    created_at      TIMESTAMP       NOT NULL,
    updated_at      TIMESTAMP,
    CONSTRAINT chk_welfare_cat  CHECK (category IN ('APOYO_ALIMENTARIO', 'BECAS', 'SALUD_MENTAL', 'SERVICIOS_SALUD'))
);

-- Reportes
CREATE TABLE reports (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    report_type     VARCHAR(30)     NOT NULL,
    description     VARCHAR(2000)   NOT NULL,
    evidence_url    VARCHAR(255),
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDIENTE',
    created_at      TIMESTAMP       NOT NULL,
    resolved_at     TIMESTAMP,
    CONSTRAINT chk_report_type  CHECK (report_type IN ('ERROR_HORARIO', 'CAMBIO_SALON', 'INFORMACION_INCORRECTA', 'OTRO')),
    CONSTRAINT chk_report_status CHECK (status IN ('PENDIENTE', 'EN_REVISION', 'RESUELTO', 'DESCARTADO'))
);

-- ============================================================================
-- 3. TABLAS DEPENDIENTES — NIVEL 2
-- ============================================================================

-- Progreso de materia del usuario
CREATE TABLE user_subject_progress (
    id                      BIGSERIAL       PRIMARY KEY,
    academic_progress_id    BIGINT          NOT NULL,
    curriculum_subject_id   BIGINT          NOT NULL,
    status                  VARCHAR(20)     NOT NULL DEFAULT 'PENDIENTE',
    grade                   DOUBLE PRECISION,
    CONSTRAINT fk_subj_progress_academic  FOREIGN KEY (academic_progress_id)  REFERENCES user_academic_progress(id) ON DELETE CASCADE,
    CONSTRAINT fk_subj_progress_curriculum FOREIGN KEY (curriculum_subject_id) REFERENCES curriculum_subjects(id)    ON DELETE RESTRICT,
    CONSTRAINT uk_progress_subject         UNIQUE (academic_progress_id, curriculum_subject_id),
    CONSTRAINT chk_subj_status             CHECK (status IN ('PENDIENTE', 'CURSANDO', 'APROBADA'))
);

-- Grupos de materias
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

-- Bloques de horario de usuario
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

-- Salones de clase
CREATE TABLE classrooms (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(255)    NOT NULL,
    building        VARCHAR(255),
    floor           VARCHAR(255),
    is_lab          BOOLEAN         NOT NULL DEFAULT false,
    campus_id       BIGINT          NOT NULL,
    CONSTRAINT fk_classroom_campus FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE CASCADE
);

-- ============================================================================
-- 4. TABLAS DEPENDIENTES — NIVEL 3
-- ============================================================================

-- Bloques de tiempo (horarios de grupos)
CREATE TABLE time_blocks (
    id                  BIGSERIAL       PRIMARY KEY,
    dia                 VARCHAR(20)     NOT NULL,
    hora_inicio         INTEGER         NOT NULL,
    hora_fin            INTEGER         NOT NULL,
    ubicacion           VARCHAR(255)    NOT NULL,
    subject_group_id    BIGINT          NOT NULL,
    CONSTRAINT fk_timeblock_group FOREIGN KEY (subject_group_id) REFERENCES subject_groups(id) ON DELETE CASCADE,
    CONSTRAINT chk_dia           CHECK (dia IN ('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO')),
    CONSTRAINT chk_hora_inicio   CHECK (hora_inicio >= 0 AND hora_inicio <= 23),
    CONSTRAINT chk_hora_fin      CHECK (hora_fin >= 0 AND hora_fin <= 23)
);

-- Fotos de salones
CREATE TABLE classroom_photos (
    id              BIGSERIAL       PRIMARY KEY,
    photo_url       VARCHAR(255)    NOT NULL,
    uploaded_by     BIGINT          NOT NULL,
    uploaded_at     TIMESTAMP       NOT NULL,
    classroom_id    BIGINT          NOT NULL,
    CONSTRAINT fk_photo_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
);

-- ============================================================================
-- 5. ÍNDICES
-- ============================================================================

-- Auth
CREATE INDEX idx_verif_email_created    ON verification_codes (email, created_at DESC);
CREATE INDEX idx_verif_expires          ON verification_codes (expires_at);

-- Users
CREATE INDEX idx_user_email_lower       ON users (LOWER(email));

-- Roles
CREATE INDEX idx_role_user_id           ON user_roles (user_id);

-- Academic Progress
CREATE INDEX idx_acad_progress_user     ON user_academic_progress (user_id);
CREATE INDEX idx_acad_progress_plan     ON user_academic_progress (study_plan_id);

-- Subject Progress
CREATE INDEX idx_subj_progress_academic ON user_subject_progress (academic_progress_id);
CREATE INDEX idx_subj_progress_curriculum ON user_subject_progress (curriculum_subject_id);
CREATE INDEX idx_subj_progress_status   ON user_subject_progress (academic_progress_id, status);

-- Academic Offers
CREATE INDEX idx_offer_active           ON academic_offers (active) WHERE active = true;

-- Study Plans
CREATE INDEX idx_plan_faculty_name      ON study_plans (facultad, nombre);

-- Subjects
CREATE INDEX idx_subject_plan           ON subjects (study_plan_id);
CREATE INDEX idx_subject_code_plan      ON subjects (codigo, study_plan_id);

-- Subject Groups
CREATE INDEX idx_group_subject          ON subject_groups (subject_id);
CREATE INDEX idx_group_offer            ON subject_groups (academic_offer_id);

-- Time Blocks
CREATE INDEX idx_timeblock_group        ON time_blocks (subject_group_id);
CREATE INDEX idx_timeblock_day_hour     ON time_blocks (dia, hora_inicio);

-- Curriculum Subjects
CREATE INDEX idx_curriculum_plan        ON curriculum_subjects (study_plan_id);

-- Schedules
CREATE INDEX idx_schedule_user          ON schedules (user_id, created_at DESC);

-- Schedule Blocks
CREATE INDEX idx_schedblock_schedule    ON schedule_blocks (schedule_id);

-- Announcements
CREATE INDEX idx_announce_scope_type    ON announcements (scope, type);
CREATE INDEX idx_announce_created       ON announcements (created_at DESC);
CREATE INDEX idx_announce_faculty       ON announcements (faculty);

-- Calendar Events
CREATE INDEX idx_calendar_start         ON calendar_events (start_date);
CREATE INDEX idx_calendar_type          ON calendar_events (event_type);

-- Welfare
CREATE INDEX idx_welfare_category       ON welfare_contents (category, created_at DESC);

-- Campuses
CREATE INDEX idx_campus_faculty         ON campuses (faculty);

-- Classrooms
CREATE INDEX idx_classroom_campus       ON classrooms (campus_id);

-- Classroom Photos
CREATE INDEX idx_photo_classroom        ON classroom_photos (classroom_id);

-- Reports
CREATE INDEX idx_report_user            ON reports (user_id, created_at DESC);
CREATE INDEX idx_report_status_type     ON reports (status, report_type);

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
```

---

## Notas Adicionales

### Estrategia de Generación de IDs
Todas las entidades usan `BIGSERIAL` (equivalente a `GenerationType.IDENTITY` de JPA), lo que permite a PostgreSQL generar secuencias automáticas.

### Campos de Auditoría
Las siguientes tablas tienen campos `created_at`/`updated_at` gestionados por JPA con `@PrePersist` y `@PreUpdate`:
- `users`, `schedules`, `announcements`, `welfare_contents` → ambos campos
- `verification_codes`, `academic_offers`, `user_academic_progress`, `classroom_photos`, `reports` → solo `created_at`
- `campuses` → solo `updated_at`

### Campos de Referencia sin FK Explícita
Algunos campos referencian `users.id` pero no tienen FK declarada en la entidad JPA:
- `academic_offers.uploaded_by`
- `schedules.user_id`
- `announcements.created_by`
- `calendar_events.created_by`
- `welfare_contents.created_by`
- `classroom_photos.uploaded_by`
- `reports.user_id`
- `user_roles.assigned_by`
- `schedule_blocks.group_id` → referencia a `subject_groups.id`
- `schedule_blocks.subject_id` → referencia a `subjects.id`

Estos se mantienen como `BIGINT` sin FK para respetar el diseño de las entidades, pero se podrían agregar FKs opcionales si se desea mayor integridad referencial.

### Hibernate DDL Auto
Si se usa `spring.jpa.hibernate.ddl-auto=create` o `update`, Hibernate generará las tablas automáticamente. Este script es para creación manual o migración con Flyway/Liquibase.
