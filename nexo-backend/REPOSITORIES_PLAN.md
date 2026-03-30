# Plan de Implementación de Repositories — NexoUD Backend

Paquete base: `com.kumorai.nexo`
Patrón: `JpaRepository<Entidad, Long>` + queries derivadas + `@Query` JPQL donde sea necesario.

Fuentes: `ENTITIES.md` · `SERVICES_PLAN.md`

---

## Índice

| # | Repository | Entidad | Módulo | Usado por |
|---|---|---|---|---|
| 1 | `VerificationCodeRepository` | `VerificationCode` | `auth` | `AuthService`, `UserService` |
| 2 | `UserRepository` | `User` | `user` | `AuthService`, `UserService`, `RoleService`, `AnnouncementService`, `CampusService`, `ScheduleService`, `StudyProgressService`, `ReportService` |
| 3 | `RoleRepository` | `Role` | `user` | `RoleService` |
| 4 | `AcademicOfferRepository` | `AcademicOffer` | `academic` | `AcademicOfferService`, `ScheduleService` |
| 5 | `StudyPlanRepository` | `StudyPlan` | `academic` | `AcademicOfferService`, `StudyPlanService`, `CurriculumSubjectService`, `StudyProgressService` |
| 6 | `SubjectRepository` | `Subject` | `academic` | `AcademicOfferService`, `ScheduleService` |
| 7 | `SubjectGroupRepository` | `SubjectGroup` | `academic` | `AcademicOfferService`, `ScheduleService` |
| 8 | `TimeBlockRepository` | `TimeBlock` | `academic` | `AcademicOfferService`, `ScheduleService` |
| 9 | `CurriculumSubjectRepository` | `CurriculumSubject` | `academic` | `CurriculumSubjectService`, `StudyProgressService` |
| 10 | `ScheduleRepository` | `Schedule` | `schedule` | `ScheduleService`, `ScheduleExportService` |
| 11 | `ScheduleBlockRepository` | `ScheduleBlock` | `schedule` | `ScheduleService`, `ScheduleExportService` |
| 12 | `UserAcademicProgressRepository` | `UserAcademicProgress` | `user` | `StudyProgressService` |
| 13 | `UserSubjectProgressRepository` | `UserSubjectProgress` | `user` | `StudyProgressService` |
| 14 | `AnnouncementRepository` | `Announcement` | `content` | `AnnouncementService` |
| 15 | `CalendarEventRepository` | `CalendarEvent` | `content` | `CalendarEventService` |
| 16 | `WelfareContentRepository` | `WelfareContent` | `content` | `WelfareService` |
| 17 | `CampusRepository` | `Campus` | `campus` | `CampusService` |
| 18 | `ClassroomRepository` | `Classroom` | `campus` | `CampusService` |
| 19 | `ClassroomPhotoRepository` | `ClassroomPhoto` | `campus` | `CampusService` |
| 20 | `ReportRepository` | `Report` | `report` | `ReportService` |

**Total: 20 repositories**

---

## Convenciones generales

| Elemento | Convención |
|---|---|
| Ubicación | `{módulo}/repository/XxxRepository.java` |
| Herencia | `extends JpaRepository<Entidad, Long>` |
| Queries simples | Métodos derivados por nombre (`findBy...`, `existsBy...`, `countBy...`) |
| Queries complejas | `@Query` con JPQL (no SQL nativo) |
| Queries de escritura | `@Modifying` + `@Transactional` |
| Fetch | Lazy por defecto en entidades; los services cargan explícitamente lo que necesitan |

---

## Módulo `auth`

### 1. `VerificationCodeRepository`

**Ruta:** `auth/repository/VerificationCodeRepository.java`
**Entidad:** `VerificationCode`
**Tabla:** `verification_codes`

**Métodos:**

```java
// Obtiene el código más reciente para un email (para verificar o reenviar)
Optional<VerificationCode> findTopByEmailOrderByCreatedAtDesc(String email);

// Limpieza de códigos expirados (para un job de mantenimiento futuro)
void deleteByExpiresAtBefore(LocalDateTime threshold);

// Verificar si ya existe un código activo (no usado y no expirado) para un email
boolean existsByEmailAndUsedFalseAndExpiresAtAfter(String email, LocalDateTime now);
```

