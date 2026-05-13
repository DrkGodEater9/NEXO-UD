# Plan de Implementación: Tests de Controllers

## Contexto técnico

- **Framework:** Spring Boot 3.5.x, Spring Security 6, JUnit 5, Mockito, MockMvc
- **Enfoque:** `@WebMvcTest` + mocks de servicios — **sin base de datos, sin Flyway**
- **Seguridad:** JWT stateless. Los tests usan `@WithMockUser` de `spring-security-test` o JWT mockeado vía `SecurityMockMvcRequestPostProcessors.jwt()`
- **Problema raíz de la mayoría de fallos:** `@WebMvcTest` carga solo la capa web, pero Spring Security intenta autoconfigurar; si no se provee el `JwtAuthFilter` o la `SecurityConfig` correctamente, falla el contexto. La solución es excluir o mockear esos beans.

---

## Estructura de archivos a crear

```
src/test/java/com/kumorai/nexo/
├── auth/controller/
│   └── AuthControllerTest.java
├── user/controller/
│   ├── UserControllerTest.java
│   └── RoleControllerTest.java
├── campus/controller/
│   └── CampusControllerTest.java
├── content/controller/
│   ├── AnnouncementControllerTest.java
│   ├── CalendarEventControllerTest.java
│   └── WelfareControllerTest.java
├── admin/controller/
│   └── AdminContentControllerTest.java
├── academic/controller/
│   ├── AcademicOfferControllerTest.java
│   ├── SemesterControllerTest.java
│   ├── StudyPlanPublicControllerTest.java
│   └── StudyProgressControllerTest.java
├── report/controller/
│   └── ReportControllerTest.java
└── schedule/controller/
    ├── SchedulePlannerControllerTest.java
    └── ScheduleExportControllerTest.java
```

---

## Configuración base obligatoria (evitar el 90% de los fallos)

### Problema 1: `@WebMvcTest` + Spring Security + JWT

`@WebMvcTest` carga `SecurityConfig` y `JwtAuthFilter`, los cuales requieren beans como `JwtService`, `UserDetailsService`, etc. Sin ellos, el contexto explota.

**Solución A — Excluir la SecurityConfig y reemplazarla por una permisiva:**

```java
// Crear SOLO PARA TESTS:
// src/test/java/com/kumorai/nexo/shared/config/TestSecurityConfig.java

@TestConfiguration
@EnableWebSecurity
@EnableMethodSecurity
public class TestSecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated());
        return http.build();
    }
}
```

**Solución B (recomendada, más simple) — usar `@WithMockUser` + desactivar la config real:**

En cada `@WebMvcTest` agregar:
```java
@WebMvcTest(
    controllers = MiController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
```

Esto desactiva Security completamente. Luego en métodos que necesiten autenticación usar `@WithMockUser`.

**Solución C (más realista) — mockear JwtAuthFilter con `@MockBean`:**

```java
@WebMvcTest(MiController.class)
class MiControllerTest {

    @MockBean private JwtAuthFilter jwtAuthFilter;   // evita que se inicialice
    @MockBean private JwtService jwtService;          // si SecurityConfig lo pide
    // ... mocks de servicios de negocio
}
```

### Problema 2: `@AuthenticationPrincipal String email`

Cuando el controller recibe `@AuthenticationPrincipal String email`, el principal del token MockMvc debe ser un `String`. Usar:

```java
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

mockMvc.perform(get("/api/v1/users/me")
    .with(jwt().jwt(jwt -> jwt.subject("test@udistrital.edu.co")))
)
```

Si se usa `excludeAutoConfiguration` (sin security), simplemente el email no llegará al método. En ese caso mockear el servicio directamente para que no falle al recibir `null`.

### Problema 3: Flyway / Base de datos en contexto de test

`@WebMvcTest` NO carga JPA ni Flyway por defecto (solo carga la capa web). No se necesita `application-test.properties` para esto. Si algún bean falla, es porque está mal anotado con `@Component` en lugar de `@Service`/`@Repository`.

