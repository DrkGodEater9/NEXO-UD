export interface MateriasPensum {
  codigo: string;
  nombre: string;
  creditos: number;
  semestre: number;
  prerequisitos: string[];
  tipo: 'obligatoria' | 'electiva' | 'libre';
}

export const pensumSistemas: MateriasPensum[] = [
  // Semestre 1
  { codigo: '2021101', nombre: 'Cálculo Diferencial', creditos: 4, semestre: 1, prerequisitos: [], tipo: 'obligatoria' },
  { codigo: '2021102', nombre: 'Álgebra Lineal', creditos: 4, semestre: 1, prerequisitos: [], tipo: 'obligatoria' },
  { codigo: '2021103', nombre: 'Programación I', creditos: 4, semestre: 1, prerequisitos: [], tipo: 'obligatoria' },
  { codigo: '2021104', nombre: 'Física Mecánica', creditos: 4, semestre: 1, prerequisitos: [], tipo: 'obligatoria' },
  { codigo: '2021105', nombre: 'Humanidades I', creditos: 3, semestre: 1, prerequisitos: [], tipo: 'obligatoria' },

  // Semestre 2
  { codigo: '2021201', nombre: 'Cálculo Integral', creditos: 4, semestre: 2, prerequisitos: ['2021101'], tipo: 'obligatoria' },
  { codigo: '2021202', nombre: 'Matemáticas Discretas', creditos: 4, semestre: 2, prerequisitos: ['2021102'], tipo: 'obligatoria' },
  { codigo: '2021203', nombre: 'Programación II', creditos: 4, semestre: 2, prerequisitos: ['2021103'], tipo: 'obligatoria' },
  { codigo: '2021204', nombre: 'Física de Campos', creditos: 4, semestre: 2, prerequisitos: ['2021104'], tipo: 'obligatoria' },
  { codigo: '2021205', nombre: 'Humanidades II', creditos: 3, semestre: 2, prerequisitos: ['2021105'], tipo: 'obligatoria' },

  // Semestre 3
  { codigo: '2021301', nombre: 'Ecuaciones Diferenciales', creditos: 4, semestre: 3, prerequisitos: ['2021201'], tipo: 'obligatoria' },
  { codigo: '2021302', nombre: 'Estructuras de Datos', creditos: 4, semestre: 3, prerequisitos: ['2021203'], tipo: 'obligatoria' },
  { codigo: '2021303', nombre: 'Arquitectura de Computadores', creditos: 4, semestre: 3, prerequisitos: ['2021204'], tipo: 'obligatoria' },
  { codigo: '2021304', nombre: 'Probabilidad y Estadística', creditos: 4, semestre: 3, prerequisitos: ['2021201'], tipo: 'obligatoria' },
  { codigo: '2021305', nombre: 'Teoría de Sistemas', creditos: 3, semestre: 3, prerequisitos: [], tipo: 'obligatoria' },

  // Semestre 4
  { codigo: '2021401', nombre: 'Análisis Numérico', creditos: 4, semestre: 4, prerequisitos: ['2021301'], tipo: 'obligatoria' },
  { codigo: '2021402', nombre: 'Algoritmos', creditos: 4, semestre: 4, prerequisitos: ['2021302'], tipo: 'obligatoria' },
  { codigo: '2021403', nombre: 'Sistemas Operativos', creditos: 4, semestre: 4, prerequisitos: ['2021303'], tipo: 'obligatoria' },
  { codigo: '2021404', nombre: 'Bases de Datos I', creditos: 4, semestre: 4, prerequisitos: ['2021302'], tipo: 'obligatoria' },
  { codigo: '2021405', nombre: 'Ingeniería de Software I', creditos: 4, semestre: 4, prerequisitos: ['2021302'], tipo: 'obligatoria' },

  // Semestre 5
  { codigo: '2021501', nombre: 'Investigación de Operaciones', creditos: 4, semestre: 5, prerequisitos: ['2021401'], tipo: 'obligatoria' },
  { codigo: '2021502', nombre: 'Teoría de la Computación', creditos: 4, semestre: 5, prerequisitos: ['2021402'], tipo: 'obligatoria' },
  { codigo: '2021503', nombre: 'Redes de Computadores', creditos: 4, semestre: 5, prerequisitos: ['2021403'], tipo: 'obligatoria' },
  { codigo: '2021504', nombre: 'Bases de Datos II', creditos: 4, semestre: 5, prerequisitos: ['2021404'], tipo: 'obligatoria' },
  { codigo: '2021505', nombre: 'Ingeniería de Software II', creditos: 4, semestre: 5, prerequisitos: ['2021405'], tipo: 'obligatoria' },

  // Semestre 6
  { codigo: '2021601', nombre: 'Modelado y Simulación', creditos: 4, semestre: 6, prerequisitos: ['2021501'], tipo: 'obligatoria' },
  { codigo: '2021602', nombre: 'Compiladores', creditos: 4, semestre: 6, prerequisitos: ['2021502'], tipo: 'obligatoria' },
  { codigo: '2021603', nombre: 'Arquitecturas de Software', creditos: 4, semestre: 6, prerequisitos: ['2021505'], tipo: 'obligatoria' },
  { codigo: '2021604', nombre: 'Seguridad Informática', creditos: 4, semestre: 6, prerequisitos: ['2021503'], tipo: 'obligatoria' },
  { codigo: '2021605', nombre: 'Inteligencia Artificial', creditos: 4, semestre: 6, prerequisitos: ['2021402'], tipo: 'obligatoria' },

  // Semestre 7
  { codigo: '2021701', nombre: 'Gestión de Proyectos', creditos: 3, semestre: 7, prerequisitos: ['2021505'], tipo: 'obligatoria' },
  { codigo: '2021702', nombre: 'Computación Móvil', creditos: 4, semestre: 7, prerequisitos: ['2021603'], tipo: 'obligatoria' },
  { codigo: '2021703', nombre: 'Análisis y Diseño de Sistemas', creditos: 4, semestre: 7, prerequisitos: ['2021603'], tipo: 'obligatoria' },
  { codigo: 'ELEC701', nombre: 'Electiva I', creditos: 4, semestre: 7, prerequisitos: [], tipo: 'electiva' },
  { codigo: 'ELEC702', nombre: 'Electiva II', creditos: 4, semestre: 7, prerequisitos: [], tipo: 'electiva' },

  // Semestre 8
  { codigo: '2021801', nombre: 'Emprendimiento', creditos: 3, semestre: 8, prerequisitos: ['2021701'], tipo: 'obligatoria' },
  { codigo: '2021802', nombre: 'Trabajo de Grado I', creditos: 4, semestre: 8, prerequisitos: ['2021701'], tipo: 'obligatoria' },
  { codigo: 'ELEC801', nombre: 'Electiva III', creditos: 4, semestre: 8, prerequisitos: [], tipo: 'electiva' },
  { codigo: 'ELEC802', nombre: 'Electiva IV', creditos: 4, semestre: 8, prerequisitos: [], tipo: 'electiva' },
  { codigo: 'LIBRE801', nombre: 'Libre Elección I', creditos: 3, semestre: 8, prerequisitos: [], tipo: 'libre' },

  // Semestre 9
  { codigo: '2021901', nombre: 'Trabajo de Grado II', creditos: 6, semestre: 9, prerequisitos: ['2021802'], tipo: 'obligatoria' },
  { codigo: 'ELEC901', nombre: 'Electiva V', creditos: 4, semestre: 9, prerequisitos: [], tipo: 'electiva' },
  { codigo: 'ELEC902', nombre: 'Electiva VI', creditos: 4, semestre: 9, prerequisitos: [], tipo: 'electiva' },
  { codigo: 'LIBRE901', nombre: 'Libre Elección II', creditos: 3, semestre: 9, prerequisitos: [], tipo: 'libre' },

  // Semestre 10
  { codigo: '2021001', nombre: 'Práctica Profesional', creditos: 6, semestre: 10, prerequisitos: ['2021901'], tipo: 'obligatoria' },
  { codigo: 'LIBRE1001', nombre: 'Libre Elección III', creditos: 3, semestre: 10, prerequisitos: [], tipo: 'libre' },
];

export const getTotalCreditos = (materias: string[]): number => {
  return pensumSistemas
    .filter(m => materias.includes(m.codigo))
    .reduce((sum, m) => sum + m.creditos, 0);
};

export const getTotalCreditosPensum = (): number => {
  return pensumSistemas.reduce((sum, m) => sum + m.creditos, 0);
};

export const getMateriasBySemestre = (semestre: number): MateriasPensum[] => {
  return pensumSistemas.filter(m => m.semestre === semestre);
};

export const canTakeMateria = (codigo: string, materiasVistas: string[]): boolean => {
  const materia = pensumSistemas.find(m => m.codigo === codigo);
  if (!materia) return false;
  
  return materia.prerequisitos.every(prereq => materiasVistas.includes(prereq));
};
