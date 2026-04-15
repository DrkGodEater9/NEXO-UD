# PROMPT PARA FIGMA AI — REDISEÑO COMPLETO NEXO UD

---

## CONTEXTO DEL PROYECTO

Nexo UD es una plataforma web independiente de planeación académica para estudiantes de la Universidad Distrital Francisco José de Caldas (Bogotá, Colombia). NO es el sistema oficial de la universidad — es una herramienta estudiantil que permite planificar horarios, buscar materias, validar cruces y créditos, y consultar información de sedes y bienestar. El público objetivo son estudiantes universitarios entre 17 y 28 años, nativos digitales, que usan la plataforma principalmente desde el celular.

El proyecto actual tiene un frontend en React + TypeScript con estas vistas existentes: LandingPage, LoginPage, RegisterPage, VerifyEmailPage, PlannerPage, ProfilePage. Los componentes actuales son: Modal, Planner, ScheduleViewer. Necesito un rediseño visual completo al 180° — cambiar toda la estética, mantener la funcionalidad.

---

## DIRECCIÓN DE DISEÑO

### Estilo visual
- **Glassmorphism / futurista** inspirado en Apple, Arc Browser y Linear.
- Fondos con gradientes suaves oscuros (deep navy → dark purple → charcoal).
- Tarjetas y paneles con `backdrop-filter: blur()`, bordes sutiles con `border: 1px solid rgba(255,255,255,0.08)`, fondos con `background: rgba(255,255,255,0.05)`.
- Acentos de color con glow sutil (no neón agresivo — elegante y contenido).
- Esquinas redondeadas generosas: `border-radius: 16px` en cards, `12px` en botones, `24px` en modales.
- Sombras sutiles con tono de color, no sombras negras duras.

