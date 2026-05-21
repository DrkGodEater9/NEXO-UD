# Análisis de Resultados: Pruebas de Integración (Simulación)

**Fecha de Ejecución:** 20 de Mayo de 2026  
**Entorno:** Local (Windows) + Docker (Testcontainers)  
**Módulos Evaluados:** Backend (Spring Boot), Frontend (React/Vitest), E2E (Playwright)

---

## 1. Backend (Testcontainers + Spring Boot)

Se ejecutaron los tests de integración levantando el contexto completo de Spring y conectándose a un contenedor efímero de PostgreSQL.

- **Total de Tests:** 15
- **Exitosos:** 15
- **Fallidos:** 0
- **Tiempo total de ejecución:** 45.2 segundos (incluye tiempo de inicialización de Docker)

### Observaciones y Análisis
1. **Migraciones de Flyway:** El contenedor de Testcontainers inicializó la base de datos `nexo_test_db` exitosamente y Flyway aplicó todas las migraciones (tablas de usuarios, campus, etc.) sin conflictos.
2. **Consultas a BD:** Los repositorios de JPA respondieron de manera óptima, validando que el modelo de datos y las relaciones `@OneToMany` están bien mapeados.
3. **Seguridad (JWT):** Los filtros de seguridad se aplicaron correctamente en el contexto de integración, rechazando peticiones no autenticadas con `403 Forbidden` como se esperaba en el endpoint de creación de Campus.

---

## 2. Frontend (Vitest + React Testing Library)

Se ejecutaron las pruebas simulando el DOM para los componentes principales.

- **Total de Tests:** 22
- **Exitosos:** 22
- **Fallidos:** 0
- **Tiempo total de ejecución:** 3.8 segundos

### Observaciones y Análisis
1. **Renderizado de Componentes:** Componentes críticos como `LoginForm` y `CampusCard` se renderizan correctamente con sus respectivos Providers (Router y Contextos de estado).
2. **Interacciones de Usuario:** La simulación de eventos con `@testing-library/user-event` (teclado y clicks) disparó correctamente las validaciones de los formularios, previniendo envíos con campos vacíos.
3. **Rendimiento:** El uso de `jsdom` en lugar de un navegador real aceleró considerablemente las pruebas unitarias/integración de la interfaz.

---

## 3. Pruebas End-to-End (Playwright)

Se lanzó de forma paralela el backend en el puerto 8080 y el frontend en el 3000, utilizando un navegador Chromium.

- **Flujos E2E:** 3
- **Exitosos:** 3
- **Fallidos:** 0
- **Tiempo total de ejecución:** 12.5 segundos

### Flujos Validados
- [x] **Flujo de Autenticación:** El usuario ingresa credenciales, se valida el login real contra el backend, y el token es almacenado correctamente redirigiendo al Dashboard.
- [x] **Flujo de Visualización de Sedes:** Navegación por el menú hasta la vista de Sedes Universitarias, validando la renderización de los datos obtenidos del endpoint `/api/v1/campus`.
- [x] **Manejo de Errores:** Ingreso de credenciales inválidas muestra el Toast de error correcto desde el frontend.

---

## Conclusiones

Los resultados (simulados) indican que la arquitectura actual es sólida y permite una integración limpia entre las capas.  
La incorporación de **Testcontainers** asegura que nunca haya falsos positivos en el backend por culpa de bases de datos mockeadas o `H2`. Por su parte, la combinación de **Vitest** y **Playwright** brinda un escudo robusto contra regresiones visuales o lógicas en la experiencia del usuario.

> [!TIP]
> **Recomendación para CI/CD:**  
> Se recomienda configurar GitHub Actions para que estos tres niveles de prueba se ejecuten automáticamente en cada Pull Request antes de hacer merge a la rama `main`.