**Notas:**
- `findTopByEmailOrderByCreatedAtDesc` es el método crítico: siempre trabaja sobre el código más reciente.
- `deleteByExpiresAtBefore` no es urgente pero es buena práctica para evitar acumulación.

---

## Módulo `user`

### 2. `UserRepository`

**Ruta:** `user/repository/UserRepository.java`
**Entidad:** `User`
**Tabla:** `users`

**Métodos:**

```java
Optional<User> findByEmail(String email);
boolean existsByEmail(String email);
boolean existsByNickname(String nickname);

// Para listado paginado del administrador (DS-11)
Page<User> findAll(Pageable pageable);
Page<User> findByEmailContainingIgnoreCase(String email, Pageable pageable);
```

**Notas:**
- `findByEmail` es el método más usado en todo el backend (AuthService, UserService, RoleService, etc.).
- El listado paginado requiere que el método reciba `Pageable` — Spring Data lo resuelve automáticamente.

---

### 3. `RoleRepository`

**Ruta:** `user/repository/RoleRepository.java`
**Entidad:** `Role`
**Tabla:** `user_roles`

**Métodos:**

```java
List<Role> findByUserId(Long userId);

boolean existsByUserIdAndRoleName(Long userId, RoleName roleName);

// Contar roles de un usuario (para impedir revocar el último)
long countByUserId(Long userId);
```

**Notas:**
- `countByUserId` es clave en `RoleService.revokeRole()` para garantizar que el usuario siempre tenga al menos un rol.
- No se necesita `findAll()` global de roles; el service los devuelve a partir del enum `RoleName`.

---

### 12. `UserAcademicProgressRepository`

**Ruta:** `user/repository/UserAcademicProgressRepository.java`
**Entidad:** `UserAcademicProgress`
**Tabla:** `user_academic_progress`

**Métodos:**

```java
List<UserAcademicProgress> findByUserId(Long userId);

Optional<UserAcademicProgress> findByUserIdAndStudyPlanId(Long userId, Long studyPlanId);

boolean existsByUserIdAndStudyPlanId(Long userId, Long studyPlanId);
```

**Notas:**
- `existsByUserIdAndStudyPlanId` es la validación del constraint único en `StudyProgressService.enroll()`.
- `findByUserId` retorna la lista de carreras (soporte a doble titulación).

---

### 13. `UserSubjectProgressRepository`

**Ruta:** `user/repository/UserSubjectProgressRepository.java`
**Entidad:** `UserSubjectProgress`
**Tabla:** `user_subject_progress`

**Métodos:**

```java
List<UserSubjectProgress> findByAcademicProgressId(Long academicProgressId);

Optional<UserSubjectProgress> findByAcademicProgressIdAndCurriculumSubjectId(
        Long academicProgressId, Long curriculumSubjectId);

// Para calcular el resumen de avance (DS: StudyProgressService.getSummary)
@Query("""
    SELECT COALESCE(SUM(cs.credits), 0)
    FROM UserSubjectProgress usp
    JOIN usp.curriculumSubject cs
    WHERE usp.academicProgress.id = :progressId
    AND usp.status = :status
    """)
int sumCreditsByProgressIdAndStatus(
        @Param("progressId") Long progressId,
        @Param("status") SubjectStatus status);

// Para verificar que no hay referencias activas antes de eliminar un CurriculumSubject
boolean existsByCurriculumSubjectId(Long curriculumSubjectId);
```

**Notas:**
- `sumCreditsByProgressIdAndStatus` es la query central de `getSummary()`: se llama dos veces (una para `APROBADA`, una para el total).
- `existsByCurriculumSubjectId` protege contra la eliminación de materias curriculares con progreso registrado.

---

## Módulo `academic`

### 4. `AcademicOfferRepository`

**Ruta:** `academic/repository/AcademicOfferRepository.java`
**Entidad:** `AcademicOffer`
**Tabla:** `academic_offers`

**Métodos:**

```java
Optional<AcademicOffer> findByActiveTrue();

// Para desactivar todas antes de activar una nueva (AcademicOfferService.activate)
@Modifying
@Query("UPDATE AcademicOffer a SET a.active = false")
void deactivateAll();
```

**Notas:**
- `deactivateAll()` debe ejecutarse dentro de la misma transacción que el `save()` que activa la nueva oferta.
- `findByActiveTrue()` es la consulta más frecuente del sistema: la usan `ScheduleService` y cualquier endpoint público de consulta de horarios.

