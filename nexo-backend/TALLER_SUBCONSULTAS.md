# Taller — Subconsultas SQL | Proyecto NEXO

---

## 1. Subconsulta escalar en WHERE — devuelve un único valor

**Pregunta de negocio del grupo:**
¿Cuáles materias de la malla curricular tienen más créditos que el promedio general de créditos de todas las materias?

**Consulta SQL:**

```sql
SELECT cs.id,
       cs.codigo,
       cs.nombre,
       cs.credits,
       sp.nombre AS plan_de_estudio
FROM curriculum_subjects cs
JOIN study_plans sp ON sp.id = cs.study_plan_id
WHERE cs.credits > (
    SELECT AVG(credits)
    FROM curriculum_subjects
)
ORDER BY cs.credits DESC;
```

---

## 2. Subconsulta con IN en WHERE — devuelve una lista de valores

**Pregunta de negocio del grupo:**
¿Cuáles usuarios tienen al menos una materia con estado 'APROBADA' en su progreso académico?

**Consulta SQL:**

```sql
SELECT u.id,
       u.email,
       u.nickname
FROM users u
WHERE u.id IN (
    SELECT uap.user_id
    FROM user_academic_progress uap
    JOIN user_subject_progress usp ON usp.academic_progress_id = uap.id
    WHERE usp.status = 'APROBADA'
)
ORDER BY u.nickname;
```

---

## 3. NOT IN o NOT EXISTS en WHERE — identifica ausencias en los datos

**Pregunta de negocio del grupo:**
¿Cuáles planes de estudio no tienen ninguna materia registrada en la malla curricular todavía?

**Consulta SQL:**

```sql
SELECT sp.id,
       sp.codigo_plan,
       sp.nombre,
       sp.facultad
FROM study_plans sp
WHERE NOT EXISTS (
    SELECT 1
    FROM curriculum_subjects cs
    WHERE cs.study_plan_id = sp.id
)
ORDER BY sp.facultad, sp.nombre;
```

---

## CIERRE — Reflexión grupal

**¿Qué pregunta de negocio de su proyecto no pudieron responder con lo que saben hasta ahora? ¿Qué les faltaría para responderla?**

No pudimos responder: *"¿Cuáles son las 5 materias con más cruces de horario entre los estudiantes que las inscribieron en el mismo semestre?"*. Esto requiere comparar bloques de tiempo de distintos grupos seleccionados por un mismo usuario, lo que implica múltiples JOINs, funciones de ventana (WINDOW FUNCTIONS) y posiblemente CTEs (Common Table Expressions) para detectar solapamientos entre rangos horarios. Con lo visto hasta subconsultas no alcanza para resolver ese nivel de análisis temporal cruzado.
