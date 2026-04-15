# 🎓 NexoUD - Planificador Académico

**Tu Planificador Académico para la Universidad Distrital**

---

## 🚀 Características Principales

### 📅 **Planificador de Horarios**
- Crea y visualiza tu horario semanal
- Detección automática de conflictos de horario
- Personalización de colores para cada materia
- Exportación de horario como imagen
- Guardado de múltiples versiones de horarios

### 📚 **Gestión de Pensum**
- Visualiza el pensum completo de Ingeniería de Sistemas
- Marca materias aprobadas
- Verificación automática de prerrequisitos
- Seguimiento de progreso con créditos y porcentaje

### 👥 **Información de Grupos**
- Consulta docentes, horarios y ubicaciones
- Número de inscritos por grupo
- Selección intuitiva de grupos

---

## 🎯 Acceso Rápido

### **Usuarios de Prueba Pre-configurados**

#### Usuario 1: Con Historial Académico
- **Correo:** `jcperezg@udistrital.edu.co`
- **Código:** `20211020001`
- **Contraseña:** `test123`
- ✅ Tiene 8 materias aprobadas
- ✅ Tiene 1 horario guardado

#### Usuario 2: Con Pocas Materias
- **Correo:** `mflopezr@udistrital.edu.co`
- **Código:** `20211020002`
- **Contraseña:** `test123`
- ✅ Tiene 5 materias aprobadas
- ❌ Sin horarios guardados

#### Usuario 3: Cuenta Nueva
- **Correo:** `afmartinezs@udistrital.edu.co`
- **Código:** `20211020003`
- **Contraseña:** `test123`
- ❌ Sin materias aprobadas
- ❌ Sin horarios guardados

---

## 📋 Guía de Uso

### **1. Registro de Nuevo Usuario**

1. Ve a la página de **Registro** (`/register`)
2. Completa el formulario:
   - **Nombre Completo:** Mínimo 3 caracteres
   - **Código Estudiantil:** 11 dígitos numéricos
   - **Correo Institucional:** Debe terminar en `@udistrital.edu.co`
   - **Contraseña:** Mínimo 6 caracteres
   - **Confirmar Contraseña:** Debe coincidir
3. Haz clic en **"Crear Cuenta"**
4. Ingresa el código de verificación: **`123456`** (para pruebas)
5. Serás redirigido al inicio de sesión

### **2. Inicio de Sesión**

1. Ve a la página de **Login** (`/login`)
2. Ingresa tu **Correo o Código Estudiantil**
3. Ingresa tu **Contraseña**
4. Haz clic en **"Iniciar Sesión"**

### **3. Gestionar tu Pensum**

1. Ve a **"Mi Perfil"** desde el header
2. En la pestaña **"Mi Pensum"**:
   - ✅ **Haz clic en una materia** para marcarla como vista
   - 🔒 Las materias con **candado** requieren prerrequisitos
   - 📊 Observa tu **progreso** en la tarjeta superior

**Códigos de Color:**
- 🟢 **Verde:** Materia aprobada
- 🔵 **Azul:** Materia disponible (prerrequisitos cumplidos)
- 🔒 **Gris:** Prerrequisitos pendientes

### **4. Crear un Horario**

1. Ve al **"Planificador"** desde el header
2. **Panel Izquierdo - Materias:**
   - Usa los filtros de **Facultad** y **Carrera**
   - Busca materias por nombre o código
   - Haz clic en una materia para ver sus grupos

3. **Panel Centro - Grupos:**
   - Selecciona un grupo para agregarlo al horario
   - ⚠️ Si hay conflicto de horario, recibirás una alerta

4. **Panel Derecho - Tu Horario:**
   - Visualiza todas las materias seleccionadas
   - Toggle **"Salones"** para mostrar/ocultar ubicaciones
   - Personaliza el **color de fondo** del horario

### **5. Personalizar Materias Seleccionadas**

En el panel superior **"Materias seleccionadas"**:

- 🎨 **Cambiar color:**
  - Haz clic en el círculo de color
  - Selecciona un nuevo color del picker
  - O ingresa un código hexadecimal manualmente

- 👥 **Cambiar grupo:**
  - Haz clic en el selector de grupo
  - Elige otro grupo disponible
  - ⚠️ Los grupos con conflicto aparecen tachados

