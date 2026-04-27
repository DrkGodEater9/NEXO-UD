# SPRINT FINAL — NEXO UD | 6 ABR → 21 MAY 2026 | Semanas 15 → 21

> **Leyenda:** `██` = completado | `▒▒` = parcial/en progreso | `░░` = pendiente | `--` = fuera de rango

---

## BACKEND – Seguridad · Tomás G.

| RF / RNF | TAREA / MÓDULO | S15 · 06–12 Abr | S16 · 13–19 Abr | S17 · 20–26 Abr | S18 · 27Abr–3May | S19 · 4–10 May | S20 · 11–17 May | S21 · 18–21 May |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| RF-07 / RNF-07 | Auditoría endpoints: revisar tipos HTTP, status codes y contratos REST | `▒▒` | -- | -- | -- | -- | -- | -- |
| RNF-01 | Rate limiting: límite de llamadas por usuario/IP (throttling) | `░░` | -- | -- | -- | -- | -- | -- |
| RNF-07 | Validación HTTPS obligatorio + CORS configurado por entorno | `▒▒` | -- | -- | -- | -- | -- | -- |
| RF-56 | Protección SQL injection + sanitización inputs en todos los controladores | `▒▒` | `▒▒` | -- | -- | -- | -- | -- |
| RF-57 / RF-58 | Logs de seguridad administrativos + backup automático BD | -- | `░░` | `░░` | -- | -- | -- | -- |
| RNF-02 | Landing fallback sin login (caída backend) | `██` | -- | -- | -- | -- | -- | -- |

**Estado general Backend-Seguridad:** 1 completo · 3 parciales · 2 pendientes

---

## FRONTEND – Auth · Carlos B.

| RF / RNF | TAREA / MÓDULO | S15 · 06–12 Abr | S16 · 13–19 Abr | S17 · 20–26 Abr | S18 · 27Abr–3May | S19 · 4–10 May | S20 · 11–17 May | S21 · 18–21 May |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| RF-01 / RF-02 | Pantalla Registro: form correo @udistrital + validación OTP | `██` | `██` | -- | -- | -- | -- | -- |
| RF-07 | Pantalla Login / Recuperación + gestión token sesión | -- | `██` | -- | -- | -- | -- | -- |
| RF-03 / RF-06 | Perfil usuario: editar apodo, eliminar cuenta (Habeas Data) | -- | `██` | `██` | -- | -- | -- | -- |
| RF-10 / RF-59~60 | Términos y condiciones en flujo de registro | -- | -- | `▒▒` | `▒▒` | -- | -- | -- |

**Estado general Frontend-Auth:** 3 completos · 1 parcial · 0 pendientes

---

## FRONTEND – Planeador · Carlos B.

| RF / RNF | TAREA / MÓDULO | S15 · 06–12 Abr | S16 · 13–19 Abr | S17 · 20–26 Abr | S18 · 27Abr–3May | S19 · 4–10 May | S20 · 11–17 May | S21 · 18–21 May |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| RF-36 | Vista semanal 7 días: bloques de asignatura con colores personalizados | -- | -- | `██` | `██` | -- | -- | -- |
| RF-39 | Buscador asignaturas por palabra clave + filtro por sede | -- | -- | `▒▒` | `▒▒` | -- | -- | -- |
| RF-25 / RF-40 | Barra progreso créditos + validación visual ≤21 créditos | -- | -- | -- | `██` | `██` | -- | -- |
| RF-42 / RF-43 | Export PDF / imagen + impresión carta horizontal | -- | -- | -- | `██` | `██` | -- | -- |

**Estado general Frontend-Planeador:** 3 completos · 1 parcial · 0 pendientes

---

## FRONTEND – Info · Carlos B.

| RF / RNF | TAREA / MÓDULO | S15 · 06–12 Abr | S16 · 13–19 Abr | S17 · 20–26 Abr | S18 · 27Abr–3May | S19 · 4–10 May | S20 · 11–17 May | S21 · 18–21 May |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| RF-11~14 | Sección Avisos: lista por facultad + universitarios | -- | -- | `██` | `██` | -- | -- | -- |
| RF-15~18 | Sección Bienestar: becas, salud mental, apoyo alimentario | -- | -- | -- | `██` | -- | -- | -- |
| RF-20~24 | Sección Sedes: mapas generales + fotos salones por facultad | -- | -- | -- | `▒▒` | `▒▒` | -- | -- |
| RF-09 | Módulo reporte de bugs/errores de oferta (formulario + envío) | -- | -- | -- | `░░` | `░░` | -- | -- |
| RNF-04~06 | Modo oscuro + responsivo móvil + accesibilidad WCAG | -- | -- | -- | -- | `▒▒` | `▒▒` | -- |