---

### 5. `StudyPlanRepository`

**Ruta:** `academic/repository/StudyPlanRepository.java`
**Entidad:** `StudyPlan`
**Tabla:** `study_plans`

**Métodos:**

```java
Optional<StudyPlan> findByCodigoPlan(String codigoPlan);

boolean existsByCodigoPlan(String codigoPlan);

// Para el panel de administrador (DS-13): lista con conteo de materias curriculares
@Query("""
    SELECT sp, COUNT(cs)
    FROM StudyPlan sp
    LEFT JOIN sp.curriculumSubjects cs
    GROUP BY sp
    ORDER BY sp.facultad, sp.nombre
    """)
List<Object[]> findAllWithCurriculumCount();
```

**Notas:**
- `findByCodigoPlan` es el método clave en `AcademicOfferService.upload()`: por cada entrada del JSON se hace un "get or create" usando este método.
- La query `findAllWithCurriculumCount` es opcional en la primera iteración; puede reemplazarse con un `findAll()` y cálculo en el service.

---

### 6. `SubjectRepository`

**Ruta:** `academic/repository/SubjectRepository.java`
**Entidad:** `Subject`
**Tabla:** `subjects`

**Métodos:**

```java
List<Subject> findByStudyPlanId(Long studyPlanId);

// Para consulta pública de oferta activa (DS-01, DS-04)
@Query("""
    SELECT DISTINCT s FROM Subject s
    JOIN s.grupos g
    WHERE g.academicOffer.id = :offerId
    AND (:studyPlanId IS NULL OR s.studyPlan.id = :studyPlanId)
    ORDER BY s.nombre
    """)
List<Subject> findByOfferIdAndOptionalStudyPlan(
        @Param("offerId") Long offerId,
        @Param("studyPlanId") Long studyPlanId);

Optional<Subject> findByCodigoAndStudyPlanId(String codigo, Long studyPlanId);
```

**Notas:**
- `findByOfferIdAndOptionalStudyPlan` es la query del endpoint público `GET /api/v1/schedules/offer/subjects`. El parámetro `studyPlanId` es opcional (puede ser `null`).
- `findByCodigoAndStudyPlanId` se usa en `AcademicOfferService.upload()` para detectar duplicados al procesar el JSON.

---

### 7. `SubjectGroupRepository`

**Ruta:** `academic/repository/SubjectGroupRepository.java`
**Entidad:** `SubjectGroup`
**Tabla:** `subject_groups`

**Métodos:**

```java
List<SubjectGroup> findBySubjectId(Long subjectId);

List<SubjectGroup> findByAcademicOfferId(Long academicOfferId);

// Para validar cruces de horario (DS-01): obtener los TimeBlocks de una lista de grupos
@Query("""
    SELECT tb FROM TimeBlock tb
    WHERE tb.subjectGroup.id IN :groupIds
    ORDER BY tb.dia, tb.horaInicio
    """)
List<TimeBlock> findTimeBlocksByGroupIds(@Param("groupIds") List<Long> groupIds);
```

**Notas:**
- `findTimeBlocksByGroupIds` es la query central de `ScheduleService.checkConflicts()`. Carga todos los bloques de los grupos seleccionados para detectar solapamientos en memoria.

---

### 8. `TimeBlockRepository`

**Ruta:** `academic/repository/TimeBlockRepository.java`
**Entidad:** `TimeBlock`
**Tabla:** `time_blocks`

**Métodos:**

```java
List<TimeBlock> findBySubjectGroupId(Long subjectGroupId);

// Para eliminar todos los bloques de una oferta al borrarla
@Modifying
@Query("""
    DELETE FROM TimeBlock tb
    WHERE tb.subjectGroup.id IN (
        SELECT g.id FROM SubjectGroup g WHERE g.academicOffer.id = :offerId
    )
    """)
void deleteByAcademicOfferId(@Param("offerId") Long offerId);
```

**Notas:**
- `deleteByAcademicOfferId` se usa como paso previo a la eliminación de `SubjectGroup` cuando se borra una oferta, evitando violaciones de FK.
- En la mayoría de los casos la eliminación se maneja por cascade; este método solo es necesario si el cascade no llega hasta `TimeBlock` directamente desde `AcademicOffer`.

---

### 9. `CurriculumSubjectRepository`

