# Plan de Implementación de Services — NexoUD Backend

Paquete base: `com.kumorai.nexo`
Patrón: Interfaz + Implementación (`XxxService` / `XxxServiceImpl`)
Cada service trabaja sobre repositories JPA, lanza `NexoException` y usa `@Transactional` donde corresponda.

Fuentes: `ENTITIES.md` · `IMPLEMENTATION_PLAN.md` · DS-01 a DS-13

---

## Índice

**Infraestructura transversal**
1. [JwtService](#1-jwtservice--sharedutil)
2. [EmailService](#2-emailservice--sharedutil)

**Fase 1 — Fundación**
3. [AuthService](#3-authservice--authservice)
4. [UserService](#4-userservice--userservice)
5. [RoleService](#5-roleservice--userservice)

**Fase 2 — Catálogo académico**
6. [AcademicOfferService](#6-academicofferservice--academicservice)
7. [StudyPlanService](#7-studyplanservice--academicservice)
8. [CurriculumSubjectService](#8-curriculumsubjectservice--academicservice)

**Fase 3 — Contenido informativo**
9. [AnnouncementService](#9-announcementservice--contentservice)
10. [CalendarEventService](#10-calendareventservice--contentservice)
11. [WelfareService](#11-welfareservice--contentservice)
12. [CampusService](#12-campusservice--campusservice)

**Fase 4 — Funcionalidades del estudiante**
13. [ScheduleService](#13-scheduleservice--scheduleservice)
14. [ScheduleExportService](#14-scheduleexportservice--scheduleservice)
15. [StudyProgressService](#15-studyprogressservice--academicservice)
16. [ReportService](#16-reportservice--reportservice)

---

## Convenciones generales

| Elemento | Convención |
|---|---|
| Ubicación de interfaz | `{módulo}/service/XxxService.java` |
| Ubicación de impl | `{módulo}/service/XxxServiceImpl.java` |
| Repositorios | `{módulo}/repository/XxxRepository.java` (un repo por entidad) |
| Excepciones | `shared/exception/NexoException` (factory: `.notFound()`, `.badRequest()`, `.conflict()`, `.forbidden()`) |
| Transacciones | `@Transactional` en métodos de escritura; `@Transactional(readOnly=true)` en lecturas |
| DTOs de entrada/salida | `{módulo}/dto/` — records inmutables con anotaciones de validación Bean Validation |

---

## Infraestructura transversal

### 1. `JwtService` — `shared/util`

**Propósito:** Generar, parsear y validar tokens JWT. Usado exclusivamente por `AuthService`.

**Repositorios requeridos:** ninguno (opera sobre el token en memoria).

**Dependencias de configuración:**
- `nexo.jwt.secret` — clave HMAC-SHA256 en Base64
- `nexo.jwt.expiration-ms` — tiempo de vida del token

**Métodos de la interfaz:**

```java
String generate(String email, List<String> roles);
Claims parse(String token);
String extractEmail(String token);
boolean isValid(String token);
```

**Notas:**
- Librería: `io.jsonwebtoken:jjwt-api:0.12.6` (ya en pom.xml pendiente de agregar).
- `generate()` embebe `email` como `subject` y `roles` como claim `"roles"`.
- `isValid()` captura cualquier `JwtException` y retorna `false`; nunca lanza.
- Binding de propiedades a través de `@ConfigurationProperties(prefix = "nexo.jwt")`.

---

### 2. `EmailService` — `shared/util`

**Propósito:** Abstracción del envío de correos institucionales. Usado por `AuthService` y `UserService`.

**Repositorios requeridos:** ninguno.

**Dependencias de configuración:**
- `spring.mail.*` — configuración SMTP (ya en pom: `spring-boot-starter-mail`).

**Métodos de la interfaz:**

```java
void sendVerificationCode(String toEmail, String code, int ttlMinutes);
void sendPasswordResetCode(String toEmail, String code, int ttlMinutes);
void sendNicknameChangeCode(String toEmail, String code, int ttlMinutes);
```

**Notas:**
- Implementación usa `JavaMailSender` con `SimpleMailMessage`.
- Los asuntos y cuerpos de los correos se centralizan aquí para no repetirlos en cada service.
- En desarrollo, reemplazar con `MailHog` o consola (`spring.mail.host=localhost`).

---

## Fase 1 — Fundación

### 3. `AuthService` — `auth/service`

**Propósito:** Registro, verificación de cuenta, login, logout, recuperación de contraseña.
**Diagramas:** DS-02

**Repositorios requeridos:**
- `UserRepository` — verificar existencia, crear y activar usuario
- `RoleRepository` — asignar rol `ESTUDIANTE` por defecto
- `VerificationCodeRepository` — persistir y consultar códigos de verificación

**Dependencias de services:**
- `JwtService` — generar token en `login()`
- `EmailService` — enviar código de verificación
- `PasswordEncoder` — cifrar y verificar contraseñas

**DTOs de entrada:**

| DTO | Campos | Validaciones |
|---|---|---|
| `RegisterRequest` | `email`, `nickname`, `password` | `@Email`, regex `@udistrital.edu.co`, `@Size(min=8)` |
| `VerifyCodeRequest` | `email`, `code` | `@Size(min=6,max=6)` |
| `EmailRequest` | `email` | `@Email` |
| `LoginRequest` | `email`, `password` | `@NotBlank` |
| `ResetPasswordRequest` | `email`, `code`, `newPassword` | `@Size(min=6,max=6)`, `@Size(min=8)` |

**DTOs de salida:**

| DTO | Campos |
|---|---|
| `LoginResponse` | `token`, `email`, `nickname`, `roles` |

**Métodos de la interfaz:**

```java
void register(RegisterRequest request);
void verifyCode(VerifyCodeRequest request);
void resendCode(String email);
LoginResponse login(LoginRequest request);
void forgotPassword(String email);
void resetPassword(ResetPasswordRequest request);
```

**Lógica clave por método:**

| Método | Lógica |
|---|---|
| `register()` | 1. Verificar unicidad de `email` y `nickname` → `NexoException.conflict()`. 2. Crear `User` con `active=false`. 3. Asignar rol `ESTUDIANTE`. 4. Llamar `EmailService.sendVerificationCode()`. |
| `verifyCode()` | 1. Obtener código más reciente por email. 2. Validar `used`, `expiresAt`, `attempts` (máximo configurable). 3. Si incorrecto: incrementar `attempts` → lanzar error con intentos restantes. 4. Si correcto: marcar `used=true`, activar usuario. |
| `resendCode()` | Verificar que el usuario exista → generar y enviar nuevo código. |
| `login()` | 1. Buscar usuario por email. 2. Verificar `active=true`. 3. Verificar contraseña con `PasswordEncoder`. 4. Extraer roles → generar JWT. |
| `forgotPassword()` | Si el email existe, enviar código (no revelar si no existe por seguridad). |
| `resetPassword()` | Reutilizar lógica de `verifyCode()` → actualizar `passwordHash`. |

**Propiedades de configuración:**
- `nexo.verification.code-ttl-minutes` (default: 10)
- `nexo.verification.max-attempts` (default: 3)

---

### 4. `UserService` — `user/service`

**Propósito:** Gestión del perfil propio del usuario y operaciones administrativas sobre usuarios.
**Diagramas:** DS-03, DS-11

**Repositorios requeridos:**
- `UserRepository` — leer, actualizar, eliminar usuario
- `VerificationCodeRepository` — verificar código antes de cambiar apodo

**Dependencias de services:**
- `EmailService` — enviar código de confirmación antes de cambiar apodo
- `PasswordEncoder` — verificar contraseña en eliminación de cuenta

**DTOs de entrada:**

| DTO | Campos | Validaciones |
|---|---|---|
| `UpdateNicknameRequest` | `newNickname`, `verificationCode` | `@Size(min=3,max=30)`, `@Size(min=6,max=6)` |
| `DeleteAccountRequest` | `password` | `@NotBlank` |
| `SetActiveRequest` | `active` | `@NotNull` |

**DTOs de salida:**

| DTO | Campos |
|---|---|
| `UserProfileResponse` | `id`, `email`, `nickname`, `active`, `createdAt`, `roles` |
| `UserSummaryResponse` | `id`, `email`, `nickname`, `active` (para listados) |

**Métodos de la interfaz:**

```java
UserProfileResponse getMyProfile(String email);
UserProfileResponse getById(Long id);
UserProfileResponse searchByEmail(String email);
void requestNicknameChangeCode(String email);
void updateNickname(String email, UpdateNicknameRequest request);
void deleteAccount(String email, DeleteAccountRequest request);
void setActive(Long userId, boolean active);
```

**Lógica clave por método:**

| Método | Lógica |
|---|---|
| `requestNicknameChangeCode()` | DS-03: enviar código al correo antes de permitir el cambio de apodo. |
| `updateNickname()` | 1. Validar código de verificación. 2. Verificar que el nuevo apodo no esté en uso. 3. Actualizar `nickname`. |
| `deleteAccount()` | DS-03: verificar contraseña → marcar `active=false` → eliminar físicamente. |
| `setActive()` | DS-11: usado por el administrador para activar/suspender cuentas. |

---

### 5. `RoleService` — `user/service`

**Propósito:** Asignación y revocación de roles a usuarios. Exclusivo del administrador.
**Diagramas:** DS-11

**Repositorios requeridos:**
- `RoleRepository` — listar, crear, eliminar roles
- `UserRepository` — resolver usuario y admin que asigna

**DTOs de entrada:**

| DTO | Campos | Validaciones |
|---|---|---|
| `AssignRoleRequest` | `roleName` | `@NotNull`, enum `RoleName` |

**DTOs de salida:**

| DTO | Campos |
|---|---|
| `RoleResponse` | `id`, `roleName`, `assignedAt`, `assignedBy` |

**Métodos de la interfaz:**

```java
List<String> getAllRoleNames();
List<RoleResponse> getRolesByUser(Long userId);
void assignRole(Long userId, AssignRoleRequest request, String assignedByEmail);
void revokeRole(Long userId, Long roleId);
```

**Lógica clave por método:**

| Método | Lógica |
|---|---|
| `assignRole()` | 1. Verificar que el usuario exista. 2. Verificar que no tenga ya ese rol (`NexoException.conflict()`). 3. Persistir `Role` con `assignedBy`. |
| `revokeRole()` | 1. Verificar que el rol pertenezca al usuario. 2. Verificar que no sea el último rol (mínimo 1 siempre). 3. Eliminar. |

---

## Fase 2 — Catálogo académico

### 6. `AcademicOfferService` — `academic/service`

**Propósito:** Gestión del ciclo de vida de la oferta académica (cargar JSON del extractor Python, activar, eliminar).
**Diagramas:** DS-12

**Repositorios requeridos:**
- `AcademicOfferRepository` — CRUD de ofertas
- `StudyPlanRepository` — crear/buscar plan por `codigoPlan`
- `SubjectRepository` — crear materias por oferta
- `SubjectGroupRepository` — crear grupos
- `TimeBlockRepository` — crear bloques horarios

**DTOs de entrada:**

| DTO | Campos | Validaciones |
|---|---|---|
| `UploadOfferRequest` | `semester`, `file` (MultipartFile JSON) | `@NotBlank`, `@NotNull` |

**DTOs de salida:**

| DTO | Campos |
|---|---|
| `AcademicOfferResponse` | `id`, `semester`, `uploadedAt`, `active` |
| `OfferUploadResultResponse` | `offerId`, `facultades`, `carreras`, `materias`, `grupos`, `horarios`, `warnings` |

**Métodos de la interfaz:**

```java
List<AcademicOfferResponse> findAll();
AcademicOfferResponse findActive();
OfferUploadResultResponse upload(MultipartFile jsonFile, String semester, String uploaderEmail);
void activate(Long offerId);
void delete(Long offerId);
```

**Lógica clave por método:**

| Método | Lógica |
|---|---|
| `upload()` | DS-12: 1. Parsear el `data.json` del extractor Python (lista de objetos con `codigo`, `nombre`, `facultad`, `carrera`, `carrera_codigo`, `grupos`). 2. Por cada item: obtener o crear `StudyPlan` por `carrera_codigo`. 3. Crear `Subject`. 4. Por cada grupo: crear `SubjectGroup` con `grupoCode`, `inscritos`, `docente`. 5. Por cada horario: crear `TimeBlock` con `dia`, `horaInicio`, `horaFin`, `ubicacion`. 6. Asociar todo a la nueva `AcademicOffer`. 7. Retornar estadísticas. |
| `activate()` | Dentro de una transacción: 1. `deactivateAll()`. 2. Poner `active=true` en la oferta seleccionada. |
| `delete()` | Verificar que no sea la única oferta activa antes de eliminar. Cascade elimina `Subject` → `SubjectGroup` → `TimeBlock`. |

**Estructura esperada del JSON del extractor:**
```json
[
  {
    "codigo": "1234",
    "nombre": "CALCULO DIFERENCIAL",
    "facultad": "Ingeniería",
    "carrera": "INGENIERIA DE SISTEMAS",
    "carrera_codigo": "020",
    "grupos": [
      {
        "grupo": "020-81",
        "inscritos": 35,
        "docente": "PEREZ GARCIA JUAN",
        "horarios": [
          { "dia": "LUNES", "horaInicio": 6, "horaFin": 8, "ubicacion": "AULA 809" }
        ]
      }
    ]
  }
]
```

---

### 7. `StudyPlanService` — `academic/service`

**Propósito:** Consulta y gestión de planes de estudio (carreras). Usado por el administrador y como base del avance académico.
**Diagramas:** DS-13

**Repositorios requeridos:**
- `StudyPlanRepository`
- `CurriculumSubjectRepository`

**DTOs de salida:**

| DTO | Campos |
|---|---|
| `StudyPlanResponse` | `id`, `codigoPlan`, `nombre`, `facultad`, `totalCurriculumSubjects`, `totalCredits` |

**Métodos de la interfaz:**

```java
List<StudyPlanResponse> findAll();
StudyPlanResponse findById(Long id);
```

**Notas:**
- `totalCredits` se calcula como `SUM(credits)` de los `CurriculumSubject` asociados (no es campo físico en la entidad).
- La creación/modificación de `StudyPlan` es implícita vía `AcademicOfferService.upload()` para la parte de horarios, y vía `CurriculumSubjectService` para la malla curricular.

---

### 8. `CurriculumSubjectService` — `academic/service`

**Propósito:** CRUD del catálogo de materias con créditos del plan de estudios (malla curricular). Independiente de los horarios del extractor.
**Diagramas:** DS-13 (panel de gestión de administrador)

**Repositorios requeridos:**
- `CurriculumSubjectRepository`
- `StudyPlanRepository`

**DTOs de entrada:**

| DTO | Campos | Validaciones |
|---|---|---|
| `CurriculumSubjectRequest` | `codigo`, `nombre`, `credits`, `semester?` | `@NotBlank`, `@Min(1)`, `@Min(1) @Max(10)` |

**DTOs de salida:**

| DTO | Campos |
|---|---|
| `CurriculumSubjectResponse` | `id`, `codigo`, `nombre`, `credits`, `semester` |

**Métodos de la interfaz:**

```java
List<CurriculumSubjectResponse> findByStudyPlan(Long studyPlanId);
CurriculumSubjectResponse create(Long studyPlanId, CurriculumSubjectRequest request);
CurriculumSubjectResponse update(Long studyPlanId, Long subjectId, CurriculumSubjectRequest request);
void delete(Long studyPlanId, Long subjectId);
```

**Lógica clave:**
- `create()`: verificar constraint único `(codigo, study_plan_id)` → `NexoException.conflict()` si ya existe.
- `delete()`: verificar que no haya `UserSubjectProgress` activos referenciando esta materia antes de eliminar.

---

## Fase 3 — Contenido informativo

### 9. `AnnouncementService` — `content/service`

**Propósito:** CRUD de avisos institucionales.
**Diagramas:** DS-08, DS-06

**Repositorios requeridos:**
- `AnnouncementRepository`
- `UserRepository` (para resolver `createdBy` desde email)

**DTOs de entrada:**

| DTO | Campos | Validaciones |
|---|---|---|
| `AnnouncementRequest` | `title`, `body`, `scope`, `type`, `faculty?` | `@NotBlank`, `@Size(max=5000)`, `@NotNull` para enums |

**DTOs de salida:**

| DTO | Campos |
|---|---|
| `AnnouncementResponse` | `id`, `title`, `body`, `scope`, `type`, `faculty`, `createdAt`, `updatedAt` |

**Métodos de la interfaz:**

```java
List<AnnouncementResponse> findAll(AnnouncementScope scope, AnnouncementType type, String faculty);
AnnouncementResponse findById(Long id);
AnnouncementResponse create(AnnouncementRequest request, String createdByEmail);
AnnouncementResponse update(Long id, AnnouncementRequest request);
void delete(Long id);
```

**Lógica clave:**
- DS-08: en `create()` y `update()`, si `scope = FACULTAD` entonces `faculty` no puede ser nulo → `NexoException.badRequest()`.
- `createdBy` se resuelve buscando el `User` por email y tomando su `id`.
- `updatedAt` se gestiona vía `@PreUpdate` en la entidad.

---

### 10. `CalendarEventService` — `content/service`

**Propósito:** CRUD de eventos del calendario académico.
**Diagramas:** DS-06 (categoría "Calendario"), DS-13

**Repositorios requeridos:**
- `CalendarEventRepository`

**DTOs de entrada:**

| DTO | Campos | Validaciones |
|---|---|---|
| `CalendarEventRequest` | `title`, `description?`, `eventType`, `startDate`, `endDate?` | `@NotBlank`, `@NotNull`, `@FutureOrPresent` en startDate |

**DTOs de salida:**

| DTO | Campos |
|---|---|
| `CalendarEventResponse` | `id`, `title`, `description`, `eventType`, `startDate`, `endDate` |

**Métodos de la interfaz:**

```java
List<CalendarEventResponse> findAll(LocalDate from, LocalDate to, CalendarEventType eventType);
CalendarEventResponse findById(Long id);
CalendarEventResponse create(CalendarEventRequest request, String createdByEmail);
CalendarEventResponse update(Long id, CalendarEventRequest request);
void delete(Long id);
```

**Lógica clave:**
- `findAll()`: filtros opcionales — rango de fechas (`startDate BETWEEN from AND to`) y tipo de evento.
- Si `endDate` está presente, validar que sea >= `startDate`.

---

### 11. `WelfareService` — `content/service`

**Propósito:** CRUD de contenido de bienestar universitario.
**Diagramas:** DS-09, DS-06 (categoría "Bimestral")

**Repositorios requeridos:**
- `WelfareContentRepository`

**DTOs de entrada:**

| DTO | Campos | Validaciones |
|---|---|---|
| `WelfareRequest` | `title`, `description`, `category`, `links?` | `@NotBlank`, `@Size(max=5000)`, `@NotNull` |

**DTOs de salida:**

| DTO | Campos |
|---|---|
| `WelfareResponse` | `id`, `title`, `description`, `category`, `links`, `createdAt`, `updatedAt` |

**Métodos de la interfaz:**

```java
List<WelfareResponse> findAll(WelfareCategory category);
WelfareResponse findById(Long id);
WelfareResponse create(WelfareRequest request, String createdByEmail);
WelfareResponse update(Long id, WelfareRequest request);
void delete(Long id);
```

---

### 12. `CampusService` — `campus/service`

**Propósito:** Gestión de sedes, aulas y fotos de aulas.
**Diagramas:** DS-10, DS-06 (categoría "Sede")

**Repositorios requeridos:**
- `CampusRepository`
- `ClassroomRepository`
- `ClassroomPhotoRepository`
- `UserRepository` (para `uploadedBy`)

**DTOs de entrada:**

| DTO | Campos | Validaciones |
|---|---|---|
| `CampusRequest` | `name`, `address?`, `faculty`, `latitude?`, `longitude?`, `mapUrl?` | `@NotBlank` en name y faculty |
| `ClassroomRequest` | `name`, `building?`, `floor?`, `isLab` | `@NotBlank` en name, `@NotNull` en isLab |
| `ClassroomPhotoRequest` | `photoUrl` | `@NotBlank`, `@URL` |

**DTOs de salida:**

| DTO | Campos |
|---|---|
| `CampusResponse` | `id`, `name`, `address`, `faculty`, `latitude`, `longitude`, `mapUrl` |
| `CampusDetailResponse` | todo lo anterior + `classrooms: List<ClassroomResponse>` |
| `ClassroomResponse` | `id`, `name`, `building`, `floor`, `isLab`, `photos: List<ClassroomPhotoResponse>` |
| `ClassroomPhotoResponse` | `id`, `photoUrl`, `uploadedAt` |

**Métodos de la interfaz:**

```java
List<CampusResponse> findAll(String faculty);
CampusDetailResponse findById(Long campusId);
CampusResponse create(CampusRequest request);
CampusResponse update(Long campusId, CampusRequest request);
void delete(Long campusId);

List<ClassroomResponse> findClassrooms(Long campusId);
ClassroomResponse createClassroom(Long campusId, ClassroomRequest request);
ClassroomResponse updateClassroom(Long campusId, Long classroomId, ClassroomRequest request);
void deleteClassroom(Long campusId, Long classroomId);

ClassroomPhotoResponse addPhoto(Long campusId, Long classroomId, String photoUrl, String uploaderEmail);
void deletePhoto(Long campusId, Long classroomId, Long photoId);
```

**Lógica clave:**
- DS-10: en `update()` se valida que la sede exista y que los nuevos datos no violen constraints.
- `addPhoto()`: resolver `uploadedBy` a partir del email del usuario autenticado.
- En `deleteClassroom()` y `delete()`: verificar que no haya referencias activas (ej: `TimeBlock` con esa ubicación) antes de eliminar.

---

## Fase 4 — Funcionalidades del estudiante

### 13. `ScheduleService` — `schedule/service`

**Propósito:** Crear, leer, actualizar, archivar y eliminar horarios armados por el estudiante. Validación de cruces.
**Diagramas:** DS-01, DS-04

**Repositorios requeridos:**
- `ScheduleRepository`
- `ScheduleBlockRepository`
- `SubjectGroupRepository` (para validar grupos al agregar bloques)
- `AcademicOfferRepository` (para consultar oferta activa en lectura pública)

**DTOs de entrada:**

| DTO | Campos | Validaciones |
|---|---|---|
| `ScheduleRequest` | `name`, `semester`, `notes?`, `blocks: List<ScheduleBlockRequest>` | `@NotBlank`, `@NotEmpty` |
| `ScheduleBlockRequest` | `groupId?`, `subjectId?`, `color?`, `manual`, `manualLabel?`, `manualDay?`, `manualStartTime?`, `manualEndTime?` | Si `manual=true`: `manualDay`, `manualStartTime`, `manualEndTime` son requeridos |
| `ConflictCheckRequest` | `groupIds: List<Long>` | `@NotEmpty` |
| `ArchiveRequest` | `archived` | `@NotNull` |

**DTOs de salida:**

| DTO | Campos |
|---|---|
| `ScheduleResponse` | `id`, `name`, `semester`, `notes`, `totalCredits`, `archived`, `createdAt`, `blocks: List<ScheduleBlockResponse>` |
| `ScheduleBlockResponse` | `id`, `groupId`, `subjectId`, `color`, `manual`, `manualLabel`, `manualDay`, `manualStartTime`, `manualEndTime` |
| `SubjectSummaryResponse` | `id`, `codigo`, `nombre`, `grupos: List<GroupSummaryResponse>` |
| `GroupSummaryResponse` | `id`, `grupoCode`, `inscritos`, `docente`, `horarios: List<TimeBlockResponse>` |
| `TimeBlockResponse` | `dia`, `horaInicio`, `horaFin`, `ubicacion` |
| `ConflictCheckResponse` | `hasConflicts`, `conflicts: List<ConflictDetail>` |

**Métodos de la interfaz:**

```java
// Consulta pública de oferta (DS-01)
List<SubjectSummaryResponse> findAvailableSubjects(Long studyPlanId, String semester);
List<GroupSummaryResponse> findGroupsBySubject(Long subjectId);
ConflictCheckResponse checkConflicts(ConflictCheckRequest request);

// Gestión de horarios del estudiante (DS-04)
List<ScheduleResponse> findMySchedules(String userEmail);
ScheduleResponse findById(Long scheduleId, String userEmail);
ScheduleResponse create(ScheduleRequest request, String userEmail);
ScheduleResponse update(Long scheduleId, ScheduleRequest request, String userEmail);
void delete(Long scheduleId, String userEmail);
void setArchived(Long scheduleId, boolean archived, String userEmail);
```

**Lógica clave por método:**

| Método | Lógica |
|---|---|
| `findAvailableSubjects()` | DS-01/DS-04: busca materias de la `AcademicOffer` activa, opcionalmente filtradas por `studyPlanId`. |
| `checkConflicts()` | DS-01: para cada par de grupos en la lista, verificar si algún `TimeBlock` tiene el mismo `dia` y rangos de horas solapados. Retornar lista de conflictos con detalle. |
| `create()` | DS-04: resolver `userId` desde email → crear `Schedule` → crear `ScheduleBlock` por cada item. Recalcular `totalCredits` sumando créditos de los grupos referenciados en oferta activa. |
| `findById()` | Verificar que `schedule.userId == userId` del usuario autenticado → `NexoException.forbidden()` si no coincide. |
| `delete()` | Verificar ownership antes de eliminar. |

---

### 14. `ScheduleExportService` — `schedule/service`

**Propósito:** Generar el horario en formato descargable (PDF o imagen PNG).
**Diagramas:** DS-05

**Repositorios requeridos:**
- `ScheduleRepository`
- `ScheduleBlockRepository`

**DTOs de salida:**

| DTO | Campos |
|---|---|
| `ExportResult` | `byte[] content`, `String filename`, `String mimeType` |

**Métodos de la interfaz:**

```java
ExportResult exportAsPdf(Long scheduleId, String userEmail);
ExportResult exportAsImage(Long scheduleId, String userEmail);
```

**Lógica clave:**
- DS-05: verificar ownership del horario → cargar bloques → renderizar grilla de 5-6 columnas (L-V o L-S) × franjas horarias → serializar a PDF/PNG.
- Librería sugerida para PDF: **OpenPDF** (`com.github.librepdf:openpdf`). Para imagen: `java.awt.BufferedImage`.
- `ExportResult.filename` = `"horario_{id}_{nombre}.pdf"` / `".png"`.
- Agregar dependencia `openpdf` al pom.xml en el momento de implementar.

---

### 15. `StudyProgressService` — `academic/service`

**Propósito:** Registrar al estudiante en una carrera y hacer seguimiento del avance por materia.
**Diagramas:** Derivado de `UserAcademicProgress` + `UserSubjectProgress` (contexto DS-03, DS-04)

**Repositorios requeridos:**
- `UserAcademicProgressRepository`
- `UserSubjectProgressRepository`
- `CurriculumSubjectRepository`
- `StudyPlanRepository`
- `UserRepository`

**DTOs de entrada:**

| DTO | Campos | Validaciones |
|---|---|---|
| `EnrollRequest` | `studyPlanId` | `@NotNull` |
| `UpdateSubjectStatusRequest` | `status`, `grade?` | `@NotNull` enum `SubjectStatus`; `grade` solo si `APROBADA` |

**DTOs de salida:**

| DTO | Campos |
|---|---|
| `AcademicProgressResponse` | `id`, `studyPlan: StudyPlanResponse`, `enrolledAt`, `totalSubjects`, `approved`, `inProgress`, `pending` |
| `SubjectProgressResponse` | `id`, `curriculumSubject: CurriculumSubjectResponse`, `status`, `grade` |
| `ProgressSummaryResponse` | `totalCredits`, `approvedCredits`, `pendingCredits`, `percentage` |

**Métodos de la interfaz:**

```java
List<AcademicProgressResponse> findMyProgress(String userEmail);
void enroll(String userEmail, EnrollRequest request);
void unenroll(String userEmail, Long progressId);

List<SubjectProgressResponse> findSubjects(String userEmail, Long progressId);
SubjectProgressResponse updateSubjectStatus(String userEmail, Long progressId, Long subjectProgressId, UpdateSubjectStatusRequest request);

ProgressSummaryResponse getSummary(String userEmail, Long progressId);
```

**Lógica clave por método:**

| Método | Lógica |
|---|---|
| `enroll()` | 1. Verificar que el `StudyPlan` exista. 2. Verificar constraint único `(user, studyPlan)` → `NexoException.conflict()`. 3. Crear `UserAcademicProgress`. 4. Crear un `UserSubjectProgress(status=PENDIENTE)` por cada `CurriculumSubject` del plan. |
| `updateSubjectStatus()` | 1. Verificar ownership del `progressId`. 2. Si `status = APROBADA` y `grade` es nulo → `NexoException.badRequest()`. 3. Si `status != APROBADA` → limpiar `grade`. |
| `getSummary()` | Calcular: `approvedCredits = SUM(credits WHERE status=APROBADA)`, `totalCredits = SUM(credits)`, `percentage = approvedCredits / totalCredits * 100`. |

---

### 16. `ReportService` — `report/service`

**Propósito:** Crear y gestionar reportes de errores o inconsistencias enviados por estudiantes.
**Diagramas:** DS-07

**Repositorios requeridos:**
- `ReportRepository`
- `UserRepository` (para resolver `userId` desde email)

**DTOs de entrada:**

| DTO | Campos | Validaciones |
|---|---|---|
| `ReportRequest` | `reportType`, `description`, `evidenceUrl?` | `@NotNull` enum, `@NotBlank`, `@Size(max=2000)`, `@URL` si presente |
| `UpdateReportStatusRequest` | `status` | `@NotNull`, solo `EN_REVISION`, `RESUELTO`, `DESCARTADO` |

**DTOs de salida:**

| DTO | Campos |
|---|---|
| `ReportResponse` | `id`, `userId`, `reportType`, `description`, `evidenceUrl`, `status`, `createdAt`, `resolvedAt` |

**Métodos de la interfaz:**

```java
ReportResponse create(ReportRequest request, String userEmail);
List<ReportResponse> findMyReports(String userEmail);
List<ReportResponse> findAll(ReportStatus status, ReportType reportType);
ReportResponse findById(Long id);
ReportResponse updateStatus(Long id, UpdateReportStatusRequest request);
```

**Lógica clave por método:**

| Método | Lógica |
|---|---|
| `create()` | DS-07: resolver `userId` desde email → persistir `Report` con `status=PENDIENTE`. `createdAt` se asigna vía `@PrePersist`. |
| `updateStatus()` | Solo puede transicionar desde `PENDIENTE` hacia `EN_REVISION`, `RESUELTO` o `DESCARTADO`. Si pasa a `RESUELTO` o `DESCARTADO`, asignar `resolvedAt = LocalDateTime.now()`. |

---

## Resumen de services, repositorios y DTOs

| Service | Archivo | Repositorios que necesita | DTOs entrada | DTOs salida |
|---|---|---|---|---|
| `JwtService` | `shared/util/` | — | — | — |
| `EmailService` | `shared/util/` | — | — | — |
| `AuthService` | `auth/service/` | User, VerificationCode, Role | Register, VerifyCode, Email, Login, ResetPassword | LoginResponse |
| `UserService` | `user/service/` | User, VerificationCode | UpdateNickname, DeleteAccount, SetActive | UserProfile, UserSummary |
| `RoleService` | `user/service/` | Role, User | AssignRole | RoleResponse |
| `AcademicOfferService` | `academic/service/` | AcademicOffer, StudyPlan, Subject, SubjectGroup, TimeBlock | UploadOffer (MultipartFile) | AcademicOfferResponse, OfferUploadResult |
| `StudyPlanService` | `academic/service/` | StudyPlan, CurriculumSubject | — | StudyPlanResponse |
| `CurriculumSubjectService` | `academic/service/` | CurriculumSubject, StudyPlan | CurriculumSubjectRequest | CurriculumSubjectResponse |
| `AnnouncementService` | `content/service/` | Announcement, User | AnnouncementRequest | AnnouncementResponse |
| `CalendarEventService` | `content/service/` | CalendarEvent | CalendarEventRequest | CalendarEventResponse |
| `WelfareService` | `content/service/` | WelfareContent | WelfareRequest | WelfareResponse |
| `CampusService` | `campus/service/` | Campus, Classroom, ClassroomPhoto, User | CampusRequest, ClassroomRequest, ClassroomPhotoRequest | CampusResponse, CampusDetail, ClassroomResponse |
| `ScheduleService` | `schedule/service/` | Schedule, ScheduleBlock, SubjectGroup, AcademicOffer | ScheduleRequest, ConflictCheck, Archive | ScheduleResponse, SubjectSummary, ConflictCheck |
| `ScheduleExportService` | `schedule/service/` | Schedule, ScheduleBlock | — | ExportResult (byte[]) |
| `StudyProgressService` | `academic/service/` | UserAcademicProgress, UserSubjectProgress, CurriculumSubject, StudyPlan, User | EnrollRequest, UpdateSubjectStatus | AcademicProgress, SubjectProgress, ProgressSummary |
| `ReportService` | `report/service/` | Report, User | ReportRequest, UpdateReportStatus | ReportResponse |

**Total: 16 services · 29 repositorios · ~40 DTOs**

---

## Orden de implementación recomendado

```
Fase 0 — Infraestructura (sin dependencias)
├── NexoException + GlobalExceptionHandler  (shared/exception/)
├── JwtService                              (shared/util/)
└── EmailService                            (shared/util/)

Fase 1 — Fundación (depende de Fase 0)
├── UserRepository + AuthService            (auth + user)
├── RoleService                             (user)
└── UserService                             (user)

Fase 2 — Catálogo académico (depende de Fase 1)
├── AcademicOfferService                    (academic)
├── StudyPlanService                        (academic)
└── CurriculumSubjectService                (academic)

Fase 3 — Contenido informativo (depende de Fase 0, paralelo a Fase 2)
├── AnnouncementService                     (content)
├── CalendarEventService                    (content)
├── WelfareService                          (content)
└── CampusService                           (campus)

Fase 4 — Funcionalidades del estudiante (depende de Fases 1, 2 y 3)
├── ScheduleService                         (schedule)
├── ScheduleExportService                   (schedule)
├── StudyProgressService                    (academic)
└── ReportService                           (report)
```
