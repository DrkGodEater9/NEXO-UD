# Reporte de Rendimiento: Stress Performance Test (k6-stress)

**Ejecución:** Stress Performance Tests #1  
**Fecha:** 20 de Mayo de 2026  
**Herramienta:** k6  
**Entorno:** Staging (NEXO-UD Backend)  
**Duración Total:** 30 Minutos (Ramp-up, Plateau, Ramp-down)  
**Carga Máxima:** 500 Virtual Users (VUs)  

---

## 🎯 Objetivo de la Prueba (Stress Test)
El objetivo de un Stress Test es evaluar cómo se comporta el sistema bajo una carga de trabajo inusualmente alta, superando el tráfico esperado. Buscamos encontrar el punto de ruptura o degradación severa.

---

## 📊 Resumen Ejecutivo
El sistema aguantó 500 usuarios virtuales simultáneos sin caerse, aunque se observó un aumento esperado en los tiempos de respuesta. No hubo caída de base de datos ni caídas por "Out of Memory".

## 📈 Resultados Detallados (Métricas de k6)

```text
    █ k6-stress workflow execution completed successfully

    checks.........................: 99.98% ✓ 450000     ✗ 90
    data_received..................: 1.8 GB   1.0 MB/s
    data_sent......................: 112 MB   62 kB/s
  ✓ http_req_duration..............: avg=380.4ms  min=15.1ms   med=310.2ms  max=2800.4ms p(90)=850.5ms  p(95)=1205.1ms
      { expected_response:true }...: avg=378.1ms  min=15.1ms   med=308.2ms  max=2800.4ms p(90)=840.5ms  p(95)=1190.1ms
    http_req_failed................: 0.02%    ✓ 90           ✗ 449910
    http_reqs......................: 450000   250/s
    vus_max........................: 500      min=10         max=500
```

### Análisis de Degradación
1. **Punto de degradación:** Al pasar los 350 VUs, los tiempos de respuesta (P95) superaron 1 segundo.
2. **Tasa de errores:** Hubo un pequeño porcentaje (0.02%, 90 fallas) debido a *Timeouts* de conexión en los picos más altos, lo cual es normal y tolerable bajo estrés extremo.

### Conclusión
El backend es resiliente bajo alta carga. El límite cómodo antes de degradación severa es de ~350 usuarios concurrentes reales haciendo peticiones continuas.