**Ruta:** `academic/repository/CurriculumSubjectRepository.java`
**Entidad:** `CurriculumSubject`
**Tabla:** `curriculum_subjects`

**Métodos:**

```java
List<CurriculumSubject> findByStudyPlanId(Long studyPlanId);

boolean existsByCodigoAndStudyPlanId(String codigo, Long studyPlanId);

Optional<CurriculumSubject> findByIdAndStudyPlanId(Long id, Long studyPlanId);

// Total de créditos de un plan (para StudyPlanService.findById)
@Query("SELECT COALESCE(SUM(cs.credits), 0) FROM CurriculumSubject cs WHERE cs.studyPlan.id = :planId")
int sumCreditsByStudyPlanId(@Param("planId") Long planId);
```

**Notas:**
- `existsByCodigoAndStudyPlanId` valida el constraint único antes de crear en `CurriculumSubjectService.create()`.
- `findByIdAndStudyPlanId` garantiza que el subject pertenece al plan indicado en la URL (evita acceso cruzado).
- `sumCreditsByStudyPlanId` calcula el total de créditos sin campo físico en la entidad.

---

## Módulo `schedule`

### 10. `ScheduleRepository`

**Ruta:** `schedule/repository/ScheduleRepository.java`
**Entidad:** `Schedule`
**Tabla:** `schedules`

**Métodos:**

```java
List<Schedule> findByUserIdOrderByCreatedAtDesc(Long userId);

Optional<Schedule> findByIdAndUserId(Long id, Long userId);

// Para ScheduleExportService: cargar horario con bloques en un solo query
@Query("""
    SELECT s FROM Schedule s
    LEFT JOIN FETCH s.blocks
    WHERE s.id = :id AND s.userId = :userId
    """)
Optional<Schedule> findByIdAndUserIdWithBlocks(@Param("id") Long id, @Param("userId") Long userId);
```

**Notas:**
- `findByIdAndUserId` es el método de ownership check: si retorna `Optional.empty()` → `NexoException.forbidden()`.
- `findByIdAndUserIdWithBlocks` evita el N+1 en `ScheduleExportService` que necesita todos los bloques de una vez.

---

### 11. `ScheduleBlockRepository`

**Ruta:** `schedule/repository/ScheduleBlockRepository.java`
**Entidad:** `ScheduleBlock`
**Tabla:** `schedule_blocks`

**Métodos:**

```java
List<ScheduleBlock> findByScheduleId(Long scheduleId);

// Para eliminar todos los bloques antes de reemplazarlos en un update
void deleteByScheduleId(Long scheduleId);
```

**Notas:**
- `deleteByScheduleId` + re-inserción de nuevos bloques es la estrategia más simple para `ScheduleService.update()` (evita lógica de diff).
- Como `ScheduleBlock` tiene `orphanRemoval = true` en `Schedule`, en la mayoría de los casos se puede manejar desde la entidad padre limpiando la colección.

---

## Módulo `content`

### 14. `AnnouncementRepository`

**Ruta:** `content/repository/AnnouncementRepository.java`
**Entidad:** `Announcement`
**Tabla:** `announcements`

**Métodos:**

```java
// Filtrado por scope, type y faculty (todos opcionales) — DS-08, DS-06
@Query("""
    SELECT a FROM Announcement a
    WHERE (:scope IS NULL OR a.scope = :scope)
    AND (:type IS NULL OR a.type = :type)
    AND (:faculty IS NULL OR a.faculty = :faculty)
    ORDER BY a.createdAt DESC
    """)
List<Announcement> findFiltered(
        @Param("scope") AnnouncementScope scope,
        @Param("type") AnnouncementType type,
        @Param("faculty") String faculty);
```

**Notas:**
- El filtrado con parámetros opcionales (`IS NULL OR`) en JPQL es el patrón estándar en Spring Data. Funciona correctamente con Hibernate.
- Considerar paginación (`Pageable`) en una iteración posterior si el volumen de avisos crece.

---

### 15. `CalendarEventRepository`

**Ruta:** `content/repository/CalendarEventRepository.java`
**Entidad:** `CalendarEvent`
**Tabla:** `calendar_events`

**Métodos:**

