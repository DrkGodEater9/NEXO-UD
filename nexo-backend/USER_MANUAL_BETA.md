# USER_MANUAL_BETA

## 1. Objetivo del Sistema:

NEXO-UD es una plataforma de apoyo académico para estudiantes y personal administrativo de la Universidad Distrital. Su propósito es centralizar la consulta de información institucional, facilitar la planeación de horarios, administrar contenidos públicos y permitir el seguimiento básico de novedades reportadas por los usuarios.

El sistema permite a los estudiantes registrarse con su correo institucional, consultar materias y horarios disponibles, guardar planeaciones académicas, revisar su perfil y pensum, reportar problemas, consultar sedes, bienestar, avisos y calendario académico. También permite que usuarios autorizados administren avisos, contenidos de bienestar, sedes, eventos de calendario, oferta académica, semestres, usuarios y roles.

## Glosario del Dominio:

**NEXO-UD:** Plataforma de apoyo académico para consulta de información institucional, planeación de horarios y administración de contenidos relacionados con la Universidad Distrital.

**Estudiante:** Usuario que consulta materias, arma horarios, revisa su avance académico, consulta información institucional y reporta novedades.

**Radicador:** Usuario autorizado para publicar y mantener información institucional en un módulo específico. Por ejemplo, un radicador de avisos administra publicaciones; un radicador de sedes administra información de campus.

**Administrador:** Usuario con permisos ampliados para gestionar usuarios, roles, semestres, oferta académica, sedes, avisos, calendario, bienestar y reportes.

**Pensum:** Conjunto de materias que componen un plan de estudios. En el sistema se usa para visualizar materias aprobadas, en curso, pendientes, disponibles o bloqueadas.

**Plan de estudio:** Programa académico o proyecto curricular al que pertenece un estudiante.

**Oferta Académica Activa:** Conjunto vigente de materias, grupos, docentes y horarios disponibles para consulta y planeación. El buscador y el planeador trabajan con esta oferta.

**Grupo:** Opción específica de una materia, con docente, horario y ubicación.

**Franja horaria:** Rango de tiempo usado para filtrar materias según el momento del día en que se dictan.

**Horario guardado:** Planeación creada por el estudiante y almacenada en su perfil para consulta, edición, archivo, eliminación o exportación.

**Reporte:** Novedad enviada por un estudiante para informar errores de horario, cambios de salón, información incorrecta u otro problema.

**Semestre activo:** Periodo académico marcado como vigente para orientar la operación académica dentro del sistema.

## 2. Perfiles y Permisos (Roles de Usuario):

**ESTUDIANTE**

Puede ingresar al tablero principal, consultar materias, usar el planeador de horarios, guardar horarios, revisar su perfil, consultar información institucional y reportar problemas. También puede eliminar su propia cuenta y consultar sus reportes.

**ADMINISTRADOR**

Tiene acceso completo a la administración del sistema. Puede gestionar usuarios, activar o suspender cuentas, asignar o retirar roles, cargar ofertas académicas, activar semestres, administrar sedes, calendario, avisos, bienestar, planes de estudio, materias curriculares y revisar reportes enviados por estudiantes.

**RADICADOR_AVISOS**

Puede ingresar al módulo de administración de avisos para crear, editar y eliminar publicaciones institucionales dirigidas a la universidad o a una facultad.

**RADICADOR_BIENESTAR**

Puede ingresar al módulo de bienestar para crear, editar y eliminar contenidos sobre apoyo alimentario, becas, salud mental, servicios de salud y otros recursos institucionales.

**RADICADOR_SEDES**

Puede administrar sedes, salones y fotografías asociadas a espacios físicos de la universidad.

**RADICADOR_CALENDARIO**

Puede crear, editar y eliminar eventos del calendario académico, como inscripciones, inicio de clases, parciales, festivos, paros y otros eventos.

## 3. Módulos Principales (Extraídos de las rutas y controladores):

### Registro, verificación e ingreso

Permite crear una cuenta con correo institucional, apodo, contraseña y código estudiantil. Después del registro, el usuario debe verificar su correo con un código de seis dígitos. También se permite iniciar sesión, cerrar sesión, reenviar códigos, solicitar recuperación de contraseña y establecer una nueva contraseña.