### Problema 4: `ObjectMapper` para serializar el body

Usar el `ObjectMapper` inyectado por Spring para garantizar que el JSON sea consistente con la configuración de Jackson del proyecto:

```java
@Autowired private MockMvc mockMvc;
@Autowired private ObjectMapper objectMapper;

// En el test:
mockMvc.perform(post("/api/v1/auth/login")
    .contentType(MediaType.APPLICATION_JSON)
    .content(objectMapper.writeValueAsString(request)))
```

---

## Plantilla base de cada test

```java
@WebMvcTest(
    controllers = MiController.class,
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        SecurityFilterAutoConfiguration.class
    }
)
@DisplayName("MiController - Tests")
class MiControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private MiService miService;
    // otros @MockBean necesarios

    @Nested
    @DisplayName("GET /api/v1/recurso")
    class GetAll { ... }

    @Nested
    @DisplayName("POST /api/v1/recurso")
    class Create { ... }
}
```

---

## Tests por Controller

---

### 1. `AuthControllerTest`

**Archivo:** `auth/controller/AuthControllerTest.java`  
**Ruta base:** `POST /api/v1/auth/`  
**Dependencias mockeadas:** `AuthService`  
**Seguridad:** Todos los endpoints son públicos — se puede excluir Security.

| Método | Endpoint | Caso | HTTP esperado |
|--------|----------|------|---------------|
| POST | `/register` | Request válido → 202 Accepted | 202 |
| POST | `/register` | Email sin dominio `@udistrital.edu.co` → 400 | 400 |
| POST | `/register` | Body vacío → 400 | 400 |
| POST | `/verify-code` | Código correcto → 200 | 200 |
| POST | `/verify-code` | Body vacío → 400 | 400 |
| POST | `/resend-code` | Email válido → 200 | 200 |
| POST | `/login` | Credenciales correctas → 200 + body con token | 200 |
| POST | `/login` | Body sin email → 400 | 400 |
| POST | `/login` | Body sin password → 400 | 400 |
| POST | `/logout` | Cualquier request → 200 | 200 |
| POST | `/forgot-password` | Email válido → 200 | 200 |
| POST | `/reset-password` | Request válido → 200 | 200 |

```java
@WebMvcTest(
    controllers = AuthController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean AuthService authService;

    @Test void register_conDatosValidos_retorna202() throws Exception {
        // Arrange
        RegisterRequest req = new RegisterRequest(
            "test@udistrital.edu.co", "testuser", "Contraseña1!", "12345678901"
        );
        doNothing().when(authService).register(any());

        // Act & Assert
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isAccepted());
    }

    @Test void login_conCredencialesValidas_retornaToken() throws Exception {
        LoginRequest req = new LoginRequest("test@udistrital.edu.co", "pass");
        LoginResponse resp = new LoginResponse("jwt-token", "test@udistrital.edu.co",
                                               "apodo", List.of("ESTUDIANTE"));
        when(authService.login(any())).thenReturn(resp);

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("jwt-token"));
    }

    @Test void login_sinEmail_retorna400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"password\":\"pass\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test void logout_retorna200() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout"))
            .andExpect(status().isOk());
    }
}
```

---

### 2. `UserControllerTest`

**Archivo:** `user/controller/UserControllerTest.java`  
**Ruta base:** `/api/v1/users`  
**Dependencias mockeadas:** `UserService`  
**Seguridad:** Requiere autenticación. Usar `@WithMockUser` o jwt().

| Método | Endpoint | Caso | HTTP esperado |
|--------|----------|------|---------------|
| GET | `/me` | Usuario autenticado → 200 + perfil | 200 |
| POST | `/me/nickname/request-code` | Autenticado → 200 | 200 |
| PATCH | `/me/nickname` | Request válido → 200 | 200 |
| PATCH | `/me/nickname` | Body inválido → 400 | 400 |
| DELETE | `/me` | Rol ESTUDIANTE → 204 | 204 |
| DELETE | `/me` | Sin rol ESTUDIANTE → 403 | 403 |
| GET | `/{id}` | Rol ADMINISTRADOR → 200 | 200 |
| GET | `/{id}` | Sin rol ADMINISTRADOR → 403 | 403 |
| GET | `/search?email=` | Rol ADMINISTRADOR → 200 | 200 |