**Estado general Frontend-Info:** 2 completos · 2 parciales · 1 pendiente

---

## INTEGRACIÓN · Alexander M.

| RF / RNF | TAREA / MÓDULO | S15 · 06–12 Abr | S16 · 13–19 Abr | S17 · 20–26 Abr | S18 · 27Abr–3May | S19 · 4–10 May | S20 · 11–17 May | S21 · 18–21 May |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| RNF-11 | Conexión front↔back: configurar cliente HTTP, variables de entorno | `██` | -- | -- | -- | -- | -- | -- |
| RF-01~07 | Integrar endpoints Auth (registro, login, OTP, token) con React | -- | `██` | `██` | -- | -- | -- | -- |
| RF-25~43 | Integrar endpoints Planeador (oferta, horarios, restricciones) | -- | -- | -- | `██` | `██` | -- | -- |
| RF-11~24 | Integrar endpoints Avisos, Bienestar y Sedes | -- | -- | -- | `██` | -- | -- | -- |
| RF-44~55 | Integrar cálculo traslado entre sedes + advertencia tiempo insuficiente | -- | -- | -- | -- | `░░` | `░░` | -- |
| RNF-10 | Pruebas E2E flujos críticos: registro → planeador → export | -- | -- | -- | -- | -- | `░░` | `░░` |

**Estado general Integración:** 4 completos · 0 parciales · 2 pendientes

---

## TESTING / QA · Juan D. R.

| RF / RNF | TAREA / MÓDULO | S15 · 06–12 Abr | S16 · 13–19 Abr | S17 · 20–26 Abr | S18 · 27Abr–3May | S19 · 4–10 May | S20 · 11–17 May | S21 · 18–21 May |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| RF-01~10 | Pruebas funcionales RF auth + perfiles (casos OK y error) | -- | -- | -- | -- | `░░` | `░░` | -- |
| RF-25~43 | Pruebas funcionales RF planeador: créditos, cruces, prereqs | -- | -- | -- | -- | -- | `░░` | `░░` |
| RF-56 / RNF-07 | Pruebas de seguridad: SQL injection, CORS, tokens expirados | -- | -- | -- | -- | -- | `░░` | `░░` |
| RF-59~62 | Corrección de bugs reportados + documentación final técnica | -- | -- | -- | -- | -- | `▒▒` | `▒▒` |

**Estado general Testing/QA:** 0 completos · 1 parcial · 3 pendientes

---

## ENTREGA FINAL · TODOS

| TAREA | S21 · 18–21 May |
|---|:---:|
| 🔴 ENTREGA FINAL — Sistema completo integrado y desplegado (RF-01~62) | `░░` |

---

## Resumen global

| Área | Integrante | Completas | Parciales | Pendientes | % avance estimado |
|---|---|:---:|:---:|:---:|:---:|
| Backend – Seguridad | Tomás G. | 1 / 6 | 3 / 6 | 2 / 6 | ~35% |
| Frontend – Auth | Carlos B. | 3 / 4 | 1 / 4 | 0 / 4 | ~87% |
| Frontend – Planeador | Carlos B. | 3 / 4 | 1 / 4 | 0 / 4 | ~87% |
| Frontend – Info | Carlos B. | 2 / 5 | 2 / 5 | 1 / 5 | ~60% |
| Integración | Alexander M. | 4 / 6 | 0 / 6 | 2 / 6 | ~67% |
| Testing / QA | Juan D. R. | 0 / 4 | 1 / 4 | 3 / 4 | ~12% |
| **TOTAL** | **—** | **13 / 29** | **8 / 29** | **8 / 29** | **~55%** |

---

## Brechas críticas (bloquean entrega)

1. **Sin pruebas automatizadas** — 0 archivos de test en backend Java y 0 en frontend
2. **Rate limiting** no implementado (RNF-01)
3. **Logs de seguridad + backup BD** ausentes (RF-57/58)
4. **Cálculo traslado entre sedes** sin implementar (RF-44~55)
5. **Frontend reporte de bugs** sin pantalla (RF-09)
6. **Sin framework E2E** (Cypress/Playwright) configurado (RNF-10)
7. **HTTPS no forzado** en configuración Spring (solo CORS está OK)
8. **WCAG / accesibilidad** mínima — aria-labels ausentes en mayoría de componentes