- ❌ **Eliminar materia:**
  - Haz clic en el botón **×**

### **6. Guardar tu Horario**

1. Una vez tengas materias seleccionadas, haz clic en **"Guardar Horario"**
2. Ingresa un nombre para tu horario (ej: "Horario 2026-1")
3. El horario se guardará en tu perfil

### **7. Ver Horarios Guardados**

1. Ve a **"Mi Perfil"**
2. Selecciona la pestaña **"Horarios Guardados"**
3. Verás todos tus horarios con:
   - Nombre y fecha de creación
   - Lista de materias incluidas
   - Opción para **eliminar** con el ícono 🗑️

### **8. Exportar Horario**

1. En el Planificador, haz clic en **"Descargar"**
2. Tu horario se exportará como imagen PNG
3. Úsalo para compartir o imprimir

---

## 🎨 Características Visuales

### **Paleta de Colores por Defecto:**
- 🩷 Color 1: Rosa (`#ec4899`)
- 🟣 Color 2: Morado (`#a855f7`)
- 🔵 Color 3: Azul (`#3b82f6`)
- 🟢 Color 4: Verde (`#22c55e`)
- 🟡 Color 5: Amarillo (`#eab308`)
- 🟠 Color 6: Naranja (`#f97316`)
- 🔵 Color 7: Cyan (`#06b6d4`)
- 🟣 Color 8: Violeta (`#8b5cf6`)
- 🩷 Color 9: Rosa claro (`#ec4899`)
- 🟢 Color 10: Verde esmeralda (`#10b981`)

### **Detección de Conflictos:**
- ⚠️ **Alerta visual** cuando intentas seleccionar un grupo con conflicto
- 🔴 **Modal explicativo** mostrando la materia en conflicto
- 🚫 **Grupos bloqueados** en el selector de grupos

---

## 📱 Diseño Responsive

La aplicación se adapta a diferentes tamaños de pantalla:

- **Desktop (>1400px):** Vista de 3 columnas
- **Tablet (900px-1400px):** Vista de 2 columnas
- **Mobile (<900px):** Vista de 1 columna

---

## 🔐 Seguridad y Privacidad

- Los datos se almacenan localmente en tu navegador (localStorage)
- Las contraseñas se guardan en texto plano (solo para demostración)
- No se envían datos a servidores externos
- Puedes limpiar todos los datos borrando el localStorage del navegador

---

## 🛠️ Solución de Problemas

### **No puedo iniciar sesión**
- Verifica que el correo termine en `@udistrital.edu.co`
- Asegúrate de usar el código estudiantil de 11 dígitos
- Revisa que la contraseña sea correcta

### **No puedo marcar una materia en el pensum**
- La materia puede tener prerrequisitos pendientes
- Primero marca las materias prerequisito como vistas

### **El horario no se guarda**
- Asegúrate de tener al menos una materia seleccionada
- Verifica que estés autenticado

### **Hay un conflicto de horario**
- Revisa que los horarios de las materias no se superpongan
- Elige otro grupo con horario diferente

---

## 📞 Soporte

Este es un proyecto de la comunidad para la comunidad de la Universidad Distrital.

**Flujo de Prueba Recomendado:**

1. ✅ Inicia sesión con `jcperezg@udistrital.edu.co` / `test123`
2. ✅ Ve al **Perfil** y marca algunas materias adicionales
3. ✅ Ve al **Planificador** y crea un horario nuevo
4. ✅ Personaliza colores de las materias
5. ✅ Guarda el horario
6. ✅ Vuelve al **Perfil** para verificar que se guardó
7. ✅ Exporta tu horario como imagen

---

## 💝 Créditos

❤️ **Hecho de la comunidad para la comunidad de la Universidad Distrital**

© 2026 NexoUD - Planificador Académico

---

## 🎯 Próximas Características (Roadmap)

- [ ] Integración con API real de la universidad
- [ ] Notificaciones de cambios en horarios
- [ ] Compartir horarios con otros estudiantes
- [ ] Filtros avanzados (por profesor, horario, etc.)
- [ ] Modo oscuro/claro
- [ ] Sincronización en la nube
- [ ] App móvil nativa

---

**¡Disfruta planificando tu semestre académico con NexoUD! 🎓✨**