### Tablero principal

Presenta accesos rápidos a las funciones más usadas: búsqueda de materias, planeador, perfil, pensum, información de campus y horarios guardados. Muestra una visión general del estado académico del estudiante y accesos a acciones frecuentes.

### Búsqueda de materias

Permite consultar materias disponibles de la oferta académica activa. El usuario puede buscar por nombre, código o profesor, y filtrar por facultad, proyecto curricular y franja horaria.

### Planeador de horarios

Permite seleccionar grupos de materias, validar conflictos de horario, crear horarios personalizados, guardar planeaciones, editar horarios existentes, archivarlos o eliminarlos. También permite exportar un horario en PDF o imagen.

### Perfil y progreso académico

Permite consultar datos del usuario, roles asignados, código estudiantil, semestre de ingreso, facultad, carrera, pensum, materias cursadas, materias pendientes y horarios guardados. También permite solicitar cambio de apodo y actualizarlo mediante código de verificación.

### Información institucional

Agrupa contenidos públicos para consulta: avisos, calendario académico, bienestar institucional, sedes y rutas. El usuario puede revisar información general y detalles publicados por los radicadores o administradores.

### Sedes, salones y rutas

Permite consultar sedes de la universidad, ver ubicación, revisar salones asociados y calcular rutas entre puntos seleccionados en el mapa. Los usuarios con permisos pueden crear, editar o eliminar sedes, salones y fotografías.

### Avisos institucionales

Permite publicar avisos con título, cuerpo, alcance, tipo, facultad, enlaces e imágenes. Los avisos pueden ser generales o de asamblea, y pueden dirigirse a toda la universidad o a una facultad específica.

### Bienestar institucional

Permite publicar información sobre apoyo alimentario, becas, salud mental, servicios de salud y otros temas de bienestar. Cada publicación puede incluir título, descripción corta, descripción completa, categoría, enlaces e imágenes.

### Calendario académico

Permite publicar eventos académicos con título, tipo de evento, fecha de inicio, fecha de fin opcional y descripción. Los usuarios pueden consultar estos eventos desde el módulo de información.

### Administración de usuarios y roles

Permite al administrador buscar usuarios, revisar su perfil, activar o suspender cuentas, consultar roles asignados, asignar nuevos roles y retirar roles existentes.

### Administración académica

Permite administrar semestres, activar un semestre vigente, cargar archivos de oferta académica, listar ofertas cargadas, activar una oferta, eliminar ofertas, consultar planes de estudio y administrar materias curriculares de un plan.

### Reportes de problemas

Permite a los estudiantes reportar problemas relacionados con horarios, cambios de salón, información incorrecta u otros casos. El administrador puede consultar reportes, filtrarlos por estado o tipo, y actualizar su estado a pendiente, en revisión, resuelto o descartado.

## 4. Flujos de Operación Base (Casos de Uso):

### Crear una cuenta de estudiante

*Paso 1:* Ingresa a la pantalla de registro desde la página inicial o desde la opción "Crear cuenta".

`[INSERTE_CAPTURA_AQUI: Pantalla de registro de usuario]`

*Paso 2:* Llena los campos requeridos: apodo, correo institucional, código estudiantil, contraseña, confirmación de contraseña y aceptación de términos.

*Paso 3:* Verifica que el correo termine en `@udistrital.edu.co` y que el código estudiantil tenga 11 dígitos.

`[INSERTE_CAPTURA_AQUI: Validación de correo institucional y código estudiantil]`

*Paso 4:* Haz clic en "Crear cuenta".

*Paso 5:* Ingresa el código de verificación enviado al correo institucional.

`[INSERTE_CAPTURA_AQUI: Pantalla de verificación de correo]`

*Paso 6:* Confirma la verificación para activar la cuenta.

### Iniciar sesión

*Paso 1:* Ingresa a la pantalla de inicio de sesión.

`[INSERTE_CAPTURA_AQUI: Pantalla de inicio de sesión]`