```java
@WebMvcTest(
    controllers = UserController.class,
    excludeAutoConfiguration = {SecurityAutoConfiguration.class, SecurityFilterAutoConfiguration.class}
)
class UserControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean UserService userService;

    @Test
    @WithMockUser(username = "test@udistrital.edu.co")
    void getMyProfile_autenticado_retorna200() throws Exception {
        UserProfileResponse perfil = new UserProfileResponse(1L, "test@udistrital.edu.co",
                                                              "apodo", true, List.of());
        when(userService.getMyProfile("test@udistrital.edu.co")).thenReturn(perfil);

        mockMvc.perform(get("/api/v1/users/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("test@udistrital.edu.co"));
    }

    @Test
    @WithMockUser(roles = "ESTUDIANTE")
    void deleteAccount_rolEstudiante_retorna204() throws Exception {
        doNothing().when(userService).deleteAccount(any(), any());

        mockMvc.perform(delete("/api/v1/users/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"password\":\"miPassword1!\",\"confirmation\":\"ELIMINAR\"}"))
            .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "ADMINISTRADOR")
    void getById_rolAdmin_retorna200() throws Exception {
        when(userService.getById(1L)).thenReturn(new UserProfileResponse(1L, "x@ud.edu.co",
                                                                          "nick", true, List.of()));
        mockMvc.perform(get("/api/v1/users/1"))
            .andExpect(status().isOk());
    }
}
```

---

### 3. `RoleControllerTest`

**Archivo:** `user/controller/RoleControllerTest.java`  
**Ruta base:** `/api/v1/admin/roles`  
**Dependencias mockeadas:** `RoleService`  
**Seguridad:** `@PreAuthorize("hasRole('ADMINISTRADOR')")` en clase completa.

| Método | Endpoint | Caso | HTTP esperado |
|--------|----------|------|---------------|
| GET | `/` | Rol ADMINISTRADOR → 200 + lista | 200 |
| GET | `/users/{userId}` | Rol ADMINISTRADOR → 200 | 200 |
| POST | `/users/{userId}` | Rol ADMINISTRADOR + body válido → 200 | 200 |
| POST | `/users/{userId}` | Body vacío → 400 | 400 |
| DELETE | `/users/{userId}/{roleId}` | Rol ADMINISTRADOR → 204 | 204 |

```java
// Patrón clave: como toda la clase requiere ADMINISTRADOR, probar con y sin ese rol
@Test
@WithMockUser(roles = "ADMINISTRADOR")
void getAllRoles_rolAdmin_retorna200() throws Exception {
    when(roleService.getAllRoleNames()).thenReturn(List.of("ESTUDIANTE", "ADMINISTRADOR"));
    mockMvc.perform(get("/api/v1/admin/roles"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0]").value("ESTUDIANTE"));
}

@Test
@WithMockUser(roles = "ESTUDIANTE")
void getAllRoles_sinPermisos_retorna403() throws Exception {
    mockMvc.perform(get("/api/v1/admin/roles"))
        .andExpect(status().isForbidden());
}
```

> **Nota:** Para que `@WithMockUser` active el `@PreAuthorize`, la `SecurityAutoConfiguration` NO debe estar excluida. En su lugar, usar `@MockBean JwtAuthFilter` y `@MockBean JwtService` para evitar que falle el contexto por dependencias de JWT.

---

### 4. `CampusControllerTest`

**Archivo:** `campus/controller/CampusControllerTest.java`  
**Ruta base:** `/api/v1/campus`  
**Dependencias mockeadas:** `CampusService`, `UserService`  
**Seguridad:** GET públicos; mutaciones requieren `RADICADOR_SEDES` o `ADMINISTRADOR`.

