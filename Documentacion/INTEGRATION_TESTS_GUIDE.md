# Guía de Pruebas de Integración para NEXO-UD

Las pruebas de integración verifican que los distintos módulos de tu aplicación funcionen correctamente en conjunto (por ejemplo, que tu backend se conecte y consulte bien la base de datos, o que tu frontend renderice los componentes interactuando con las APIs).

En tu proyecto tienes dos ecosistemas distintos: el **Backend (Spring Boot + PostgreSQL)** y el **Frontend (React + Vite)**.

---

## 1. Pruebas de Integración en el Backend (Spring Boot)

Actualmente en el archivo `PLAN_TESTS_CONTROLLERS.md` tienes planeadas pruebas "slice" usando `@WebMvcTest` (que aíslan la capa web y mockean los servicios). Sin embargo, una **verdadera prueba de integración** levanta el contexto completo de Spring y se conecta a una base de datos real (o en memoria).

### A. Estrategia con `@SpringBootTest` y `Testcontainers` (Recomendada)
Esta es la mejor forma de asegurar que tus repositorios de Spring Data JPA y tus migraciones de Flyway funcionan en una base de datos PostgreSQL real levantada en Docker durante los tests.

**Paso 1: Agregar dependencias en `pom.xml`**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-testcontainers</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>junit-jupiter</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
```

**Paso 2: Crear el Test de Integración**
Usa `@SpringBootTest` (para cargar toda la app) y `@AutoConfigureMockMvc` (para hacer peticiones a la API).

```java
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
public class CampusIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    // Levanta un PostgreSQL en un contenedor Docker solo para los tests
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    // Configura Spring para que use el contenedor en lugar de tu DB local
    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        // Flyway se ejecutará automáticamente y creará las tablas
    }

    @Test
    void debeObtenerListaDeCampus() throws Exception {
        // Hace una petición HTTP real al controlador, pasa por el servicio, y consulta la DB de Testcontainers
        mockMvc.perform(get("/api/v1/campus"))
               .andExpect(status().isOk());
    }
}
```

---

## 2. Pruebas de Integración en el Frontend (React + Vite)

Para el frontend, la integración suele significar renderizar componentes complejos (como una página entera) e interactuar con ellos como lo haría un usuario, verificando el DOM. 

### A. Vitest + React Testing Library

**Paso 1: Instalar dependencias en la carpeta `nexo-frontend`**
En la terminal, dentro de `nexo-frontend`:
```bash
npm install -D vitest @testing-library/react @testing-library/dom @testing-library/jest-dom jsdom @testing-library/user-event
```

**Paso 2: Configurar `vite.config.ts` para Vitest**
Añade la configuración para tests:
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
// ... tus otros imports

export default defineConfig({
  // ... tu configuración existente
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTests.ts', // Archivo para cargar utilidades globales
  },
});
```

**Paso 3: Escribir el Test**
Se crea el archivo `LoginForm.integration.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router';
import LoginForm from './LoginForm'; // Ajusta la ruta

test('Muestra error al enviar formulario de login vacío', async () => {
    // 1. Renderizar el componente con su contexto (Router)
    render(
        <BrowserRouter>
            <LoginForm />
        </BrowserRouter>
    );

    // 2. Interactuar (hacer click en el botón)
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });
    await userEvent.click(submitButton);

    // 3. Afirmar (Assert): Verificar que aparecen los mensajes de validación
    expect(await screen.findByText(/el correo es requerido/i)).toBeInTheDocument();
});
```

---

## 3. Pruebas End-to-End (E2E) con Cypress o Playwright

Si lo que buscas es levantar el Frontend y el Backend al mismo tiempo y simular a un usuario entrando por el navegador (ej. abrir Chrome, escribir el correo, click en login, ver el campus), lo ideal es **Playwright** o **Cypress**.

Para instalar Playwright en el proyecto (en la raíz o en frontend):
```bash
npm init playwright@latest
```
Esto te permitirá escribir tests simulando flujos completos de usuario:
```javascript
import { test, expect } from '@playwright/test';

test('El estudiante puede iniciar sesión y ver su perfil', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'test@udistrital.edu.co');
  await page.fill('input[type="password"]', 'Contraseña1!');
  await page.click('button[type="submit"]');

  // Esperar a la redirección y verificar el dashboard
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.locator('text=Bienvenido')).toBeVisible();
});
```

---

### Resumen

- **Para Backend:** Usa **Spring Boot Test con Testcontainers** para asegurar que el código se conecta y consulta bien la base de datos real.
- **Para Frontend:** Usa **Vitest + React Testing Library** para asegurar que los componentes interactúen bien con el DOM.
- **Para Flujos Completos (Frontend conectado a Backend corriendo):** Usa **Playwright**.