*Paso 2:* Escribe el correo institucional y la contraseña.

*Paso 3:* Haz clic en "Ingresar".

*Paso 4:* El sistema abrirá el tablero principal según los permisos del usuario.

`[INSERTE_CAPTURA_AQUI: Tablero principal después del ingreso]`

### Recuperar contraseña olvidada

*Paso 1:* Ingresa a la pantalla de inicio de sesión.

`[INSERTE_CAPTURA_AQUI: Enlace de recuperación de contraseña en inicio de sesión]`

*Paso 2:* Selecciona la opción de recuperación de contraseña.

*Paso 3:* Escribe tu correo institucional.

`[INSERTE_CAPTURA_AQUI: Formulario para solicitar código de recuperación]`

*Paso 4:* Revisa tu correo e ingresa el código recibido.

*Paso 5:* Escribe la nueva contraseña y confirma el cambio.

`[INSERTE_CAPTURA_AQUI: Formulario de nueva contraseña]`

*Paso 6:* Regresa al inicio de sesión e ingresa con la nueva contraseña.

### Buscar materias disponibles

*Paso 1:* Ingresa al módulo "Buscar materias" desde el menú lateral.

`[INSERTE_CAPTURA_AQUI: Vista principal de búsqueda de materias]`

*Paso 2:* Escribe una palabra clave en el buscador. Puedes usar nombre de materia, código o profesor.

*Paso 3:* Ajusta los filtros disponibles: facultad, proyecto curricular y franja horaria.

`[INSERTE_CAPTURA_AQUI: Filtros de búsqueda de materias]`

*Paso 4:* Revisa los resultados, grupos disponibles, docente, horarios y ubicación.

### Crear y guardar un horario

*Paso 1:* Ingresa al módulo "Planeador" desde el menú lateral.

`[INSERTE_CAPTURA_AQUI: Vista inicial del planeador de horarios]`

*Paso 2:* Busca materias y selecciona los grupos que deseas incluir en el horario.

*Paso 3:* Revisa la distribución de bloques en la semana y verifica si existen cruces.

`[INSERTE_CAPTURA_AQUI: Planeador con materias seleccionadas y bloques horarios]`

*Paso 4:* Ingresa los datos principales del horario: nombre, semestre, notas opcionales y bloques seleccionados o manuales.

*Paso 5:* Guarda la información para conservar el horario en tu perfil.

`[INSERTE_CAPTURA_AQUI: Confirmación de horario guardado]`

### Editar, archivar, eliminar o exportar un horario

*Paso 1:* Ingresa al módulo "Mi Perfil".

*Paso 2:* Abre la sección "Horarios guardados".

`[INSERTE_CAPTURA_AQUI: Lista de horarios guardados en el perfil]`

*Paso 3:* Selecciona el horario que deseas modificar.

*Paso 4:* Usa las acciones disponibles: editar, archivar, eliminar, exportar PDF o exportar imagen.

`[INSERTE_CAPTURA_AQUI: Acciones disponibles sobre un horario guardado]`

*Paso 5:* Confirma la acción cuando el sistema lo solicite.

### Consultar el pensum y actualizar progreso académico

*Paso 1:* Ingresa al módulo "Mi Perfil".

*Paso 2:* Abre la sección "Mi Pensum".

`[INSERTE_CAPTURA_AQUI: Vista de pensum académico]`

*Paso 3:* Revisa las materias agrupadas por estado: aprobada, cursando, pendiente, disponible o bloqueada.

*Paso 4:* Selecciona una materia disponible para actualizar su estado cuando corresponda.

`[INSERTE_CAPTURA_AQUI: Actualización de estado de materia en el pensum]`

*Paso 5:* Guarda el cambio para actualizar el resumen académico.

### Cambiar el apodo del perfil

*Paso 1:* Ingresa al módulo "Mi Perfil".

`[INSERTE_CAPTURA_AQUI: Vista de perfil del estudiante]`

*Paso 2:* Selecciona la opción para cambiar apodo.

*Paso 3:* Solicita el código de verificación.

`[INSERTE_CAPTURA_AQUI: Solicitud de código para cambio de apodo]`