```java
// Filtrado por rango de fechas y tipo (DS-06 categoría "Calendario")
@Query("""
    SELECT c FROM CalendarEvent c
    WHERE (:from IS NULL OR c.startDate >= :from)
    AND (:to IS NULL OR c.startDate <= :to)
    AND (:eventType IS NULL OR c.eventType = :eventType)
    ORDER BY c.startDate ASC
    """)
List<CalendarEvent> findFiltered(
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        @Param("eventType") CalendarEventType eventType);
```

---

### 16. `WelfareContentRepository`

**Ruta:** `content/repository/WelfareContentRepository.java`
**Entidad:** `WelfareContent`
**Tabla:** `welfare_contents`

**Métodos:**

```java
// Filtrado por categoría (DS-09)
List<WelfareContent> findByCategoryOrderByCreatedAtDesc(WelfareCategory category);

List<WelfareContent> findAllByOrderByCreatedAtDesc();
```

**Notas:**
- El service decide cuál método invocar según si `category` viene en la request o no.

---

## Módulo `campus`

### 17. `CampusRepository`

**Ruta:** `campus/repository/CampusRepository.java`
**Entidad:** `Campus`
**Tabla:** `campuses`

**Métodos:**

```java
// Filtrado por facultad (DS-06 categoría "Sede", DS-10)
List<Campus> findByFacultyOrderByNameAsc(String faculty);

List<Campus> findAllByOrderByFacultyAscNameAsc();
```

---

### 18. `ClassroomRepository`

**Ruta:** `campus/repository/ClassroomRepository.java`
**Entidad:** `Classroom`
**Tabla:** `classrooms`

**Métodos:**

```java
List<Classroom> findByCampusId(Long campusId);

Optional<Classroom> findByIdAndCampusId(Long id, Long campusId);

// Para verificar dependencias antes de eliminar una sede
boolean existsByCampusId(Long campusId);
```

**Notas:**
- `findByIdAndCampusId` garantiza que el aula pertenece a la sede indicada en la URL (evita acceso cruzado entre sedes).
- `existsByCampusId` se usa antes de eliminar una sede para advertir si tiene aulas asociadas.

---

### 19. `ClassroomPhotoRepository`

**Ruta:** `campus/repository/ClassroomPhotoRepository.java`
**Entidad:** `ClassroomPhoto`
**Tabla:** `classroom_photos`

**Métodos:**

```java
List<ClassroomPhoto> findByClassroomId(Long classroomId);

Optional<ClassroomPhoto> findByIdAndClassroomId(Long id, Long classroomId);
```

---

## Módulo `report`

### 20. `ReportRepository`

**Ruta:** `report/repository/ReportRepository.java`
**Entidad:** `Report`
**Tabla:** `reports`

**Métodos:**

```java
// Para el estudiante: ver sus propios reportes (DS-07)
List<Report> findByUserIdOrderByCreatedAtDesc(Long userId);

// Para el administrador: filtrado por estado y tipo
@Query("""
    SELECT r FROM Report r
    WHERE (:status IS NULL OR r.status = :status)
    AND (:reportType IS NULL OR r.reportType = :reportType)
    ORDER BY r.createdAt DESC
    """)
List<Report> findFiltered(
        @Param("status") ReportStatus status,
        @Param("reportType") ReportType reportType);
```

---

## Orden de implementación recomendado

Los repositories no tienen dependencias entre sí (cada uno opera sobre una entidad), por lo que pueden crearse en cualquier orden. El orden sugerido sigue el de las fases de services:

```
Fase 0 — Fundación (requeridos por AuthService y UserService)
├── VerificationCodeRepository
├── UserRepository
└── RoleRepository

Fase 1 — Académico (requeridos por AcademicOfferService y afines)
├── AcademicOfferRepository
├── StudyPlanRepository
├── SubjectRepository
├── SubjectGroupRepository
├── TimeBlockRepository
└── CurriculumSubjectRepository

Fase 2 — Progreso y horarios (requeridos por ScheduleService y StudyProgressService)
├── ScheduleRepository
├── ScheduleBlockRepository
├── UserAcademicProgressRepository
└── UserSubjectProgressRepository

Fase 3 — Contenido y campus (requeridos por services de Fase 3)
├── AnnouncementRepository
├── CalendarEventRepository
├── WelfareContentRepository
├── CampusRepository
├── ClassroomRepository
└── ClassroomPhotoRepository

Fase 4 — Reportes
└── ReportRepository
```
