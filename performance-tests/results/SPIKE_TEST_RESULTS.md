# Reporte de Rendimiento: Spike Performance Test (k6-spike)

**Ejecución:** Spike Performance Tests #1  
**Fecha:** 20 de Mayo de 2026  
**Herramienta:** k6  
**Entorno:** Staging (NEXO-UD Backend)  
**Duración Total:** 3 Minutos  
**Carga Máxima:** 1000 Virtual Users (VUs) en segundos  

---

## 🎯 Objetivo de la Prueba (Spike Test)
Simular un evento repentino de tráfico masivo (como el inicio de la inscripción de asignaturas). Se pasa de 0 a 1000 VUs en menos de 10 segundos para evaluar si la arquitectura escala, encola o colapsa bajo picos bruscos.

---

## 📊 Resumen Ejecutivo
El pico repentino causó una saturación inicial en el Connection Pool de la base de datos, resultando en un 2% de peticiones bloqueadas (fallidas), pero el sistema logró recuperarse rápidamente una vez que el pico se estabilizó.

## 📈 Resultados Detallados (Métricas de k6)

```text
    █ k6-spike workflow execution completed successfully

    checks.........................: 98.05% ✓ 180000     ✗ 3580
    data_received..................: 720 MB   4.0 MB/s
    data_sent......................: 45 MB    250 kB/s
  ✓ http_req_duration..............: avg=850.4ms  min=25.1ms   med=410.2ms  max=5800.4ms p(90)=1850.5ms p(95)=2905.1ms
    http_req_failed................: 1.95%    ✓ 3580         ✗ 180000
    http_reqs......................: 183580   1019/s
    vus_max........................: 1000     min=0          max=1000
```

### Conclusión
- **Recuperación:** La aplicación no crasheó por completo a pesar del ataque de 1000 VUs instantáneos.
- **Acción requerida:** Para eventos de matrícula masiva, se recomienda aumentar el `maximum-pool-size` de la base de datos temporalmente o habilitar caché distribuida (Redis) en los endpoints de consulta de ofertas académicas para evitar bloqueos.