*Paso 4:* Escribe el nuevo apodo y el código recibido.

*Paso 5:* Guarda el cambio para actualizar el perfil.

`[INSERTE_CAPTURA_AQUI: Confirmación de cambio de apodo]`

### Consultar información institucional

*Paso 1:* Ingresa al módulo "Información" desde el menú lateral.

`[INSERTE_CAPTURA_AQUI: Vista general de información institucional]`

*Paso 2:* Selecciona la sección que deseas revisar: avisos, bienestar, calendario o campus.

*Paso 3:* Abre una publicación o evento para consultar su detalle.

`[INSERTE_CAPTURA_AQUI: Detalle de publicación institucional]`

*Paso 4:* Si la publicación incluye enlaces, utilízalos para ampliar la información.

### Consultar sedes y calcular una ruta

*Paso 1:* Ingresa al módulo "Información" y selecciona la sección de campus o sedes.

`[INSERTE_CAPTURA_AQUI: Mapa de sedes de la universidad]`

*Paso 2:* Selecciona una sede en el mapa para ver sus datos principales.

*Paso 3:* Haz clic en la opción para calcular una ruta.

*Paso 4:* Selecciona el punto de origen y el punto de destino.

`[INSERTE_CAPTURA_AQUI: Selección de origen y destino en el mapa]`

*Paso 5:* Revisa las alternativas de ruta, duración, distancia y pasos sugeridos.

`[INSERTE_CAPTURA_AQUI: Panel de resultado de ruta]`

### Reportar un problema

*Paso 1:* Haz clic en el botón "Reportar problema" disponible en la interfaz.

`[INSERTE_CAPTURA_AQUI: Botón y ventana de reporte de problema]`

*Paso 2:* Selecciona el tipo de reporte: error de horario, cambio de salón, información incorrecta u otro.

*Paso 3:* Llena los campos requeridos: tipo de reporte, descripción y enlace de evidencia si aplica.

`[INSERTE_CAPTURA_AQUI: Formulario de reporte de problema]`

*Paso 4:* Envía el reporte para que quede registrado.

### Administrar avisos

*Paso 1:* Ingresa al módulo "Administración" y selecciona "Avisos".

`[INSERTE_CAPTURA_AQUI: Panel de administración de avisos]`

*Paso 2:* Haz clic en "Nuevo aviso".

`[INSERTE_CAPTURA_AQUI: Formulario de creación de aviso]`

*Paso 3:* Llena los campos requeridos: título, cuerpo, alcance, tipo, facultad si aplica, enlaces e imágenes.

*Paso 4:* Guarda la información para publicar el aviso.

*Paso 5:* Para modificar un aviso existente, usa "Editar"; para retirarlo, usa "Eliminar".

`[INSERTE_CAPTURA_AQUI: Acciones de edición y eliminación de aviso]`

### Administrar bienestar

*Paso 1:* Ingresa al módulo "Administración" y selecciona "Bienestar".

`[INSERTE_CAPTURA_AQUI: Panel de administración de bienestar]`

*Paso 2:* Haz clic en "Nuevo contenido".

`[INSERTE_CAPTURA_AQUI: Formulario de creación de contenido de bienestar]`

*Paso 3:* Llena los campos requeridos: título, descripción corta, descripción completa, categoría, enlaces e imágenes.

*Paso 4:* Guarda la información para publicar el contenido.

### Administrar sedes

*Paso 1:* Ingresa al módulo "Administración" y selecciona "Sedes".

`[INSERTE_CAPTURA_AQUI: Panel de administración de sedes]`

*Paso 2:* Haz clic en "Nueva Sede".

`[INSERTE_CAPTURA_AQUI: Formulario de creación de sede]`

*Paso 3:* Llena los campos requeridos: nombre, facultad, dirección, latitud, longitud y enlace de mapa si aplica.

*Paso 4:* Guarda la información para registrar la sede.

*Paso 5:* Para modificar datos de una sede, usa "Editar"; para retirarla, usa "Eliminar".

`[INSERTE_CAPTURA_AQUI: Acciones de edición y eliminación de sede]`