| Método | Endpoint | Caso | HTTP esperado |
|--------|----------|------|---------------|
| GET | `/` | Sin autenticación → 200 | 200 |
| GET | `/` | Con filtro `?faculty=INGENIERIA` → 200 | 200 |
| GET | `/{campusId}` | Existe → 200 | 200 |
| GET | `/{campusId}` | No existe → service lanza NexoException.notFound → 404 | 404 |
| POST | `/` | Rol autorizado + body válido → 200 | 200 |
| POST | `/` | Sin rol → 403 | 403 |
| PUT | `/{campusId}` | Rol autorizado → 200 | 200 |
| DELETE | `/{campusId}` | Rol autorizado → 204 | 204 |
| GET | `/{campusId}/classrooms` | Cualquier usuario → 200 | 200 |
| POST | `/{campusId}/classrooms` | Rol autorizado → 200 | 200 |
| DELETE | `/{campusId}/classrooms/{classroomId}` | Rol autorizado → 204 | 204 |
| POST | `/route` | HERE_API_KEY no configurada → 400 | 400 |

> **Nota especial para `/route`:** El controller hace llamadas HTTP reales a HERE API. En tests se debe mockear el valor de `${nexo.here.api-key}` como vacío para que lance `NexoException.badRequest`, evitando llamadas externas. Usar `@TestPropertySource(properties = "nexo.here.api-key=")` en el test.

> **Nota para `addPhoto`:** El endpoint recibe `MultipartFile`. Usar `MockMultipartFile` de MockMvc. Hay que mockear también `userService.getMyProfile(email).id()`.

---

### 5. `AnnouncementControllerTest`

**Archivo:** `content/controller/AnnouncementControllerTest.java`  
**Ruta base:** `/api/v1/announcements`  
**Dependencias mockeadas:** `AnnouncementService`, `UserService`

| Método | Endpoint | Caso | HTTP esperado |
|--------|----------|------|---------------|
| GET | `/` | Sin filtros → 200 + lista | 200 |
| GET | `/` | Con `?scope=GENERAL&type=ACADEMICO` → 200 | 200 |
| GET | `/{id}` | Existe → 200 | 200 |
| GET | `/{id}` | No existe → 404 | 404 |
| POST | `/` | Rol autorizado → 200 | 200 |
| POST | `/` | Sin rol → 403 | 403 |
| PUT | `/{id}` | Rol autorizado + body válido → 200 | 200 |
| DELETE | `/{id}` | Rol autorizado → 204 | 204 |

```java
@Test
void listAll_sinFiltros_retorna200() throws Exception {
    when(announcementService.listAll(null, null, null)).thenReturn(List.of());

    mockMvc.perform(get("/api/v1/announcements"))
        .andExpect(status().isOk())
        .andExpect(content().json("[]"));
}

@Test
@WithMockUser(roles = "RADICADOR_AVISOS")
void create_rolAutorizado_retorna200() throws Exception {
    AnnouncementRequest req = /* construir request */;
    AnnouncementResponse resp = /* respuesta mock */;
    when(userService.getMyProfile(any())).thenReturn(new UserProfileResponse(1L, ...));
    when(announcementService.create(any(), eq(1L))).thenReturn(resp);

    mockMvc.perform(post("/api/v1/announcements")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(req)))
        .andExpect(status().isOk());
}
```

---

### 6. `CalendarEventControllerTest`

**Archivo:** `content/controller/CalendarEventControllerTest.java`  
**Ruta base:** `/api/v1/calendar`  
**Dependencias mockeadas:** `CalendarEventService`, `UserService`

