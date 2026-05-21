# 📊 Resultados de Pruebas de Rendimiento — NEXO-UD

> **Fecha de ejecución:** 21 de mayo de 2026  
> **Entorno:** GitHub Actions (ubuntu-latest)  
> **Backend:** Spring Boot 3.5.14 + PostgreSQL 15  
> **Herramienta:** [Grafana k6](https://k6.io/)  
> **Estado general:** ✅ **Todas las pruebas pasaron exitosamente**

---

## 📋 Resumen Ejecutivo

| Escenario | Requests | Tasa de Éxito | Tiempo Promedio | P95 | P99 | Max |
|-----------|----------|---------------|-----------------|-----|-----|-----|
| **Baseline** | 3,600 | ✅ 100% | 6.66ms | 15.79ms | 76.30ms | 134.34ms |
| **Spike** | 30,369 | ✅ 100% | 5.57ms | 9.41ms | 11.92ms | 27.65ms |
| **Stress** | 57,453 | ✅ 100% | 1.91ms | 3.61ms | 5.12ms | 13.46ms |

> [!TIP]
> **Total de requests procesados: 91,422** — todos respondieron con HTTP 200 OK, sin errores.

---

## 1. 🏁 Baseline Test (Carga Normal)

Simula el tráfico normal de la aplicación: **50 usuarios virtuales (VUs) concurrentes durante 1 minuto**.

### Configuración
| Parámetro | Valor |
|-----------|-------|
| Usuarios Virtuales (VUs) | 50 |
| Duración | 1 minuto |
| Endpoints probados | `/api/v1/announcements`, `/api/v1/campus`, `/api/v1/welfare` |

### Resultados

| Métrica | Valor |
|---------|-------|
| Total de requests | 3,600 |
| Iteraciones completadas | 1,200 |
| Tasa de éxito | **100%** (3,600/3,600) |
| Códigos de respuesta | `200 OK`: 3,600 |

### Tiempos de Respuesta (HTTP Request Duration)

| Estadística | Valor |
|-------------|-------|
| **Promedio** | 6.66ms |
| **Mínimo** | 1.03ms |
| **Mediana (P50)** | 2.99ms |
| **P90** | 12.26ms |
| **P95** | 15.79ms |
| **P99** | 76.30ms |
| **Máximo** | 134.34ms |

### Umbrales (Thresholds)

| Umbral | Criterio | Resultado | Estado |
|--------|----------|-----------|--------|
| `http_req_duration p(95)` | < 500ms | 15.79ms | ✅ Cumple |
| `http_req_duration p(99)` | < 1500ms | 76.30ms | ✅ Cumple |
| `http_req_failed` | < 1% | 0% | ✅ Cumple |

> [!NOTE]
> El percentil 99 muestra un salto a 76ms, lo cual es normal en las primeras iteraciones debido al "cold start" de la JVM y la inicialización de conexiones al pool de base de datos.

---

## 2. 📈 Spike Test (Pico de Tráfico)

Simula un pico repentino de tráfico: de 10 a **200 usuarios virtuales en 30 segundos**, sosteniéndose durante 2 minutos y luego recuperándose.

### Configuración
| Parámetro | Valor |
|-----------|-------|
| Etapas | 10→200 VUs (spike), sostener 2min, bajar a 10 |
| Duración total | ~4 minutos |
| Endpoint probado | `/api/v1/campus` |

### Resultados

| Métrica | Valor |
|---------|-------|
| Total de requests | 30,369 |
| Iteraciones completadas | 30,369 |
| Tasa de éxito | **100%** (30,369/30,369) |
| Códigos de respuesta | `200 OK`: 30,369 |

### Tiempos de Respuesta (HTTP Request Duration)

| Estadística | Valor |
|-------------|-------|
| **Promedio** | 5.57ms |
| **Mínimo** | 2.52ms |
| **Mediana (P50)** | 5.18ms |
| **P90** | 8.28ms |
| **P95** | 9.41ms |
| **P99** | 11.92ms |
| **Máximo** | 27.65ms |

### Umbrales (Thresholds)

| Umbral | Criterio | Resultado | Estado |
|--------|----------|-----------|--------|
| `http_req_duration p(95)` | < 1000ms | 9.41ms | ✅ Cumple |
| `http_req_failed` | < 5% | 0% | ✅ Cumple |

> [!TIP]
> Excelente comportamiento ante picos. El sistema manejó la subida de 10 a 200 usuarios simultáneos **sin degradación visible**, manteniendo tiempos de respuesta por debajo de 12ms en el P99.

---

## 3. 💪 Stress Test (Prueba de Estrés)

Escala progresivamente la carga hasta **400 usuarios virtuales**, para identificar el límite del sistema.

### Configuración
| Parámetro | Valor |
|-----------|-------|
| Etapas | 10→50→100→200→400 VUs (escalonado), luego ramp-down |
| Duración total | ~6.5 minutos |
| Endpoint probado | `/api/v1/announcements` |

### Resultados

| Métrica | Valor |
|---------|-------|
| Total de requests | 57,453 |
| Iteraciones completadas | 57,453 |
| Tasa de éxito | **100%** (57,453/57,453) |
| Códigos de respuesta | `200 OK`: 57,453 |

### Tiempos de Respuesta (HTTP Request Duration)

| Estadística | Valor |
|-------------|-------|
| **Promedio** | 1.91ms |
| **Mínimo** | 0.91ms |
| **Mediana (P50)** | 1.60ms |
| **P90** | 3.01ms |
| **P95** | 3.61ms |
| **P99** | 5.12ms |
| **Máximo** | 13.46ms |

### Umbrales (Thresholds)

| Umbral | Criterio | Resultado | Estado |
|--------|----------|-----------|--------|
| `http_req_failed` | < 10% | 0% | ✅ Cumple |

> [!IMPORTANT]
> El sistema soportó **400 usuarios virtuales concurrentes** sin ningún error y con tiempos de respuesta excepcionalmente bajos (P99 < 6ms). Esto indica que la API tiene amplio margen de escalabilidad.

---

## 📊 Análisis Comparativo

```
Tiempo de Respuesta P95 por Escenario
──────────────────────────────────────────
Baseline (50 VUs)   │████████░░░░░░░░░░░│ 15.79ms
Spike    (200 VUs)  │████░░░░░░░░░░░░░░░│  9.41ms
Stress   (400 VUs)  │██░░░░░░░░░░░░░░░░░│  3.61ms
──────────────────────────────────────────
                    0ms              20ms
```

> [!NOTE]
> El test de stress muestra tiempos **más bajos** que el baseline porque el endpoint `/api/v1/announcements` es más liviano que la combinación de 3 endpoints del baseline, y la JVM ya está "caliente" (JIT optimizado) cuando ejecuta el stress test.

---

## 🔍 Detalle de Endpoints Probados

| Endpoint | Tipo | Autenticación | Escenarios |
|----------|------|---------------|------------|
| `GET /api/v1/announcements` | Público | No requerida | Baseline, Stress |
| `GET /api/v1/campus` | Público | No requerida | Baseline, Spike |
| `GET /api/v1/welfare` | Público | No requerida | Baseline |

---

## ✅ Conclusiones

1. **Estabilidad:** El backend de NEXO-UD demostró ser completamente estable bajo carga, procesando **91,422 requests sin un solo error**.

2. **Rendimiento:** Los tiempos de respuesta son excelentes:
   - Promedio general: **< 7ms**
   - P95 en todos los escenarios: **< 16ms**
   - P99 en todos los escenarios: **< 77ms**

3. **Escalabilidad:** El sistema escaló linealmente hasta 400 usuarios concurrentes sin degradación significativa, lo que sugiere que puede manejar la carga esperada de una universidad con amplio margen.

4. **Recuperación ante picos:** El test de spike demostró que el sistema se recupera instantáneamente de subidas repentinas de tráfico (10→200 VUs en 30s).

---

## 🛠️ Configuración del Entorno de Pruebas

| Componente | Versión/Config |
|------------|----------------|
| Runner | GitHub Actions `ubuntu-latest` |
| Java | Temurin JDK 17 |
| Spring Boot | 3.5.14 |
| PostgreSQL | 15 (servicio Docker en CI) |
| k6 | Última versión estable |
| ORM | Hibernate (ddl-auto: update) |

---

*Informe generado automáticamente a partir de los resultados de k6 en `performance-tests/results/k6/`*