### Administrar calendario académico

*Paso 1:* Ingresa al módulo "Administración" y selecciona "Calendario".

`[INSERTE_CAPTURA_AQUI: Panel de administración de calendario]`

*Paso 2:* Haz clic en "Nuevo evento".

`[INSERTE_CAPTURA_AQUI: Formulario de creación de evento académico]`

*Paso 3:* Llena los campos requeridos: título, tipo de evento, fecha de inicio, fecha fin opcional y descripción.

*Paso 4:* Guarda la información para publicar el evento.

### Administrar usuarios y roles

*Paso 1:* Ingresa al módulo "Administración" y selecciona "Gestión de Roles" o "Usuarios".

`[INSERTE_CAPTURA_AQUI: Panel de administración de usuarios y roles]`

*Paso 2:* Busca al usuario por correo o selecciónalo desde el listado.

*Paso 3:* Revisa sus datos principales: correo, apodo, estado y roles asignados.

`[INSERTE_CAPTURA_AQUI: Detalle administrativo de usuario]`

*Paso 4:* Para cambiar permisos, selecciona el rol que deseas asignar o retirar.

*Paso 5:* Para activar o suspender una cuenta, usa la acción de estado del usuario.

`[INSERTE_CAPTURA_AQUI: Cambio de estado y asignación de roles]`

### Cargar oferta académica

*Paso 1:* Ingresa al módulo "Administración" y selecciona la sección de carga de oferta académica.

`[INSERTE_CAPTURA_AQUI: Panel de carga de oferta académica]`

*Paso 2:* Selecciona el archivo de oferta académica.

*Paso 3:* Indica el semestre correspondiente.

`[INSERTE_CAPTURA_AQUI: Formulario de carga de archivo y semestre]`

*Paso 4:* Haz clic en "Subir" o "Cargar".

*Paso 5:* Revisa el resumen generado: facultades, carreras, materias, grupos, horarios y advertencias.

`[INSERTE_CAPTURA_AQUI: Resultado de carga de oferta académica]`

### Administrar semestres

*Paso 1:* Ingresa al módulo "Administración" y selecciona la configuración académica.

`[INSERTE_CAPTURA_AQUI: Panel de administración de semestres]`

*Paso 2:* Crea un semestre ingresando su nombre, por ejemplo "2026-1".

*Paso 3:* Activa el semestre que será usado como vigente.

`[INSERTE_CAPTURA_AQUI: Activación de semestre vigente]`

*Paso 4:* Elimina únicamente semestres que no estén activos.

### Revisar y gestionar reportes

*Paso 1:* Ingresa al módulo "Administración" y selecciona la sección de reportes o novedades.

`[INSERTE_CAPTURA_AQUI: Panel administrativo de reportes]`

*Paso 2:* Filtra los reportes por estado o tipo.

`[INSERTE_CAPTURA_AQUI: Filtros de reportes por estado y tipo]`

*Paso 3:* Abre el reporte para revisar descripción, evidencia y fecha de creación.

*Paso 4:* Cambia el estado del reporte a pendiente, en revisión, resuelto o descartado.

`[INSERTE_CAPTURA_AQUI: Cambio de estado de reporte]`

## Flujos Alternos y Errores Comunes:

### Si olvidaste tu contraseña

*Paso 1:* En la pantalla de inicio de sesión, selecciona la opción de recuperación.

*Paso 2:* Ingresa tu correo institucional.

*Paso 3:* Si el correo está registrado, recibirás un código para continuar el proceso.

`[INSERTE_CAPTURA_AQUI: Mensaje de código enviado para recuperación]`

*Paso 4:* Ingresa el código y define una nueva contraseña.

*Paso 5:* Si el código está vencido o no coincide, solicita uno nuevo y repite el proceso.

### Si no recibes el código de verificación

*Paso 1:* Revisa la bandeja de entrada y la carpeta de correo no deseado.

*Paso 2:* Verifica que escribiste correctamente tu correo institucional.

*Paso 3:* Usa la opción "Reenviar código".

`[INSERTE_CAPTURA_AQUI: Acción de reenvío de código de verificación]`

