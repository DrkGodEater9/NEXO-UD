/**
 * DATOS DE PRUEBA PARA NEXOUD
 * 
 * Este archivo contiene usuarios de prueba pre-configurados
 * para facilitar el testing de la aplicación.
 */

export const testUsers = [
  {
    id: '1',
    nombre: 'Juan Carlos Pérez González',
    codigo: '20211020001',
    correo: 'jcperezg@udistrital.edu.co',
    password: 'test123',
    materiasVistas: [
      '2021101', // Cálculo Diferencial
      '2021102', // Álgebra Lineal
      '2021103', // Programación I
      '2021104', // Física Mecánica
      '2021105', // Humanidades I
      '2021201', // Cálculo Integral
      '2021202', // Matemáticas Discretas
      '2021203', // Programación II
    ],
    horariosGuardados: [
      {
        id: 'h1',
        nombre: 'Horario Semestre 2026-1',
        fecha: '2026-01-15T10:30:00.000Z',
        materias: [
          {
            codigo: '2021301',
            nombre: 'Ecuaciones Diferenciales',
            grupo: '020-01',
            docente: 'María González',
            color: 'color-1',
            customHex: '#ec4899'
          },
          {
            codigo: '2021302',
            nombre: 'Estructuras de Datos',
            grupo: '020-01',
            docente: 'Luis Martínez',
            color: 'color-2',
            customHex: '#a855f7'
          }
        ]
      }
    ]
  },
  {
    id: '2',
    nombre: 'María Fernanda López Ramírez',
    codigo: '20211020002',
    correo: 'mflopezr@udistrital.edu.co',
    password: 'test123',
    materiasVistas: [
      '2021101',
      '2021102',
      '2021103',
      '2021104',
      '2021105',
    ],
    horariosGuardados: []
  },
  {
    id: '3',
    nombre: 'Andrés Felipe Martínez Silva',
    codigo: '20211020003',
    correo: 'afmartinezs@udistrital.edu.co',
    password: 'test123',
    materiasVistas: [],
    horariosGuardados: []
  }
];

/**
 * Función para inicializar datos de prueba en localStorage
 * Se ejecuta automáticamente si no hay usuarios en localStorage
 */
export function initializeTestData() {
  const existingUsers = localStorage.getItem('nexoud_users');
  
  if (!existingUsers) {
    localStorage.setItem('nexoud_users', JSON.stringify(testUsers));
    console.log('✅ Datos de prueba inicializados');
    console.log('📧 Usuarios disponibles:');
    testUsers.forEach(user => {
      console.log(`   - ${user.nombre}`);
      console.log(`     Correo: ${user.correo}`);
      console.log(`     Código: ${user.codigo}`);
      console.log(`     Contraseña: ${user.password}`);
      console.log('');
    });
  }
}

// Auto-ejecutar al cargar el módulo
if (typeof window !== 'undefined') {
  initializeTestData();
}

/**
 * INSTRUCCIONES DE USO:
 * 
 * 1. REGISTRO DE NUEVO USUARIO:
 *    - Ir a /register
 *    - Llenar formulario con:
 *      * Nombre completo
 *      * Código estudiantil (11 dígitos)
 *      * Correo institucional (@udistrital.edu.co)
 *      * Contraseña (mínimo 6 caracteres)
 *    - Verificar con código: 123456
 * 
 * 2. INICIO DE SESIÓN (usuarios de prueba):
 *    Opción A - Usuario con historial:
 *    - Correo: jcperezg@udistrital.edu.co
 *    - Código: 20211020001
 *    - Contraseña: test123
 * 
 *    Opción B - Usuario nuevo:
 *    - Correo: mflopezr@udistrital.edu.co
 *    - Código: 20211020002
 *    - Contraseña: test123
 * 
 *    Opción C - Usuario vacío:
 *    - Correo: afmartinezs@udistrital.edu.co
 *    - Código: 20211020003
 *    - Contraseña: test123
 * 
 * 3. FUNCIONALIDADES:
 *    - Landing Page: Página principal con info del sistema
 *    - Planificador: Crear horarios, detectar conflictos, personalizar colores
 *    - Perfil: Ver pensum, marcar materias vistas, ver horarios guardados
 * 
 * 4. FLUJO RECOMENDADO:
 *    a. Registrarse o iniciar sesión
 *    b. Ir al Perfil y marcar algunas materias como vistas
 *    c. Ir al Planificador y crear un horario
 *    d. Guardar el horario
 *    e. Volver al Perfil para ver el horario guardado
 */