| Método | Endpoint | Caso | HTTP esperado |
|--------|----------|------|---------------|
| GET | `/` | Sin filtros → 200 | 200 |
| GET | `/` | Con `?from=2025-01-01&to=2025-12-31` → 200 | 200 |
| GET | `/` | `from` en formato inválido → 400 | 400 |
| GET | `/{id}` | Existe → 200 | 200 |
| POST | `/` | Rol `ADMINISTRADOR` → 200 | 200 |
| POST | `/` | Rol `RADICADOR_CALENDARIO` → 200 | 200 |
| POST | `/` | Sin rol → 403 | 403 |
| PUT | `/{id}` | Rol autorizado → 200 | 200 |
| DELETE | `/{id}` | Rol autorizado → 204 | 204 |

> **Nota:** Los parámetros `from` y `to` son `LocalDate` con `@DateTimeFormat(iso = DATE)`. MockMvc los pasa como strings `"2025-01-01"`.

---

### 7. `WelfareControllerTest`

**Archivo:** `content/controller/WelfareControllerTest.java`  
**Ruta base:** `/api/v1/welfare`  
**Dependencias mockeadas:** `WelfareService`, `UserService`

| Método | Endpoint | Caso | HTTP esperado |
|--------|----------|------|---------------|
| GET | `/` | Sin filtro → 200 | 200 |
| GET | `/` | Con `?category=SALUD` → 200 | 200 |
| GET | `/{id}` | Existe → 200 | 200 |
| POST | `/` | Rol `RADICADOR_BIENESTAR` → 200 | 200 |
| POST | `/` | Rol `ADMINISTRADOR` → 200 | 200 |
| PUT | `/{id}` | Rol autorizado → 200 | 200 |
| DELETE | `/{id}` | Rol autorizado → 204 | 204 |

---

### 8. `AdminContentControllerTest`

**Archivo:** `admin/controller/AdminContentControllerTest.java`  
**Ruta base:** `/api/v1/admin`  
**Dependencias mockeadas:** `UserService`, `CampusService`, `StudyPlanService`, `CurriculumSubjectService`  
**Seguridad:** Toda la clase requiere `ADMINISTRADOR`.

| Método | Endpoint | Caso | HTTP esperado |
|--------|----------|------|---------------|
| GET | `/users` | Rol admin → 200 + Page | 200 |
| GET | `/users` | Con `?email=test` → 200 | 200 |
| GET | `/users/{id}` | Rol admin → 200 | 200 |
| PATCH | `/users/{id}/status` | `active: true` → 200 | 200 |
| PATCH | `/users/{id}/status` | Body vacío → 400 | 400 |
| POST | `/campus` | Rol admin → 200 | 200 |
| DELETE | `/campus/{campusId}` | Rol admin → 204 | 204 |
| GET | `/study-plans` | Rol admin → 200 + lista | 200 |
| GET | `/study-plans/{planId}/curriculum` | Rol admin → 200 | 200 |
| POST | `/study-plans/{planId}/curriculum` | Rol admin → 200 | 200 |
| PUT | `/study-plans/{planId}/curriculum/{subjectId}` | Rol admin → 200 | 200 |
| DELETE | `/study-plans/{planId}/curriculum/{subjectId}` | Rol admin → 204 | 204 |
| GET | `/users` | Sin rol ADMINISTRADOR → 403 | 403 |

---

### 9. `AcademicOfferControllerTest`

**Archivo:** `academic/controller/AcademicOfferControllerTest.java`  
**Ruta base:** `/api/v1/admin/academic-offers`  
**Dependencias mockeadas:** `AcademicOfferService`, `UserService`  
**Seguridad:** Toda la clase requiere `ADMINISTRADOR`.

| Método | Endpoint | Caso | HTTP esperado |
|--------|----------|------|---------------|
| GET | `/` | Rol admin → 200 + lista | 200 |
| GET | `/active` | Existe oferta activa → 200 | 200 |
| GET | `/active` | No existe → service lanza 404 | 404 |
| POST | `/upload` | Archivo válido + semestre → 200 | 200 |
| POST | `/upload` | Sin archivo → 400 | 400 |
| PATCH | `/{offerId}/activate` | Rol admin → 200 | 200 |
| DELETE | `/{offerId}` | Rol admin → 204 | 204 |