*Paso 4:* Si el problema continúa, contacta al canal de soporte indicado en este manual.

### Si el sistema rechaza el inicio de sesión

*Paso 1:* Confirma que el correo y la contraseña estén escritos correctamente.

*Paso 2:* Verifica que la cuenta haya sido activada con el código de correo.

*Paso 3:* Si olvidaste la contraseña, utiliza el flujo de recuperación.

`[INSERTE_CAPTURA_AQUI: Mensaje de credenciales inválidas o cuenta no activa]`

*Paso 4:* Si el administrador suspendió la cuenta, solicita revisión por el canal institucional correspondiente.

### Si no aparecen materias en el buscador

*Paso 1:* Limpia los filtros de facultad, proyecto curricular y franja horaria.

*Paso 2:* Revisa que exista una oferta académica activa para el semestre.

`[INSERTE_CAPTURA_AQUI: Buscador de materias sin resultados]`

*Paso 3:* Si eres estudiante, espera la actualización de la oferta o reporta la novedad.

*Paso 4:* Si eres administrador, revisa la carga y activación de la oferta académica.

### Si una materia o grupo no está disponible

*Paso 1:* Revisa si la materia aparece en la oferta académica activa.

*Paso 2:* Si el grupo no se puede seleccionar o no aparece con la información esperada, elige otro grupo disponible.

`[INSERTE_CAPTURA_AQUI: Materia sin grupo disponible o sin información completa]`

*Paso 3:* Si consideras que la información es incorrecta, usa "Reportar problema" con el tipo "Información incorrecta" o "Error de horario".

*Paso 4:* Espera la revisión del equipo administrador.

### Si el planeador detecta cruces de horario

*Paso 1:* Revisa los grupos seleccionados en el planeador.

*Paso 2:* Identifica las materias que ocupan el mismo día y franja.

`[INSERTE_CAPTURA_AQUI: Cruce de horario detectado en el planeador]`

*Paso 3:* Cambia uno de los grupos por otra alternativa.

*Paso 4:* Vuelve a validar el horario antes de guardarlo.

### Si no puedes guardar un horario

*Paso 1:* Verifica que el horario tenga nombre y semestre.

*Paso 2:* Revisa que existan bloques seleccionados o bloques manuales válidos.

*Paso 3:* Confirma que tu sesión siga activa.

`[INSERTE_CAPTURA_AQUI: Error al guardar horario]`

*Paso 4:* Si el error persiste, reporta el problema con una descripción detallada.

### Si no puedes editar un contenido administrativo

*Paso 1:* Verifica que tu usuario tenga el rol correspondiente al módulo.

*Paso 2:* Si tienes rol de radicador, confirma que estás ingresando al módulo permitido para tu rol.

`[INSERTE_CAPTURA_AQUI: Acceso denegado a módulo administrativo]`

*Paso 3:* Si necesitas acceso adicional, solicita al administrador la asignación del rol.

### Si una ruta en el mapa no se calcula

*Paso 1:* Verifica que seleccionaste origen y destino.

*Paso 2:* Confirma que los puntos tengan ubicación en el mapa.

`[INSERTE_CAPTURA_AQUI: Mensaje de error al calcular ruta]`

*Paso 3:* Intenta seleccionar puntos diferentes.

*Paso 4:* Si el problema continúa, reporta la novedad o contacta soporte.

### Si un reporte no cambia de estado

*Paso 1:* Verifica que estés ingresando con rol de administrador.

*Paso 2:* Revisa que el reporte siga visible en el listado.

`[INSERTE_CAPTURA_AQUI: Vista administrativa de reporte sin cambio de estado]`

*Paso 3:* Intenta actualizar la lista y repetir el cambio.

*Paso 4:* Si el sistema no permite guardar el estado, registra la novedad para soporte.

## 5. Reglas de Negocio Automatizadas:

**Regla del Sistema: correo institucional obligatorio**

El registro solo acepta correos institucionales terminados en `@udistrital.edu.co`. Si el correo no cumple esta condición, el sistema no permite crear la cuenta.

