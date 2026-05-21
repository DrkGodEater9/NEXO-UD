# Reporte de Rendimiento: Baseline Performance Test (k6-baseline)

**Ejecución:** Baseline Performance Tests #1  
**Fecha:** 20 de Mayo de 2026  
**Herramienta:** k6  
**Entorno:** Staging (NEXO-UD Backend)  
**Duración:** 5 Minutos  
**Carga:** 10 Virtual Users (VUs) constantes  

---

## 🎯 Objetivo de la Prueba (Baseline)
El objetivo de esta prueba fue establecer una línea base de rendimiento bajo condiciones normales de carga. Estos resultados servirán como punto de comparación (baseline) para futuras pruebas de estrés, picos y remojos.

---

## 📊 Resumen Ejecutivo
El sistema responde de manera ultra-rápida en condiciones ideales, con un P95 de 45ms y 0 errores.

## 📈 Resultados Detallados (Métricas de k6)

```text
    █ k6-baseline workflow execution completed successfully

    checks.........................: 100.00% ✓ 15000      ✗ 0
    data_received..................: 68.5 MB  228 kB/s
    data_sent......................: 4.2 MB   14 kB/s
    http_req_blocked...............: avg=0.01ms   min=0.00ms   med=0.00ms   max=1.2ms    p(90)=0.01ms   p(95)=0.01ms
    http_req_connecting............: avg=0.00ms   min=0.00ms   med=0.00ms   max=0.5ms    p(90)=0.00ms   p(95)=0.00ms
  ✓ http_req_duration..............: avg=32.4ms   min=10.1ms   med=28.2ms   max=115.4ms  p(90)=40.5ms   p(95)=45.1ms
      { expected_response:true }...: avg=32.4ms   min=10.1ms   med=28.2ms   max=115.4ms  p(90)=40.5ms   p(95)=45.1ms
    http_req_failed................: 0.00%    ✓ 0            ✗ 15000
    http_reqs......................: 15000    50/s
    vus............................: 10       min=10         max=10
```

### Conclusión
Se logró establecer la línea base exitosamente. El P95 ideal es ~45ms.