### Paleta de colores
- **Primario:** Un rojo profundo/vino sofisticado (#C9344C o similar) — inspirado en el rojo institucional de la Universidad Distrital pero evolucionado a algo más premium. NO usar el rojo plano institucional.
- **Secundario:** Azul-índigo eléctrico (#6366F1) para acciones secundarias y acentos interactivos.
- **Fondo principal (dark mode por defecto):** Gradiente de #0F0B1E → #1A1333 → #0D1117.
- **Superficies glass:** rgba(255,255,255,0.04) a rgba(255,255,255,0.08) con blur de 20-40px.
- **Texto primario:** #F1F0F5 (blanco cálido, no blanco puro).
- **Texto secundario:** #8B8A97.
- **Éxito:** #34D399. **Advertencia:** #FBBF24. **Error:** #F87171.
- **Light mode como alternativa:** Fondo #FAFAF9, superficies blancas con sombras suaves, mismos acentos de color.

### Tipografía
- **Font principal:** Inter o Geist Sans (sans-serif moderna, excelente legibilidad).
- **Font para números/datos:** Geist Mono o JetBrains Mono (en contadores de créditos, códigos de materia).
- Jerarquía: H1=32px bold, H2=24px semibold, H3=18px medium, Body=15px regular, Caption=13px regular, Micro=11px medium.
- Letter-spacing: -0.02em en headings para sensación premium.

### Iconografía
- Lucide Icons o Phosphor Icons — línea fina (stroke-width: 1.5), estilo consistente.
- Nunca usar emoji como iconos en la UI.

### Animaciones y microinteracciones (indicar en Figma con notas)
- Transiciones entre páginas: fade + slide sutil (200-300ms, ease-out).
- Hover en cards: elevación sutil + brillo del borde glass.
- Botones: escala 0.97 al presionar, transición de color suave.
- Skeleton loaders en lugar de spinners para carga de datos.
- Toast notifications que entran desde arriba con slide + fade.

---

## VISTAS A DISEÑAR (10 pantallas, responsive: desktop + mobile)

### VISTA 1: Landing Page (pública, antes de login)
**Ruta:** `/`
**Propósito:** Convencer al estudiante de registrarse. Mostrar que NO es la página oficial.

**Secciones:**
1. **Hero section:** Headline grande ("Planifica tu semestre sin estrés"), subtítulo explicativo, dos CTAs: "Crear cuenta" (primario) y "Modo rápido" (secundario/glass). Fondo con gradiente animado sutil o mesh gradient. Mockup flotante del planner con efecto glass.
2. **Features grid (3-4 cards glass):** Detección de cruces, control de créditos, tiempos entre sedes, historial de horarios. Cada card con icono + título + descripción corta.
3. **Cómo funciona (3 pasos):** Regístrate con tu correo UD → Busca tus materias → Arma tu horario. Ilustración o numeración visual conectada.
4. **Disclaimer visible:** Banner sutil pero claro: "Nexo UD es una herramienta estudiantil independiente. No es el sistema oficial de inscripción de la Universidad Distrital."
5. **Footer:** Links a términos, contacto, reporte de bugs.

**Navbar:** Logo Nexo UD (sin escudo institucional) + "Iniciar sesión" + "Registrarse" (botón primario).

---

### VISTA 2: Registro (`/register`)
**Propósito:** Registro con correo @udistrital.edu.co.

**Componentes:**
- Card glass centrada con el formulario.
- Campo de email con validación visual en tiempo real (solo acepta @udistrital.edu.co — mostrar check verde o error inline).
- Campo de contraseña con indicador de fortaleza (barra de progreso con colores).
- Campo de apodo/nickname (opcional, con tooltip explicando que es para funciones sociales futuras).
- Checkbox de aceptación de términos y tratamiento de datos (Ley 1581).
- Botón "Registrarse" (deshabilitado hasta completar campos válidos).
- Link inferior: "¿Ya tienes cuenta? Inicia sesión".
- Fondo: mismo gradiente de la landing, con un efecto glass grande de fondo.

---

### VISTA 3: Verificación OTP (`/verify`)
**Propósito:** Ingresar código enviado al correo institucional.

**Componentes:**
- Card glass centrada.
- Texto: "Enviamos un código a tu*****@udistrital.edu.co".
- **6 inputs individuales** para el código OTP (auto-focus al siguiente al digitar, estilo glassmorphism con borde que cambia de color al focus).
- Temporizador de reenvío: "Reenviar código en 0:45" → botón "Reenviar código" cuando llega a 0.
- Botón "Verificar".
- Animación de éxito: check animado al verificar correctamente → redirect al dashboard.

---

### VISTA 4: Login (`/login`)
**Propósito:** Iniciar sesión.

**Componentes:**
- Card glass centrada.
- Campos: email institucional + contraseña.
- Toggle "Mostrar contraseña" (icono de ojo).
- Link "¿Olvidaste tu contraseña?" (aunque no sea prioritario, dejar el placeholder).
- Botón "Iniciar sesión".
- Link inferior: "¿No tienes cuenta? Regístrate".
- Misma estética que la vista de registro para consistencia.

---

### VISTA 5: Dashboard / Home (`/dashboard`)
**Ruta después del login.** El hub principal del estudiante.

**Layout:** Sidebar colapsable (izquierda) + área principal.

**Sidebar (glass, vertical):**
- Avatar + nombre/apodo del estudiante (arriba).
- Links de navegación con iconos: Inicio, Planeador, Buscar materias, Campus y sedes, Información general, Mi perfil.
- Botón "Cerrar sesión" (abajo).
- En mobile: se convierte en bottom navigation bar con 5 iconos.

**Área principal del dashboard:**
- **Saludo dinámico:** "Buenos días, [apodo]" (basado en hora del día).
- **Cards de resumen (grid 2x2, glass):**
  - Horarios guardados: "[3/5] horarios" con barra de progreso mini.
  - Créditos del horario activo: "18/21 créditos" con barra circular/semicircular.
  - Próximo evento del calendario: "Inicio inscripciones: 15 de enero".
  - Alerta de sede: "Tu siguiente clase está en Macarena A — 35 min desde Facultad Tecnológica".
- **Horario activo (preview):** Miniatura visual de la vista semanal del horario seleccionado como activo. Click → abre el planeador completo.
- **Sección de avisos:** Cards apiladas con avisos de bienestar (apoyo alimentario, becas, salud mental). Formato: icono + título + fecha. Glass style.

---

### VISTA 6: Planeador de horarios (`/planner`)
**La vista principal — la joya de la plataforma.** Diseñar con mucho detalle.

**Layout:** Panel lateral izquierdo (búsqueda) + grilla semanal central + panel derecho (resumen).

**Panel izquierdo — Buscador de materias:**
- Barra de búsqueda con icono de lupa y placeholder "Buscar por nombre, código o profesor".
- Filtros colapsables debajo: Facultad, proyecto curricular, sede, tipo (obligatoria/electiva intrínseca/electiva extrínseca — diferenciadas visualmente con badges de color).
- Resultados como cards compactas: código materia, nombre, profesor, grupo, horario (días + horas), sede, créditos. Cada card con botón "+ Agregar".
- Al agregar: animación de la card "volando" al horario.

**Grilla semanal (centro):**
- 7 columnas (Lun a Dom), filas de 1 hora (6AM a 10PM).
- Bloques de materia como cards glass coloreadas (un color por materia, personalizable).
- Cada bloque muestra: nombre abreviado, salón, sede.
- Si hay cruce: el bloque parpadea en rojo sutil con ícono de advertencia.
- Fila de encabezado con días.
- Columna izquierda con horas.
- Línea horizontal punteada indicando "hora actual" (rojo suave).
- Bloques manuales: el usuario puede crear "bloques libres" con drag-and-drop (almuerzo, transporte, estudio).

**Panel derecho — Resumen:**
- Contador de créditos: barra o gauge circular. Números en font mono. Cambia a rojo si > 21.
- Lista de materias agregadas con botón de eliminar cada una.
- Indicador de electivas: badges "intrínseca" / "extrínseca".
- Alertas de tiempos entre sedes si detecta desplazamiento corto.
- Código SNIES e interno visibles por materia.
- Botón "Guardar horario" (primario, grande).
- Botón "Exportar" → desplegable: PDF, imagen PNG.
- Botón "Imprimir" (formato carta horizontal).
- Selector de horario: tabs o dropdown "Horario 1, 2, 3..." (máx 5). Botón "+ Nuevo".

**Estados especiales del planner:**
- Estado vacío: ilustración sutil + "Empieza buscando una materia".
- Estado de error de validación: modal glass con lista de errores (cruce, créditos, prerrequisito).
- Estado guardando: skeleton + toast de éxito.

**En mobile:** El panel izquierdo se convierte en un buscador colapsable arriba. El panel derecho es un bottom sheet deslizable. La grilla semanal ocupa toda la pantalla con scroll horizontal.

---

### VISTA 7: Búsqueda de materias (`/search`)
**Vista dedicada de exploración del catálogo.**

**Componentes:**
- Barra de búsqueda grande (hero-style, glass, centrada arriba).
- Filtros como chips/badges seleccionables: por sede, por facultad, por tipo, por créditos, por franja horaria (mañana/tarde/noche).
- Resultados en cards expandibles: click para ver detalle completo (prerrequisitos, grupos disponibles, link a Recoprofe para el profesor).
- Cada resultado muestra: código, nombre, créditos, profesor, grupo, horario, sede, tipo (con badge de color), botón "Agregar al planeador".
- Indicador si la materia ya está en alguno de tus horarios guardados.
- Diferenciación visual clara entre electivas intrínsecas (badge morado) y extrínsecas (badge azul).

---

### VISTA 8: Perfil del estudiante (`/profile`)
**Componentes:**
- Card glass principal con: avatar (iniciales generadas automáticamente con gradiente, no foto), nombre/apodo, correo institucional (parcialmente oculto), proyecto curricular.
- Sección "Mi progreso académico": Barra de progreso de carrera (porcentaje de créditos aprobados vs totales). Si > 70%, badge especial "Puedes inscribir cuarta matrícula".
- Sección "Historial de horarios": lista de semestres pasados como cards colapsables. Click para ver el horario de ese semestre en miniatura.
- Sección "Preferencias": Toggle modo oscuro/claro, colores personalizados para materias (paleta seleccionable).
- Botón "Eliminar cuenta" (rojo, con confirmación doble — modal que explica que se borran TODOS los datos según Ley 1581).
- Botón "Reportar bug" → abre formulario o enlace externo.

---

### VISTA 9: Información general (`/info`)
**Hub de información de bienestar, campus y utilidades.**

**Layout:** Grid de cards glass, cada una lleva a una sub-sección:
- **Campus y sedes:** Mapa simplificado o lista de sedes con tiempos estimados entre ellas. Mostrar dirección, fotos de referencia. Indicar si tiene laboratorios.
- **Calendario académico:** Vista mensual con festivos, paros, fechas de inscripción. Badges de color por tipo de evento.
- **Bienestar:** Cards con info de apoyo alimentario, becas vigentes, consejos de salud mental. Links a recursos oficiales.
- **Guía de inscripción en el SGA:** Paso a paso visual (tipo stepper/wizard) de cómo inscribir materias en el sistema oficial Cóndor.
- **Avisos generales:** Asambleas de facultad, noticias relevantes.

---

### VISTA 10: Modo emergencia (`/emergency` o `/quick`)
**Accesible sin login desde la landing page.**

**Propósito:** Si el servidor está saturado o el estudiante no quiere crear cuenta, puede armar un horario básico que NO se guarda en el servidor.

**Componentes:**
- Banner superior: "Modo rápido — tu horario no se guardará. Regístrate para guardar hasta 5 horarios."
- Versión simplificada del planeador: buscador de materias + grilla semanal.
- SIN: panel de resumen completo, historial, perfil, validaciones avanzadas.
- CON: detección básica de cruces (solo visual, no bloquea), exportar a imagen/PDF.
- Peso de página ultra liviano — mínimo JS, carga rápida en datos móviles.
- Diseño más plano y simple que el planner completo, pero misma familia visual.

---

## COMPONENTES REUTILIZABLES A DISEÑAR

1. **GlassCard:** Componente base para todas las tarjetas. Props: tamaño, con/sin borde glow, clickable.
2. **Button:** Variantes: primary (gradiente rojo-vino), secondary (glass con borde), ghost (solo texto), danger (rojo).
3. **Input:** Variante glass con label flotante, estados: default, focus (borde azul glow), error (borde rojo + mensaje), success (borde verde + check).
4. **Badge:** Para tipos de electiva, estados, tags. Variantes por color.
5. **Toast/Notification:** Éxito, error, advertencia, info. Entra por arriba con slide.
6. **Modal:** Glass, con overlay blur detrás. Tamaños: small, medium, full.
7. **ScheduleBlock:** Bloque de materia en la grilla. Colores personalizables. Estados: normal, conflicto, hover.
8. **CreditGauge:** Indicador circular/semicircular de créditos usados vs disponibles.
9. **Sidebar/BottomNav:** Navegación principal adaptativa desktop→mobile.
10. **Skeleton:** Loader para cada tipo de card y lista.
11. **EmptyState:** Ilustración + texto + CTA para estados sin datos.
12. **StepIndicator:** Para el flujo de registro y la guía del SGA.

---

## NOTAS TÉCNICAS PARA LA IMPLEMENTACIÓN

- El frontend se implementa en **React 18 + TypeScript**.
- Estilos con **Tailwind CSS v4** (utility-first, consistente con glassmorphism via clases custom).
- Animaciones con **Framer Motion** (transiciones de página, microinteracciones).
- Iconos con **Lucide React**.
- Grilla del horario: componente custom basado en CSS Grid.
- Estado global: **Zustand** (no Redux).
- Fetching: **TanStack Query (React Query)** para caché y sincronización.
- Routing: **React Router v6**.
- El diseño debe ser **responsive mobile-first** — más del 70% del uso será desde celular.
- Diseña también los estados: loading (skeleton), empty, error, success para cada vista.
- Accesibilidad: contraste mínimo WCAG AA, focus rings visibles, labels en todos los inputs, navegable por teclado.

---

## LO QUE NO DEBE TENER EL DISEÑO

- No usar el escudo, logos ni elementos con copyright de la Universidad Distrital.
- No incluir publicidad ni espacios para ads.
- No diseñar funciones de comunidad/social (no chat, no reseñas, no ver compañeros).
- No diseñar notificaciones push.
- No incluir gamificación ni elementos tipo juego.
- No usar colores neón agresivos — el glassmorphism debe ser elegante, no cyberpunk.