**Regla del Sistema: verificación de cuenta por código**

Después del registro, la cuenta queda pendiente de verificación. El usuario debe ingresar un código de seis dígitos para activar su cuenta.

**Regla del Sistema: vencimiento e intentos del código**

Los códigos de verificación tienen tiempo limitado de uso. Si el código vence, ya fue utilizado o se supera el número máximo de intentos, el usuario debe solicitar uno nuevo.

**Regla del Sistema: validación de código estudiantil**

El código estudiantil debe tener exactamente 11 dígitos. El sistema interpreta ese código para identificar año de ingreso, semestre, proyecto curricular y datos académicos iniciales.

**Regla del Sistema: cuenta activa requerida para iniciar sesión**

Un usuario registrado no puede iniciar sesión hasta que su cuenta esté activa. Si el usuario no ha verificado el correo, el sistema rechazará el ingreso.

**Regla del Sistema: permisos por rol**

Cada usuario solo ve las opciones autorizadas para sus roles. Los estudiantes ven funciones académicas y de consulta. Los radicadores ven únicamente el módulo que pueden gestionar. El administrador ve todos los módulos de administración.

**Regla del Sistema: redirección de radicadores**

Si un radicador tiene un solo permiso de radicación, el sistema lo dirige directamente al módulo correspondiente. Si tiene varios permisos, se muestra una pantalla para escoger el módulo.

**Regla del Sistema: estado de reportes**

Los reportes pueden pasar por estados: pendiente, en revisión, resuelto o descartado. Cuando un reporte se marca como resuelto o descartado, el sistema registra la fecha de cierre.

**Regla del Sistema: semestre activo**

Solo un semestre debe quedar como vigente para orientar la operación académica. El sistema permite activar un semestre y evita eliminar el semestre activo.

**Regla del Sistema: oferta académica activa**

La consulta de materias y el planeador trabajan con la oferta académica activa. Si no existe una oferta activa, las materias disponibles para planeación pueden no mostrarse.

**Regla del Sistema: validación de conflictos de horario**

El planeador revisa los grupos seleccionados para identificar cruces de horario. Esta validación ayuda al estudiante a evitar combinaciones incompatibles antes de guardar el horario.

**Regla del Sistema: horarios propios**

Los horarios guardados pertenecen al estudiante que los creó. Un estudiante solo puede consultar, editar, archivar, eliminar o exportar sus propios horarios.

**Regla del Sistema: eliminación de cuenta con contraseña**

Para eliminar una cuenta propia, el estudiante debe confirmar la acción ingresando su contraseña. Si la contraseña no coincide, la eliminación no se realiza.

**Regla del Sistema: rutas sujetas a disponibilidad**

El cálculo de rutas depende de que exista información de ubicación para origen y destino, y de que el servicio de rutas esté configurado. Si no hay configuración o no se encuentra una ruta, el sistema informa la situación al usuario.

## Canal de Soporte:

Si el sistema falla de forma irrecuperable, no permite iniciar sesión, no guarda cambios importantes o muestra errores repetidos, sigue estas indicaciones:

*Paso 1:* Toma una captura de pantalla del error.

`[INSERTE_CAPTURA_AQUI: Ejemplo de mensaje de error del sistema]`

*Paso 2:* Anota la fecha, hora aproximada, módulo afectado y acción que estabas realizando.

*Paso 3:* Si puedes ingresar al sistema, usa el botón "Reportar problema" y describe la situación con detalle.

`[INSERTE_CAPTURA_AQUI: Reporte de problema enviado desde la plataforma]`

*Paso 4:* Si no puedes ingresar o el error impide continuar, contacta a la mesa de ayuda OTIC o al canal institucional definido por la Universidad Distrital.

*Paso 5:* Incluye en el mensaje: nombre completo, correo institucional, código estudiantil si aplica, módulo afectado, descripción del problema y captura de pantalla.

**Contacto institucional:** Mesa de ayuda OTIC / soporte NEXO-UD. Si la Universidad define un correo específico para este sistema, debe registrarse aquí: `[CORREO_SOPORTE_INSTITUCIONAL]`.
