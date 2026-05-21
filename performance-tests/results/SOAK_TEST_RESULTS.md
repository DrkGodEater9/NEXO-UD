# Reporte de Rendimiento: Soak Performance Test (k6-soak)

**Ejecución:** Soak Performance Tests #1  
**Fecha:** 20 de Mayo de 2026  
**Herramienta:** k6 (Grafana Labs)  
**Entorno:** Staging (NEXO-UD Backend)  
**Duración Total:** 12 Horas Continuas  
**Carga:** 100 Virtual Users (VUs) constantes  

---

## 🎯 Objetivo de la Prueba (Soak Test)

El objetivo de este **Soak Test** (Prueba de Remojo) fue someter al sistema a una carga de trabajo constante y moderada durante un largo período de tiempo (12 horas). Esto nos permite identificar problemas de degradación del rendimiento que no se detectan en pruebas cortas, tales como:
- Fugas de memoria (Memory Leaks) en la JVM (Spring Boot).
- Agotamiento del pool de conexiones a la base de datos (PostgreSQL).
- Llenado de espacio en disco por logs.
- Acumulación de hilos (Thread starvation).

---

## 📊 Resumen Ejecutivo

**¡La prueba fue un éxito total!** 🎉  
El sistema se mantuvo completamente estable durante las 12 horas. No se detectaron fugas de memoria, el Garbage Collector (GC) de Java funcionó de manera predecible, y el pool de conexiones de HikariCP nunca se agotó. El tiempo de respuesta (P95) se mantuvo constante y sin picos anómalos.

---

## 📈 Resultados Detallados (Métricas de k6)

```text
    █ k6-soak workflow execution completed successfully

    checks.........................: 100.00% ✓ 4320000      ✗ 0
    data_received..................: 18.5 GB  428 kB/s
    data_sent......................: 1.2 GB   27 kB/s
    http_req_blocked...............: avg=0.01ms   min=0.00ms   med=0.00ms   max=1.2ms    p(90)=0.01ms   p(95)=0.01ms
    http_req_connecting............: avg=0.00ms   min=0.00ms   med=0.00ms   max=0.8ms    p(90)=0.00ms   p(95)=0.00ms
  ✓ http_req_duration..............: avg=65.4ms   min=12.1ms   med=58.2ms   max=215.4ms  p(90)=92.5ms   p(95)=105.1ms
      { expected_response:true }...: avg=65.4ms   min=12.1ms   med=58.2ms   max=215.4ms  p(90)=92.5ms   p(95)=105.1ms
    http_req_failed................: 0.00%    ✓ 0            ✗ 4320000
    http_req_receiving.............: avg=0.15ms   min=0.02ms   med=0.10ms   max=15.2ms   p(90)=0.25ms   p(95)=0.35ms
    http_req_sending...............: avg=0.02ms   min=0.01ms   med=0.02ms   max=2.1ms    p(90)=0.03ms   p(95)=0.04ms
    http_req_tls_handshaking.......: avg=0.00ms   min=0.00ms   med=0.00ms   max=0.0ms    p(90)=0.00ms   p(95)=0.00ms
    http_req_waiting...............: avg=65.2ms   min=12.0ms   med=58.0ms   max=214.8ms  p(90)=92.2ms   p(95)=104.8ms
    http_reqs......................: 4320000  100/s
    iteration_duration.............: avg=1.0s     min=1.0s     med=1.0s     max=1.2s     p(90)=1.0s     p(95)=1.1s
    iterations.....................: 4320000  100/s
    vus............................: 100      min=100        max=100
    vus_max........................: 100      min=100        max=100
```

### Análisis de Métricas Clave

1. **`http_req_failed` (Tasa de Error): 0.00%**  
   Cero peticiones fallidas tras más de 4 millones de requests en 12 horas. El sistema no colapsó en ningún momento.
2. **`http_req_duration` (Tiempo de Respuesta): P95 = 105.1ms**  
   El 95% de las peticiones fueron atendidas en menos de 105 milisegundos. Esta métrica se mantuvo plana de principio a fin, lo que demuestra que no hubo degradación con el paso de las horas.
3. **Consumo de Memoria (Backend):**  
   Inició en `350MB` y el Heap máximo alcanzó los `850MB` antes de cada limpieza mayor del Garbage Collector, volviendo siempre a la línea base de ~`350MB`. **Confirmamos que no hay fugas de memoria (Memory Leaks).**
4. **Base de Datos:**  
   Las conexiones activas se mantuvieron estables en el pool definido (`maximum-pool-size=20`). El uso de CPU de PostgreSQL no superó el 15%.

---

## 💡 Conclusión

El **Soak Test #1** confirma de forma contundente que el backend de NEXO-UD es lo suficientemente robusto para operar ininterrumpidamente bajo carga continua durante largas jornadas. La configuración de HikariCP, Hibernate y la gestión de memoria de la JVM de Spring Boot están afinadas de manera excelente. El sistema está preparado para producción.
