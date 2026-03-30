# Entidades del Backend — NexoUD

Paquete base: `com.kumorai.nexo`
Tecnologías: Spring Boot · Jakarta Persistence (JPA) · Lombok · Hibernate

---

## Índice de módulos

- [auth](#-módulo-auth)
- [user](#-módulo-user)
- [academic](#-módulo-academic)
- [schedule](#-módulo-schedule)
- [campus](#-módulo-campus)
- [content](#-módulo-content)
- [report](#-módulo-report)

---

## 🔐 Módulo `auth`

### `VerificationCode`
**Tabla:** `verification_codes`
**Ruta:** `auth/entity/VerificationCode.java`
**Propósito:** Código de verificación de 6 dígitos enviado por email para confirmar acciones (registro, recuperación de contraseña).

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `email` | `String` | NOT NULL |
| `code` | `String` | NOT NULL, max 6 chars |
| `createdAt` | `LocalDateTime` | NOT NULL |
| `expiresAt` | `LocalDateTime` | NOT NULL |
| `used` | `boolean` | NOT NULL, default `false` |
| `attempts` | `int` | NOT NULL, default `0` |

---

## 👤 Módulo `user`

### `User`
**Tabla:** `users`
**Ruta:** `user/entity/User.java`
**Propósito:** Representa a los usuarios registrados en el sistema.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `email` | `String` | NOT NULL, UNIQUE |
| `nickname` | `String` | NOT NULL, UNIQUE |
| `passwordHash` | `String` | NOT NULL |
| `active` | `boolean` | NOT NULL, default `true` |
| `createdAt` | `LocalDateTime` | NOT NULL, no actualizable |
| `updatedAt` | `LocalDateTime` | nullable |
| `roles` | `List<Role>` | OneToMany → `Role` |
| `academicProgressList` | `List<UserAcademicProgress>` | OneToMany → `UserAcademicProgress` |

---

### `Role`
**Tabla:** `user_roles`
**Ruta:** `user/entity/Role.java`
**Propósito:** Rol asignado a un usuario. Constraint único por `(user_id, role_name)`.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `roleName` | `RoleName` (enum) | NOT NULL |
| `assignedAt` | `LocalDateTime` | NOT NULL, no actualizable |
| `assignedBy` | `Long` | nullable (ID del admin que asignó) |
| `user` | `User` | ManyToOne → `users` |

**Enum `RoleName`:** `ADMINISTRADOR`, `ESTUDIANTE`, `RADICADOR_AVISOS`, `RADICADOR_BIENESTAR`, `RADICADOR_SEDES`

---

### `UserAcademicProgress`
**Tabla:** `user_academic_progress`
**Ruta:** `user/entity/UserAcademicProgress.java`
**Propósito:** Registro de la carrera seleccionada por un usuario y su avance académico. Soporta doble titulación (un usuario puede tener varios registros). Constraint único por `(user_id, study_plan_id)`.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `user` | `User` | ManyToOne → `users`, NOT NULL |
| `studyPlan` | `StudyPlan` | ManyToOne → `study_plans`, NOT NULL |
| `enrolledAt` | `LocalDateTime` | NOT NULL, no actualizable, auto-asignado |
| `subjectProgressList` | `List<UserSubjectProgress>` | OneToMany → `UserSubjectProgress`, cascade+orphan |

---

### `UserSubjectProgress`
**Tabla:** `user_subject_progress`
**Ruta:** `user/entity/UserSubjectProgress.java`
**Propósito:** Estado de una materia específica dentro del avance académico de un usuario. Constraint único por `(academic_progress_id, curriculum_subject_id)`.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `academicProgress` | `UserAcademicProgress` | ManyToOne → `user_academic_progress`, NOT NULL |
| `curriculumSubject` | `CurriculumSubject` | ManyToOne → `curriculum_subjects`, NOT NULL |
| `status` | `SubjectStatus` (enum) | NOT NULL, default `PENDIENTE` |
| `grade` | `Double` | nullable (se llena al aprobar) |

**Enum `SubjectStatus`:** `PENDIENTE`, `CURSANDO`, `APROBADA`

---

## 📚 Módulo `academic`

### `StudyPlan`
**Tabla:** `study_plans`
**Ruta:** `academic/entity/StudyPlan.java`
**Propósito:** Catálogo global de una carrera universitaria. Punto de entrada para el extractor de horarios y para el plan de estudios con créditos.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `codigoPlan` | `String` | NOT NULL, UNIQUE (código numérico de carrera del PDF) |
| `nombre` | `String` | NOT NULL (nombre completo de la carrera) |
| `facultad` | `String` | NOT NULL |
| `subjects` | `List<Subject>` | OneToMany → `Subject` (materias de horarios) |
| `curriculumSubjects` | `List<CurriculumSubject>` | OneToMany → `CurriculumSubject` (malla curricular) |

---

### `CurriculumSubject`
**Tabla:** `curriculum_subjects`
**Ruta:** `academic/entity/CurriculumSubject.java`
**Propósito:** Materia perteneciente al catálogo oficial del plan de estudios, con créditos académicos. Independiente de `Subject` (horarios). Usada para el seguimiento de avance académico. Constraint único por `(codigo, study_plan_id)`.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `codigo` | `String` | NOT NULL |
| `nombre` | `String` | NOT NULL |
| `credits` | `int` | NOT NULL |
| `semester` | `Integer` | nullable (semestre sugerido en la malla, 1-10) |
| `studyPlan` | `StudyPlan` | ManyToOne → `study_plans`, NOT NULL |

---

### `Subject`
**Tabla:** `subjects`
**Ruta:** `academic/entity/Subject.java`
**Propósito:** Materia creada a partir del extractor de PDFs de horarios. Ligada al sistema de visualización de horarios académicos.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `codigo` | `String` | NOT NULL (código del PDF) |
| `nombre` | `String` | NOT NULL |
| `studyPlan` | `StudyPlan` | ManyToOne → `study_plans`, NOT NULL |
| `grupos` | `List<SubjectGroup>` | OneToMany → `SubjectGroup` |
| `prerequisites` | `List<Prerequisite>` | OneToMany → `Prerequisite` |

---

### `SubjectGroup`
**Tabla:** `subject_groups`
**Ruta:** `academic/entity/SubjectGroup.java`
**Propósito:** Grupo de una materia tal como aparece en el PDF de horarios (ej: `"020-81"`).

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `grupoCode` | `String` | NOT NULL (ej: `"020-81"`, `"IMPL-1"`) |
| `inscritos` | `int` | NOT NULL |
| `docente` | `String` | NOT NULL (`"POR ASIGNAR"` si no está definido) |
| `subject` | `Subject` | ManyToOne → `subjects`, NOT NULL |
| `academicOffer` | `AcademicOffer` | ManyToOne → `academic_offers`, nullable |
| `horarios` | `List<TimeBlock>` | OneToMany → `TimeBlock` |

---

### `TimeBlock`
**Tabla:** `time_blocks`
**Ruta:** `academic/entity/TimeBlock.java`
**Propósito:** Bloque horario individual de un grupo (día + hora de inicio/fin + ubicación), extraído del PDF.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `dia` | `DayOfWeek` (enum) | NOT NULL |
| `horaInicio` | `int` | NOT NULL (hora entera 24h, ej: `6`, `14`) |
| `horaFin` | `int` | NOT NULL |
| `ubicacion` | `String` | NOT NULL (texto libre del PDF; `"POR ASIGNAR"` si no hay) |
| `subjectGroup` | `SubjectGroup` | ManyToOne → `subject_groups`, NOT NULL |

**Enum `DayOfWeek`:** `LUNES`, `MARTES`, `MIERCOLES`, `JUEVES`, `VIERNES`, `SABADO`, `DOMINGO`

---

### `AcademicOffer`
**Tabla:** `academic_offers`
**Ruta:** `academic/entity/AcademicOffer.java`
**Propósito:** Representa una oferta académica cargada al sistema (un PDF procesado de un semestre). Permite activar/desactivar la oferta vigente.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `semester` | `String` | NOT NULL (ej: `"2026-1"`) |
| `uploadedAt` | `LocalDateTime` | NOT NULL, no actualizable, auto-asignado |
| `uploadedBy` | `Long` | NOT NULL (ID del usuario que subió) |
| `active` | `boolean` | NOT NULL, default `false` |

---

### `Prerequisite`
**Tabla:** `prerequisites`
**Ruta:** `academic/entity/Prerequisite.java`
**Propósito:** Prerequisito de una materia respecto a otra.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `prerequisiteSubjectId` | `Long` | NOT NULL (ID de la materia requerida) |
| `subject` | `Subject` | ManyToOne → `subjects`, NOT NULL |

**Enum `ElectiveType`** *(referenciado en versiones anteriores de `Subject`)*: `INTRINSECA`, `EXTRINSECA`, `NINGUNA`

---

## 🗓️ Módulo `schedule`

### `Schedule`
**Tabla:** `schedules`
**Ruta:** `schedule/entity/Schedule.java`
**Propósito:** Horario armado por un estudiante para un semestre específico.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `userId` | `Long` | NOT NULL |
| `name` | `String` | NOT NULL |
| `semester` | `String` | NOT NULL |
| `notes` | `String` | nullable, max 2000 chars |
| `totalCredits` | `int` | NOT NULL, default `0` |
| `createdAt` | `LocalDateTime` | NOT NULL, no actualizable, auto-asignado |
| `updatedAt` | `LocalDateTime` | nullable, auto-actualizado |
| `archived` | `boolean` | NOT NULL, default `false` |
| `blocks` | `List<ScheduleBlock>` | OneToMany → `ScheduleBlock` |

---

### `ScheduleBlock`
**Tabla:** `schedule_blocks`
**Ruta:** `schedule/entity/ScheduleBlock.java`
**Propósito:** Bloque dentro de un horario armado. Puede referenciar un grupo existente o ser un bloque manual del usuario.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `groupId` | `Long` | nullable (referencia a `SubjectGroup`) |
| `subjectId` | `Long` | nullable (referencia a `Subject`) |
| `color` | `String` | nullable |
| `manual` | `boolean` | NOT NULL, default `false` |
| `manualLabel` | `String` | nullable (nombre del bloque manual) |
| `manualDay` | `DayOfWeek` (enum) | nullable |
| `manualStartTime` | `LocalTime` | nullable |
| `manualEndTime` | `LocalTime` | nullable |
| `schedule` | `Schedule` | ManyToOne → `schedules`, NOT NULL |

---

## 🏛️ Módulo `campus`

### `Campus`
**Tabla:** `campuses`
**Ruta:** `campus/entity/Campus.java`
**Propósito:** Sede o campus universitario con información de ubicación.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `name` | `String` | NOT NULL |
| `address` | `String` | nullable |
| `faculty` | `String` | NOT NULL |
| `latitude` | `Double` | nullable |
| `longitude` | `Double` | nullable |
| `mapUrl` | `String` | nullable |
| `updatedAt` | `LocalDateTime` | nullable, auto-actualizado |
| `classrooms` | `List<Classroom>` | OneToMany → `Classroom` |

---

### `Classroom`
**Tabla:** `classrooms`
**Ruta:** `campus/entity/Classroom.java`
**Propósito:** Aula o laboratorio dentro de una sede.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `name` | `String` | NOT NULL |
| `building` | `String` | nullable |
| `floor` | `String` | nullable |
| `isLab` | `boolean` | NOT NULL, default `false` |
| `campus` | `Campus` | ManyToOne → `campuses`, NOT NULL |
| `photos` | `List<ClassroomPhoto>` | OneToMany → `ClassroomPhoto` |

---

### `ClassroomPhoto`
**Tabla:** `classroom_photos`
**Ruta:** `campus/entity/ClassroomPhoto.java`
**Propósito:** Foto de un aula subida por un usuario autorizado.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `photoUrl` | `String` | NOT NULL |
| `uploadedBy` | `Long` | NOT NULL (ID del usuario) |
| `uploadedAt` | `LocalDateTime` | NOT NULL, no actualizable, auto-asignado |
| `classroom` | `Classroom` | ManyToOne → `classrooms`, NOT NULL |

---

## 📢 Módulo `content`

### `Announcement`
**Tabla:** `announcements`
**Ruta:** `content/entity/Announcement.java`
**Propósito:** Aviso o comunicado institucional publicado en la plataforma.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `title` | `String` | NOT NULL |
| `body` | `String` | NOT NULL, max 5000 chars |
| `scope` | `AnnouncementScope` (enum) | NOT NULL |
| `type` | `AnnouncementType` (enum) | NOT NULL |
| `faculty` | `String` | nullable (si scope es FACULTAD) |
| `createdBy` | `Long` | NOT NULL (ID del usuario) |
| `createdAt` | `LocalDateTime` | NOT NULL, no actualizable, auto-asignado |
| `updatedAt` | `LocalDateTime` | nullable, auto-actualizado |

**Enum `AnnouncementScope`:** `FACULTAD`, `UNIVERSIDAD`
**Enum `AnnouncementType`:** `GENERAL`, `ASAMBLEA`

---

### `CalendarEvent`
**Tabla:** `calendar_events`
**Ruta:** `content/entity/CalendarEvent.java`
**Propósito:** Evento del calendario académico (festivos, paros, inscripciones, etc.).

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `title` | `String` | NOT NULL |
| `description` | `String` | nullable |
| `eventType` | `CalendarEventType` (enum) | NOT NULL |
| `startDate` | `LocalDate` | NOT NULL |
| `endDate` | `LocalDate` | nullable |
| `createdBy` | `Long` | NOT NULL (ID del usuario) |

**Enum `CalendarEventType`:** `FESTIVO`, `PARO`, `INSCRIPCIONES`, `OTRO`

---

### `WelfareContent`
**Tabla:** `welfare_contents`
**Ruta:** `content/entity/WelfareContent.java`
**Propósito:** Contenido de bienestar universitario (apoyos alimentarios, becas, salud mental, etc.).

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `title` | `String` | NOT NULL |
| `description` | `String` | NOT NULL, max 5000 chars |
| `category` | `WelfareCategory` (enum) | NOT NULL |
| `links` | `String` | nullable |
| `createdBy` | `Long` | NOT NULL (ID del usuario) |
| `createdAt` | `LocalDateTime` | NOT NULL, no actualizable, auto-asignado |
| `updatedAt` | `LocalDateTime` | nullable, auto-actualizado |

**Enum `WelfareCategory`:** `APOYO_ALIMENTARIO`, `BECAS`, `SALUD_MENTAL`, `SERVICIOS_SALUD`

---

## 🚩 Módulo `report`

### `Report`
**Tabla:** `reports`
**Ruta:** `report/entity/Report.java`
**Propósito:** Reporte enviado por un usuario sobre errores o inconsistencias en la información del sistema.

| Campo | Tipo | Restricciones |
|---|---|---|
| `id` | `Long` | PK, auto-generado |
| `userId` | `Long` | NOT NULL |
| `reportType` | `ReportType` (enum) | NOT NULL |
| `description` | `String` | NOT NULL, max 2000 chars |
| `evidenceUrl` | `String` | nullable |
| `status` | `ReportStatus` (enum) | NOT NULL, default `PENDIENTE` |
| `createdAt` | `LocalDateTime` | NOT NULL, no actualizable, auto-asignado |
| `resolvedAt` | `LocalDateTime` | nullable |

**Enum `ReportType`:** `ERROR_HORARIO`, `CAMBIO_SALON`, `INFORMACION_INCORRECTA`, `OTRO`
**Enum `ReportStatus`:** `PENDIENTE`, `EN_REVISION`, `RESUELTO`, `DESCARTADO`

---

## Diagrama de relaciones

```
StudyPlan ──< Subject ──< SubjectGroup ──< TimeBlock
     │              └──< Prerequisite
     └──< CurriculumSubject
               ▲
               │
User ──< Role  │
  └──< UserAcademicProgress >── StudyPlan
            └──< UserSubjectProgress >── CurriculumSubject
                       └── status: PENDIENTE | CURSANDO | APROBADA

Campus ──< Classroom ──< ClassroomPhoto

Schedule ──< ScheduleBlock
```

---

## Conteo de entidades

| Módulo | Entidades `@Entity` | Enums |
|---|---|---|
| auth | 1 | — |
| user | 4 | `RoleName`, `SubjectStatus` |
| academic | 6 | `DayOfWeek`, `ElectiveType` |
| schedule | 2 | — |
| campus | 3 | — |
| content | 3 | `AnnouncementScope`, `AnnouncementType`, `CalendarEventType`, `WelfareCategory` |
| report | 1 | `ReportStatus`, `ReportType` |
| **Total** | **20** | **10** |