> **Nota para `/upload`:** Usa `MockMultipartFile`. Ejemplo:
> ```java
> MockMultipartFile file = new MockMultipartFile("file", "oferta.xlsx",
>     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
>     new byte[]{1, 2, 3});
> mockMvc.perform(multipart("/api/v1/admin/academic-offers/upload")
>     .file(file)
>     .param("semester", "2025-1")
>     .with(user("admin@ud.edu.co").roles("ADMINISTRADOR")));
> ```

---

### 10. `SemesterControllerTest`

**Archivo:** `academic/controller/SemesterControllerTest.java`  
**Dependencias mockeadas:** `SemesterRepository`  
**Seguridad:** GET activo es público; admin endpoints requieren `ADMINISTRADOR`.

> **Nota crítica:** `SemesterController` inyecta `SemesterRepository` directamente (no un Service). En `@WebMvcTest` el repositorio NO se carga automáticamente — debe ser `@MockBean`.

| Método | Endpoint | Caso | HTTP esperado |
|--------|----------|------|---------------|
| GET | `/api/v1/semesters/active` | Existe semestre activo → 200 | 200 |
| GET | `/api/v1/semesters/active` | No existe → 204 No Content | 204 |
| GET | `/api/v1/admin/semesters` | Rol admin → 200 + lista | 200 |
| POST | `/api/v1/admin/semesters` | Nombre válido → 200 | 200 |
| POST | `/api/v1/admin/semesters` | Nombre duplicado → service lanza 400 | 400 |
| POST | `/api/v1/admin/semesters` | Body sin nombre → 400 | 400 |
| PATCH | `/api/v1/admin/semesters/{id}/activate` | Existe → 200 | 200 |
| PATCH | `/api/v1/admin/semesters/{id}/activate` | No existe → 404 | 404 |
| DELETE | `/api/v1/admin/semesters/{id}` | No activo → 204 | 204 |
| DELETE | `/api/v1/admin/semesters/{id}` | Activo → 400 | 400 |

```java
@MockBean SemesterRepository semesterRepository;

@Test void getActiveSemester_existeActivo_retorna200() throws Exception {
    Semester s = Semester.builder().id(1L).name("2025-1").active(true)
                         .createdAt(LocalDateTime.now()).build();
    when(semesterRepository.findByActiveTrue()).thenReturn(Optional.of(s));

    mockMvc.perform(get("/api/v1/semesters/active"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("2025-1"));
}

@Test void getActiveSemester_sinActivo_retorna204() throws Exception {
    when(semesterRepository.findByActiveTrue()).thenReturn(Optional.empty());

    mockMvc.perform(get("/api/v1/semesters/active"))
        .andExpect(status().isNoContent());
}
```

---

### 11. `StudyPlanPublicControllerTest`

**Archivo:** `academic/controller/StudyPlanPublicControllerTest.java`  
**Ruta base:** `/api/v1/study-plans`  
**Dependencias mockeadas:** `StudyPlanRepository`

> **Nota:** Igual que `SemesterController`, inyecta el repositorio directamente → `@MockBean StudyPlanRepository`.

| Método | Endpoint | Caso | HTTP esperado |
|--------|----------|------|---------------|
| GET | `/` | Sin autenticación → 200 + lista | 200 |
| GET | `/` | Lista vacía → 200 + `[]` | 200 |
| GET | `/` | Lista con planes → 200 + JSON correcto | 200 |

```java
@Test void listAll_retornaListaDePlanes() throws Exception {
    StudyPlan plan = /* mock */;
    when(studyPlanRepository.findAllOrderedByFacultyAndName())
        .thenReturn(List.of(plan));

    mockMvc.perform(get("/api/v1/study-plans"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].nombre").exists());
}
```

---

### 12. `StudyProgressControllerTest`

