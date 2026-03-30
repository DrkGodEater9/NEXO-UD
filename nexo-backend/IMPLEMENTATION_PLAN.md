# Plan de Implementación de Controllers — NexoUD Backend

Paquete base: `com.kumorai.nexo`
Convención de rutas: `/api/v1/{módulo}`
Seguridad: JWT Bearer Token (excepto endpoints marcados como `[PÚBLICO]`)

Fuentes: `ENTITIES.md` + Diagramas de Secuencia DS-01 a DS-13

---

## Índice

1. [AuthController](#1-authcontroller)
2. [UserController](#2-usercontroller)
3. [RoleController](#3-rolecontroller)
4. [SchedulePlannerController](#4-scheduleplannercontroller)
5. [ScheduleExportController](#5-scheduleexportcontroller)
6. [AcademicOfferController](#6-academicoffercontroller)
7. [StudyProgressController](#7-studyprogresscontroller)
8. [AnnouncementController](#8-announcementcontroller)
9. [CalendarEventController](#9-calendareventcontroller)
10. [WelfareController](#10-welfarecontroller)
11. [CampusController](#11-campuscontroller)
12. [ReportController](#12-reportcontroller)
13. [AdminContentController](#13-admincontentcontroller)

---

## Convenciones generales

| Elemento | Convención |
|---|---|
| Paquete | `com.kumorai.nexo.{módulo}.controller` |
| Anotación | `@RestController` + `@RequestMapping("/api/v1/...")` |
| Seguridad | `@PreAuthorize("hasRole('...')")` o `[PÚBLICO]` |
| Respuesta estándar | `ResponseEntity<T>` |
| Roles disponibles | `ADMINISTRADOR`, `ESTUDIANTE`, `RADICADOR_AVISOS`, `RADICADOR_BIENESTAR`, `RADICADOR_SEDES` |
| DS origen | Columna "Diagrama(s)" indica el DS que define el flujo |

---

## 1. `AuthController`

**Ruta:** `auth/controller/AuthController.java`
**Base URL:** `/api/v1/auth`
**Acceso:** `[PÚBLICO]` en todos sus endpoints
**Diagramas:** DS-02 (Registrarse)

### Endpoints

| Método | Ruta | Descripción | Body / Params |
|---|---|---|---|
| `POST` | `/register` | Inicia el registro: valida que el correo sea institucional (`@udistrital.edu.co`) y envía código de verificación | `{ email, nickname, password }` |
| `POST` | `/verify-code` | Verifica el código de 6 dígitos ingresado por el usuario | `{ email, code }` |
| `POST` | `/resend-code` | Reenvía un nuevo código de verificación al correo | `{ email }` |
| `POST` | `/login` | Autentica al usuario y devuelve el JWT | `{ email, password }` |
| `POST` | `/logout` | Invalida la sesión activa (blacklist de token) | Header: `Authorization` |
| `POST` | `/forgot-password` | Envía código de recuperación de contraseña | `{ email }` |
| `POST` | `/reset-password` | Restablece la contraseña tras verificar código | `{ email, code, newPassword }` |

### Notas de implementación
- DS-02 muestra flujos `alt` para: código incorrecto (hasta N intentos), reenvío, y código correcto.
- El campo `attempts` en `VerificationCode` controla el límite de intentos.
- `expiresAt` en `VerificationCode` define el TTL del código (ej: 10 min).
- Al completar `/verify-code` exitosamente, se activa el usuario (`active = true`).

---

## 2. `UserController`

**Ruta:** `user/controller/UserController.java`
**Base URL:** `/api/v1/users`
**Acceso:** `ESTUDIANTE` (perfil propio) + `ADMINISTRADOR` (gestión general)
**Diagramas:** DS-03 (Gestionar perfil), DS-11 (Gestionar permisos)

### Endpoints

| Método | Ruta | Descripción | Body / Params | Rol |
|---|---|---|---|---|
| `GET` | `/me` | Obtiene los datos del perfil del usuario autenticado | — | Cualquier rol autenticado |
| `PATCH` | `/me/nickname` | Actualiza el apodo del usuario (requiere verificación por código) | `{ newNickname, verificationCode }` | Cualquier rol autenticado |
| `DELETE` | `/me` | Elimina la cuenta del usuario autenticado | `{ password }` (confirmación) | `ESTUDIANTE` |
| `GET` | `/{id}` | Obtiene datos de un usuario por ID | Path: `id` | `ADMINISTRADOR` |
| `GET` | `/search` | Busca un usuario por correo electrónico | Query: `email` | `ADMINISTRADOR` |

### Notas de implementación
- DS-03 define flujos `alt` para: código incorrecto (N intentos), código correcto → confirmar actualización, y eliminación de cuenta con confirmación.
- `PATCH /me/nickname` debe primero solicitar un código de verificación al correo antes de aplicar el cambio. Considerar un endpoint previo `POST /me/nickname/request-code`.
- La eliminación de cuenta (`DELETE /me`) debe hacer soft-delete (`active = false`) antes de eliminar físicamente.

---

## 3. `RoleController`

**Ruta:** `user/controller/RoleController.java`
**Base URL:** `/api/v1/admin/roles`
**Acceso:** `ADMINISTRADOR`
**Diagramas:** DS-11 (Gestionar permisos de usuarios)

### Endpoints

| Método | Ruta | Descripción | Body / Params |
|---|---|---|---|
| `GET` | `/` | Lista todos los roles disponibles del sistema | — |
| `GET` | `/users/{userId}` | Obtiene los roles asignados a un usuario | Path: `userId` |
| `POST` | `/users/{userId}` | Asigna un rol a un usuario | `{ roleName }` |
| `DELETE` | `/users/{userId}/{roleId}` | Revoca un rol específico de un usuario | Path: `userId`, `roleId` |

### Notas de implementación
- DS-11 muestra flujos `alt` para: confirmar asignación, confirmar revisión/actualización, error de establecimiento de permisos, y cambio exitoso.
- No permitir revocar el rol `ESTUDIANTE` si es el único rol del usuario.
- Registrar `assignedBy` con el ID del administrador que realiza la acción.

---

## 4. `SchedulePlannerController`

**Ruta:** `schedule/controller/SchedulePlannerController.java`
**Base URL:** `/api/v1/schedules`
**Acceso:** `[PÚBLICO]` para consulta de oferta; `ESTUDIANTE` para guardar horarios
**Diagramas:** DS-01 (Planificador sin sesión), DS-04 (Planear horario)

### Endpoints

| Método | Ruta | Descripción | Body / Params | Rol |
|---|---|---|---|---|
| `GET` | `/offer/subjects` | Lista las materias de la oferta activa (con grupos y horarios) | Query: `studyPlanId?`, `semester?` | `[PÚBLICO]` |
| `GET` | `/offer/subjects/{subjectId}/groups` | Obtiene los grupos disponibles de una materia | Path: `subjectId` | `[PÚBLICO]` |
| `POST` | `/validate-conflicts` | Verifica si un conjunto de bloques horarios tiene cruces | `{ groupIds: [] }` | `[PÚBLICO]` |
| `GET` | `/` | Lista los horarios guardados del usuario autenticado | — | `ESTUDIANTE` |
| `POST` | `/` | Crea y guarda un nuevo horario | `{ name, semester, blocks: [{groupId?, subjectId?, color?, manual?, manualLabel?, manualDay?, manualStartTime?, manualEndTime?}] }` | `ESTUDIANTE` |
| `GET` | `/{scheduleId}` | Obtiene un horario guardado por ID | Path: `scheduleId` | `ESTUDIANTE` |
| `PUT` | `/{scheduleId}` | Actualiza un horario existente | Mismo body que `POST /` | `ESTUDIANTE` |
| `DELETE` | `/{scheduleId}` | Elimina un horario | Path: `scheduleId` | `ESTUDIANTE` |
| `PATCH` | `/{scheduleId}/archive` | Archiva o desarchiva un horario | `{ archived: boolean }` | `ESTUDIANTE` |

### Notas de implementación
- DS-01 describe verificación de cruces de horarios para usuarios sin sesión (también aplica a usuarios con sesión en DS-04).
- DS-04 detalla el flujo de creación con validación de disponibilidad de salones, conflictos de programas y asignación de bloques.
- `GET /offer/subjects` debe retornar la `AcademicOffer` marcada como `active = true`.
- La validación de cruces en `POST /validate-conflicts` debe verificar que no existan dos `TimeBlock` con el mismo `dia` y rango de `horaInicio`-`horaFin` superpuesto.

---

## 5. `ScheduleExportController`

**Ruta:** `schedule/controller/ScheduleExportController.java`
**Base URL:** `/api/v1/schedules/{scheduleId}/export`
**Acceso:** `ESTUDIANTE`
**Diagramas:** DS-05 (Exportar horario)

### Endpoints

| Método | Ruta | Descripción | Body / Params |
|---|---|---|---|
| `GET` | `/pdf` | Genera y descarga el horario en formato PDF | Path: `scheduleId`; Header: `Accept: application/pdf` |
| `GET` | `/image` | Genera y descarga el horario como imagen PNG | Path: `scheduleId`; Header: `Accept: image/png` |

### Notas de implementación
- DS-05 muestra opciones: PDF, imagen e impresión. La impresión se maneja en el frontend.
- Respuesta debe incluir header `Content-Disposition: attachment; filename="horario_{id}.pdf"`.
- Librería sugerida: **iText** o **OpenPDF** para PDF; **AWT/BufferedImage** o **JFreeChart** para imagen.
- Verificar que el `scheduleId` pertenece al usuario autenticado antes de generar.

---

## 6. `AcademicOfferController`

**Ruta:** `academic/controller/AcademicOfferController.java`
**Base URL:** `/api/v1/admin/academic-offers`
**Acceso:** `ADMINISTRADOR`
**Diagramas:** DS-12 (Cargar oferta académica)

### Endpoints

| Método | Ruta | Descripción | Body / Params |
|---|---|---|---|
| `GET` | `/` | Lista todas las ofertas académicas cargadas | — |
| `GET` | `/active` | Obtiene la oferta académica activa actualmente | — |
| `POST` | `/upload` | Carga un nuevo JSON de oferta académica generado por el extractor Python | `multipart/form-data: { file: data.json, semester: "2026-1" }` |
| `PATCH` | `/{offerId}/activate` | Activa una oferta (desactiva las demás automáticamente) | Path: `offerId` |
| `DELETE` | `/{offerId}` | Elimina una oferta académica y sus datos asociados | Path: `offerId` |

### Notas de implementación
- DS-12 describe el flujo de carga desde archivo con validación por columnas/filas, procesamiento iterativo de registros y confirmación por entidad (`Subject`, `SubjectGroup`, `TimeBlock`).
- `POST /upload` debe parsear el `data.json` del extractor Python y poblar: `StudyPlan` → `Subject` → `SubjectGroup` → `TimeBlock`.
- Activar una oferta debe ejecutarse en una transacción que primero ponga `active = false` en todas las demás.
- Retornar estadísticas del proceso: `{ facultades, carreras, materias, grupos, horarios, warnings }`.

---

## 7. `StudyProgressController`

**Ruta:** `academic/controller/StudyProgressController.java`
*(o podría ubicarse en `user/controller/`)*
**Base URL:** `/api/v1/progress`
**Acceso:** `ESTUDIANTE`
**Diagramas:** Derivado de las entidades `UserAcademicProgress` + `UserSubjectProgress` (no hay DS específico, pero el contexto del DS-03 y DS-04 lo implican)

### Endpoints

| Método | Ruta | Descripción | Body / Params |
|---|---|---|---|
| `GET` | `/` | Lista los registros de avance académico del usuario (puede haber más de uno por doble titulación) | — |
| `POST` | `/` | Registra al usuario en una carrera (crea `UserAcademicProgress` y genera todos los `UserSubjectProgress` en `PENDIENTE`) | `{ studyPlanId }` |
| `DELETE` | `/{progressId}` | Desvincula al usuario de una carrera | Path: `progressId` |
| `GET` | `/{progressId}/subjects` | Lista todas las materias con su estado para un avance académico | Path: `progressId` |
| `PATCH` | `/{progressId}/subjects/{subjectProgressId}` | Actualiza el estado de una materia (`PENDIENTE` → `CURSANDO` → `APROBADA`) y su calificación | `{ status, grade? }` |
| `GET` | `/{progressId}/summary` | Resumen del avance: créditos aprobados, pendientes, porcentaje de avance | Path: `progressId` |

### Notas de implementación
- `POST /` debe generar automáticamente un `UserSubjectProgress` por cada `CurriculumSubject` del plan, con `status = PENDIENTE`.
- `GET /{progressId}/summary` debe calcular: `creditosAprobados = SUM(credits WHERE status = APROBADA)`, `totalCreditos = SUM(credits)`, `porcentaje = creditosAprobados / totalCreditos * 100`.
- `grade` solo debe persistirse cuando `status = APROBADA`.
- Verificar que `progressId` pertenece al usuario autenticado.

---

## 8. `AnnouncementController`

**Ruta:** `content/controller/AnnouncementController.java`
**Base URL:** `/api/v1/announcements`
**Acceso:** Consulta pública; CRUD para `RADICADOR_AVISOS`
**Diagramas:** DS-08 (Gestionar avisos), DS-06 (Consultar información general)

### Endpoints

| Método | Ruta | Descripción | Body / Params | Rol |
|---|---|---|---|---|
| `GET` | `/` | Lista todos los avisos activos, opcionalmente filtrados | Query: `scope?`, `type?`, `faculty?` | `[PÚBLICO]` |
| `GET` | `/{id}` | Obtiene el detalle de un aviso | Path: `id` | `[PÚBLICO]` |
| `POST` | `/` | Crea un nuevo aviso | `{ title, body, scope, type, faculty? }` | `RADICADOR_AVISOS` |
| `PUT` | `/{id}` | Actualiza un aviso existente | `{ title, body, scope, type, faculty? }` | `RADICADOR_AVISOS` |
| `DELETE` | `/{id}` | Elimina un aviso | Path: `id` | `RADICADOR_AVISOS` + `ADMINISTRADOR` |

### Notas de implementación
- DS-08 define el flujo completo: listar → crear con validación → confirmar; y el flujo alterno de editar → actualizar → confirmar.
- `createdBy` se asigna automáticamente desde el token JWT del radicador.
- Si `scope = FACULTAD`, el campo `faculty` es obligatorio.
- Registrar `updatedAt` automáticamente en cada `PUT`.

---

## 9. `CalendarEventController`

**Ruta:** `content/controller/CalendarEventController.java`
**Base URL:** `/api/v1/calendar`
**Acceso:** Consulta pública; CRUD para `ADMINISTRADOR`
**Diagramas:** DS-06 (Consultar información general — categoría "Calendario"), DS-13 (Gestionar contenido)

### Endpoints

| Método | Ruta | Descripción | Body / Params | Rol |
|---|---|---|---|---|
| `GET` | `/` | Lista los eventos del calendario, opcionalmente por rango de fechas | Query: `from?`, `to?`, `eventType?` | `[PÚBLICO]` |
| `GET` | `/{id}` | Obtiene el detalle de un evento | Path: `id` | `[PÚBLICO]` |
| `POST` | `/` | Crea un nuevo evento de calendario | `{ title, description?, eventType, startDate, endDate? }` | `ADMINISTRADOR` |
| `PUT` | `/{id}` | Actualiza un evento | Mismo body que `POST /` | `ADMINISTRADOR` |
| `DELETE` | `/{id}` | Elimina un evento | Path: `id` | `ADMINISTRADOR` |

### Notas de implementación
- DS-06 describe el fragmento `alt: Categoria es "Calendario"` que consulta el calendario general y por periodo bimestral.
- DS-13 describe la gestión desde el panel de administrador con selección por sección/criterio.
- `createdBy` se asigna automáticamente desde el JWT.

---

## 10. `WelfareController`

**Ruta:** `content/controller/WelfareController.java`
**Base URL:** `/api/v1/welfare`
**Acceso:** Consulta pública; CRUD para `RADICADOR_BIENESTAR`
**Diagramas:** DS-06 (Consultar información general — categoría "Bimestral"), DS-09 (Gestionar contenido bimestral)

### Endpoints

| Método | Ruta | Descripción | Body / Params | Rol |
|---|---|---|---|---|
| `GET` | `/` | Lista el contenido de bienestar, opcionalmente por categoría | Query: `category?` | `[PÚBLICO]` |
| `GET` | `/{id}` | Obtiene el detalle de un contenido de bienestar | Path: `id` | `[PÚBLICO]` |
| `POST` | `/` | Crea nuevo contenido de bienestar | `{ title, description, category, links? }` | `RADICADOR_BIENESTAR` |
| `PUT` | `/{id}` | Actualiza contenido de bienestar | Mismo body que `POST /` | `RADICADOR_BIENESTAR` |
| `DELETE` | `/{id}` | Elimina contenido de bienestar | Path: `id` | `RADICADOR_BIENESTAR` + `ADMINISTRADOR` |

### Notas de implementación
- DS-09 describe la gestión bimestral de contenido (estructura similar a DS-08 para avisos).
- `createdBy` y `updatedAt` se asignan automáticamente.
- Filtro por `category` mapea directamente al enum `WelfareCategory`.

---

## 11. `CampusController`

**Ruta:** `campus/controller/CampusController.java`
**Base URL:** `/api/v1/campus`
**Acceso:** Consulta pública; escritura para `RADICADOR_SEDES` + `ADMINISTRADOR`
**Diagramas:** DS-06 (Consultar información general — categoría "Sede"), DS-10 (Gestionar información de sedes)

### Endpoints

#### Campus

| Método | Ruta | Descripción | Body / Params | Rol |
|---|---|---|---|---|
| `GET` | `/` | Lista todas las sedes | Query: `faculty?` | `[PÚBLICO]` |
| `GET` | `/{campusId}` | Obtiene el detalle de una sede con sus aulas | Path: `campusId` | `[PÚBLICO]` |
| `PUT` | `/{campusId}` | Actualiza los datos generales de una sede (nombre, dirección, coordenadas, mapa) | `{ name, address?, faculty, latitude?, longitude?, mapUrl? }` | `RADICADOR_SEDES` |

#### Classrooms

| Método | Ruta | Descripción | Body / Params | Rol |
|---|---|---|---|---|
| `GET` | `/{campusId}/classrooms` | Lista las aulas de una sede | Path: `campusId` | `[PÚBLICO]` |
| `POST` | `/{campusId}/classrooms` | Agrega un aula a una sede | `{ name, building?, floor?, isLab }` | `RADICADOR_SEDES` |
| `PUT` | `/{campusId}/classrooms/{classroomId}` | Actualiza datos de un aula | Mismo body que `POST` | `RADICADOR_SEDES` |
| `DELETE` | `/{campusId}/classrooms/{classroomId}` | Elimina un aula | Path: `campusId`, `classroomId` | `RADICADOR_SEDES` + `ADMINISTRADOR` |

#### Classroom Photos

| Método | Ruta | Descripción | Body / Params | Rol |
|---|---|---|---|---|
| `POST` | `/{campusId}/classrooms/{classroomId}/photos` | Sube una foto de un aula | `multipart/form-data: { photo: File }` | `RADICADOR_SEDES` |
| `DELETE` | `/{campusId}/classrooms/{classroomId}/photos/{photoId}` | Elimina una foto de un aula | Path: `campusId`, `classroomId`, `photoId` | `RADICADOR_SEDES` + `ADMINISTRADOR` |

### Notas de implementación
- DS-10 describe: consultar sede → llenar formulario con datos completos (sede, ubicación, nuevos salones) → actualizar → confirmar.
- DS-06 (categoría "Sede") describe la consulta de detalle por sede con `informarDetalleCoveredxSede(idSede)`.
- La creación de nuevas sedes se realiza solo desde el panel `ADMINISTRADOR` en `AdminContentController`.
- `uploadedBy` en `ClassroomPhoto` se asigna desde el JWT.
- Para el upload de fotos, almacenar la URL resultante en `photoUrl` (integración con servicio de almacenamiento externo o carpeta local).

---

## 12. `ReportController`

**Ruta:** `report/controller/ReportController.java`
**Base URL:** `/api/v1/reports`
**Acceso:** `ESTUDIANTE` para crear; `ADMINISTRADOR` para gestionar
**Diagramas:** DS-07 (Reportar error o inconsistencia)

### Endpoints

| Método | Ruta | Descripción | Body / Params | Rol |
|---|---|---|---|---|
| `POST` | `/` | Crea un nuevo reporte de error o inconsistencia | `{ reportType, description, evidenceUrl? }` | `ESTUDIANTE` |
| `GET` | `/my` | Lista los reportes enviados por el usuario autenticado | — | `ESTUDIANTE` |
| `GET` | `/` | Lista todos los reportes (panel administrador) | Query: `status?`, `reportType?` | `ADMINISTRADOR` |
| `GET` | `/{id}` | Obtiene el detalle de un reporte | Path: `id` | `ADMINISTRADOR` |
| `PATCH` | `/{id}/status` | Actualiza el estado de un reporte | `{ status: EN_REVISION | RESUELTO | DESCARTADO }` | `ADMINISTRADOR` |

### Notas de implementación
- DS-07 muestra: acceder módulo → preparar formulario → seleccionar tipo, descripción y evidencia → enviar → validar → confirmar.
- `userId` y `createdAt` se asignan automáticamente desde el JWT y `@PrePersist`.
- `resolvedAt` se debe asignar automáticamente cuando `status` pase a `RESUELTO` o `DESCARTADO`.
- El campo `evidenceUrl` puede apuntar a una imagen subida previamente o a una URL externa.

---

## 13. `AdminContentController`

**Ruta:** `admin/controller/AdminContentController.java`
**Base URL:** `/api/v1/admin`
**Acceso:** `ADMINISTRADOR`
**Diagramas:** DS-11, DS-12, DS-13 (todos los flujos de administrador)

### Endpoints

#### Gestión de Usuarios

| Método | Ruta | Descripción | Body / Params |
|---|---|---|---|
| `GET` | `/users` | Lista todos los usuarios con paginación | Query: `page`, `size`, `email?` |
| `GET` | `/users/{id}` | Obtiene datos completos de un usuario | Path: `id` |
| `PATCH` | `/users/{id}/status` | Activa o desactiva una cuenta de usuario | `{ active: boolean }` |

#### Gestión de Sedes (crear / eliminar)

| Método | Ruta | Descripción | Body / Params |
|---|---|---|---|
| `POST` | `/campus` | Crea una nueva sede | `{ name, address?, faculty, latitude?, longitude?, mapUrl? }` |
| `DELETE` | `/campus/{campusId}` | Elimina una sede y sus aulas | Path: `campusId` |

#### Gestión de Planes de Estudio y Materias Curriculares

| Método | Ruta | Descripción | Body / Params |
|---|---|---|---|
| `GET` | `/study-plans` | Lista todos los planes de estudio | — |
| `GET` | `/study-plans/{planId}/curriculum` | Lista las materias curriculares de un plan | Path: `planId` |
| `POST` | `/study-plans/{planId}/curriculum` | Agrega una materia curricular a un plan | `{ codigo, nombre, credits, semester? }` |
| `PUT` | `/study-plans/{planId}/curriculum/{subjectId}` | Actualiza una materia curricular | Mismo body que `POST` |
| `DELETE` | `/study-plans/{planId}/curriculum/{subjectId}` | Elimina una materia curricular | Path: `planId`, `subjectId` |

### Notas de implementación
- DS-13 describe la gestión del contenido general desde el panel de administrador con categorías: años, semestral, fechas y criterio general.
- DS-11 (permisos de usuarios) se atiende principalmente desde `RoleController`; este controlador agrega la vista administrativa de usuarios.
- Las operaciones de campus aquí son de nivel administrativo (crear/borrar sede); las actualizaciones las hace el `RADICADOR_SEDES` desde `CampusController`.

---

## Resumen de controllers y roles de acceso

| Controller | Archivo | Roles |
|---|---|---|
| `AuthController` | `auth/controller/` | `[PÚBLICO]` |
| `UserController` | `user/controller/` | Autenticado / `ADMINISTRADOR` |
| `RoleController` | `user/controller/` | `ADMINISTRADOR` |
| `SchedulePlannerController` | `schedule/controller/` | `[PÚBLICO]` + `ESTUDIANTE` |
| `ScheduleExportController` | `schedule/controller/` | `ESTUDIANTE` |
| `AcademicOfferController` | `academic/controller/` | `ADMINISTRADOR` |
| `StudyProgressController` | `academic/controller/` | `ESTUDIANTE` |
| `AnnouncementController` | `content/controller/` | `[PÚBLICO]` + `RADICADOR_AVISOS` |
| `CalendarEventController` | `content/controller/` | `[PÚBLICO]` + `ADMINISTRADOR` |
| `WelfareController` | `content/controller/` | `[PÚBLICO]` + `RADICADOR_BIENESTAR` |
| `CampusController` | `campus/controller/` | `[PÚBLICO]` + `RADICADOR_SEDES` |
| `ReportController` | `report/controller/` | `ESTUDIANTE` + `ADMINISTRADOR` |
| `AdminContentController` | `admin/controller/` | `ADMINISTRADOR` |

**Total: 13 controllers · ~60 endpoints**

---

## Orden de implementación recomendado

El orden está determinado por dependencias entre controllers (un controller no debe implementarse antes que las entidades que referencia estén funcionales).

```
Fase 1 — Fundación (sin dependencias entre sí)
├── AuthController          (registro + login + JWT)
├── UserController          (perfil)
└── RoleController          (permisos)

Fase 2 — Catálogo académico (depende de Fase 1)
├── AcademicOfferController (carga del JSON del extractor Python)
└── AdminContentController  (gestión de planes curriculares + sedes base)

Fase 3 — Contenido informativo (depende de Fase 1)
├── CampusController        (sedes y aulas)
├── AnnouncementController  (avisos)
├── CalendarEventController (calendario)
└── WelfareController       (bienestar)

Fase 4 — Funcionalidades del estudiante (depende de Fases 1, 2 y 3)
├── SchedulePlannerController  (armar horario)
├── ScheduleExportController   (exportar horario)
├── StudyProgressController    (avance académico)
└── ReportController           (reportes)
```