**Archivo:** `academic/controller/StudyProgressControllerTest.java`  
**Ruta base:** `/api/v1/progress`  
**Dependencias mockeadas:** `StudyProgressService`, `UserService`  
**Seguridad:** Toda la clase requiere `ESTUDIANTE`.

| Método | Endpoint | Caso | HTTP esperado |
|--------|----------|------|---------------|
| GET | `/` | Rol ESTUDIANTE → 200 + lista | 200 |
| GET | `/` | Sin rol → 403 | 403 |
| POST | `/` | Body con `studyPlanId` → 200 | 200 |
| POST | `/` | Body sin `studyPlanId` → service decide | — |
| DELETE | `/{progressId}` | Rol ESTUDIANTE → 204 | 204 |
| GET | `/{progressId}/subjects` | Rol ESTUDIANTE → 200 | 200 |
| PATCH | `/{progressId}/subjects/{subjectProgressId}` | Rol ESTUDIANTE → 200 | 200 |
| GET | `/{progressId}/summary` | Rol ESTUDIANTE → 200 | 200 |

---

### 13. `ReportControllerTest`

**Archivo:** `report/controller/ReportControllerTest.java`  
**Ruta base:** `/api/v1/reports`  
**Dependencias mockeadas:** `ReportService`, `UserService`

| Método | Endpoint | Caso | HTTP esperado |
|--------|----------|------|---------------|
| POST | `/` | Rol ESTUDIANTE → 200 | 200 |
| POST | `/` | Sin rol ESTUDIANTE → 403 | 403 |
| POST | `/` | Body inválido → 400 | 400 |
| GET | `/my` | Rol ESTUDIANTE → 200 + lista | 200 |
| GET | `/` | Rol ADMINISTRADOR → 200 + lista | 200 |
| GET | `/` | Sin rol ADMINISTRADOR → 403 | 403 |
| GET | `/` | Con `?status=PENDIENTE&reportType=BUG` → 200 | 200 |
| GET | `/{id}` | Rol ADMINISTRADOR + existe → 200 | 200 |
| PATCH | `/{id}/status` | Rol ADMINISTRADOR → 200 | 200 |
| PATCH | `/{id}/status` | Body vacío → 400 | 400 |

---

### 14. `SchedulePlannerControllerTest`

**Archivo:** `schedule/controller/SchedulePlannerControllerTest.java`  
**Ruta base:** `/api/v1/schedules`  
**Dependencias mockeadas:** `ScheduleService`, `AcademicOfferService`, `UserService`

| Método | Endpoint | Caso | HTTP esperado |
|--------|----------|------|---------------|
| GET | `/offer/subjects` | Sin autenticación → 200 + lista | 200 |
| GET | `/offer/subjects` | Con `?studyPlanId=1` → 200 | 200 |
| POST | `/validate-conflicts` | Body con groupIds → 200 + mapa | 200 |
| GET | `/` | Rol ESTUDIANTE → 200 + lista | 200 |
| GET | `/` | Sin rol → 403 | 403 |
| POST | `/` | Rol ESTUDIANTE + body válido → 200 | 200 |
| GET | `/{scheduleId}` | Rol ESTUDIANTE + existe → 200 | 200 |
| PUT | `/{scheduleId}` | Rol ESTUDIANTE → 200 | 200 |
| DELETE | `/{scheduleId}` | Rol ESTUDIANTE → 204 | 204 |
| PATCH | `/{scheduleId}/archive` | `archived: true` → 200 | 200 |

---

### 15. `ScheduleExportControllerTest`

**Archivo:** `schedule/controller/ScheduleExportControllerTest.java`  
**Ruta base:** `/api/v1/schedules/{scheduleId}/export`  
**Dependencias mockeadas:** `ScheduleExportService`, `UserService`  
**Seguridad:** Toda la clase requiere `ESTUDIANTE`.

| Método | Endpoint | Caso | HTTP esperado |
|--------|----------|------|---------------|
| GET | `/{scheduleId}/export/pdf` | Rol ESTUDIANTE → 200 + bytes PDF | 200 |
| GET | `/{scheduleId}/export/pdf` | Content-Type debe ser `application/pdf` | 200 |
| GET | `/{scheduleId}/export/pdf` | Content-Disposition incluye `attachment` | 200 |
| GET | `/{scheduleId}/export/image` | Rol ESTUDIANTE → 200 + bytes PNG | 200 |
| GET | `/{scheduleId}/export/pdf` | Sin rol → 403 | 403 |

```java
@Test
@WithMockUser(roles = "ESTUDIANTE")
void exportPdf_retornaPdf() throws Exception {
    when(userService.getMyProfile(any())).thenReturn(new UserProfileResponse(1L, ...));
    when(scheduleExportService.generatePdf(1L, 1L)).thenReturn(new byte[]{1, 2, 3});

    mockMvc.perform(get("/api/v1/schedules/1/export/pdf"))
        .andExpect(status().isOk())
        .andExpect(content().contentType(MediaType.APPLICATION_PDF))
        .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                                   containsString("attachment")));
}
```

---

## Manejo de excepciones en los tests

El controller devuelve 4xx solo si hay un `@ControllerAdvice` / `@ExceptionHandler` que traduce `NexoException` a respuestas HTTP. Hay que asegurarse de que ese handler sea cargado por el contexto de `@WebMvcTest`.

**Verificar que existe un `GlobalExceptionHandler`** en el paquete `shared/exception` o similar. Si existe, `@WebMvcTest` lo incluye automáticamente porque es un `@RestControllerAdvice`. Si no existe, los tests que esperan 404 en lugar de 500 fallarán.

Para testear que el GlobalExceptionHandler funciona:

```java
@Test void getById_noExiste_retorna404() throws Exception {
    when(campusService.getById(99L))
        .thenThrow(NexoException.notFound("Sede no encontrada"));

    mockMvc.perform(get("/api/v1/campus/99"))
        .andExpect(status().isNotFound());
}
```

---

## Orden de implementación recomendado

1. **Crear `TestSecurityConfig`** (o decidir estrategia de exclusión) — válido para todos los tests.
2. **`AuthControllerTest`** — más simple, todos los endpoints son públicos.
3. **`StudyPlanPublicControllerTest`** — solo un GET, ideal para validar la configuración.
4. **`SemesterControllerTest`** — valida el patrón de mockear repositorios directamente.
5. **`AnnouncementControllerTest`**, **`CalendarEventControllerTest`**, **`WelfareControllerTest`** — patrón idéntico entre sí.
6. **`UserControllerTest`**, **`RoleControllerTest`** — introducen tests de seguridad con roles.
7. **`CampusControllerTest`** — más complejo por multipart y route proxy.
8. **`AdminContentControllerTest`** — múltiples servicios mockeados.
9. **`AcademicOfferControllerTest`** — multipart upload.
10. **`StudyProgressControllerTest`**, **`ReportControllerTest`** — patrón estándar.
11. **`SchedulePlannerControllerTest`**, **`ScheduleExportControllerTest`** — más complejos por respuestas binarias.

---

## Imports estándar para todos los tests

```java
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
```

---

## Checklist final antes de ejecutar

- [ ] No hay `@SpringBootTest` en los tests de controller (usaría BD real y Flyway).
- [ ] Todos los `@MockBean` están declarados para cada dependencia del controller.
- [ ] Si el controller inyecta un repositorio directamente (SemesterController, StudyPlanPublicController), ese repositorio tiene `@MockBean`.
- [ ] Los tests de seguridad (403) están en la misma clase pero SIN excluir `SecurityAutoConfiguration`.
- [ ] Existe un `GlobalExceptionHandler` (`@RestControllerAdvice`) que mapea `NexoException` a HTTP → si no, los tests de 404/400 por excepción fallarán.
- [ ] `application-test.properties` con `spring.flyway.enabled=false` para evitar migraciones si algún test carga el contexto completo.
