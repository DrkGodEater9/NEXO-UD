export interface Horario {
  dia: string;
  horaInicio: number;
  horaFin: number;
  ubicacion: string;
  docente?: string;
}

export interface Grupo {
  grupo: string;
  docente: string;
  inscritos: number;
  horarios: Horario[];
}

export interface Materia {
  codigo: string;
  nombre: string;
  facultad: string;
  carrera: string;
  grupos: Grupo[];
}

export const materiasData: Record<string, Materia> = {
  "2021101": {
    codigo: "2021101",
    nombre: "Cálculo Diferencial",
    facultad: "Facultad de Ingeniería",
    carrera: "Ingeniería de Sistemas",
    grupos: [
      {
        grupo: "020-01",
        docente: "Carlos Alberto Rodríguez",
        inscritos: 35,
        horarios: [
          { dia: "LUNES", horaInicio: 7, horaFin: 9, ubicacion: "Sede Tecnológica - Edificio Rojo - Salón 401" },
          { dia: "MIERCOLES", horaInicio: 7, horaFin: 9, ubicacion: "Sede Tecnológica - Edificio Rojo - Salón 401" }
        ]
      },
      {
        grupo: "020-02",
        docente: "María Teresa González",
        inscritos: 42,
        horarios: [
          { dia: "MARTES", horaInicio: 9, horaFin: 11, ubicacion: "Sede Tecnológica - Edificio Azul - Salón 302" },
          { dia: "JUEVES", horaInicio: 9, horaFin: 11, ubicacion: "Sede Tecnológica - Edificio Azul - Salón 302" }
        ]
      },
      {
        grupo: "020-03",
        docente: "Jorge Luis Pérez",
        inscritos: 28,
        horarios: [
          { dia: "VIERNES", horaInicio: 14, horaFin: 16, ubicacion: "Sede Tecnológica - Edificio Rojo - Salón 501" },
          { dia: "SABADO", horaInicio: 8, horaFin: 10, ubicacion: "Sede Tecnológica - Edificio Rojo - Salón 501" }
        ]
      }
    ]
  },
  "2021102": {
    codigo: "2021102",
    nombre: "Álgebra Lineal",
    facultad: "Facultad de Ingeniería",
    carrera: "Ingeniería de Sistemas",
    grupos: [
      {
        grupo: "020-01",
        docente: "Ana Patricia Méndez",
        inscritos: 30,
        horarios: [
          { dia: "LUNES", horaInicio: 9, horaFin: 11, ubicacion: "Sede Tecnológica - Edificio Verde - Salón 201" },
          { dia: "MIERCOLES", horaInicio: 9, horaFin: 11, ubicacion: "Sede Tecnológica - Edificio Verde - Salón 201" }
        ]
      },
      {
        grupo: "020-02",
        docente: "Roberto Sánchez",
        inscritos: 25,
        horarios: [
          { dia: "MARTES", horaInicio: 14, horaFin: 16, ubicacion: "Sede Tecnológica - Edificio Azul - Salón 401" },
          { dia: "JUEVES", horaInicio: 14, horaFin: 16, ubicacion: "Sede Tecnológica - Edificio Azul - Salón 401" }
        ]
      }
    ]
  },
  "2021103": {
    codigo: "2021103",
    nombre: "Programación I",
    facultad: "Facultad de Ingeniería",
    carrera: "Ingeniería de Sistemas",
    grupos: [
      {
        grupo: "020-01",
        docente: "Diana Carolina López",
        inscritos: 40,
        horarios: [
          { dia: "LUNES", horaInicio: 11, horaFin: 13, ubicacion: "Sede Tecnológica - Lab. Informática 1" },
          { dia: "MIERCOLES", horaInicio: 11, horaFin: 13, ubicacion: "Sede Tecnológica - Lab. Informática 1" }
        ]
      },
      {
        grupo: "020-02",
        docente: "Pedro Antonio Ramírez",
        inscritos: 38,
        horarios: [
          { dia: "MARTES", horaInicio: 16, horaFin: 18, ubicacion: "Sede Tecnológica - Lab. Informática 2" },
          { dia: "JUEVES", horaInicio: 16, horaFin: 18, ubicacion: "Sede Tecnológica - Lab. Informática 2" }
        ]
      },
      {
        grupo: "020-03",
        docente: "Laura Jiménez",
        inscritos: 32,
        horarios: [
          { dia: "VIERNES", horaInicio: 7, horaFin: 9, ubicacion: "Sede Tecnológica - Lab. Informática 3" },
          { dia: "SABADO", horaInicio: 10, horaFin: 12, ubicacion: "Sede Tecnológica - Lab. Informática 3" }
        ]
      }
    ]
  },
  "2021104": {
    codigo: "2021104",
    nombre: "Física Mecánica",
    facultad: "Facultad de Ingeniería",
    carrera: "Ingeniería de Sistemas",
    grupos: [
      {
        grupo: "020-01",
        docente: "Germán Andrés Castro",
        inscritos: 33,
        horarios: [
          { dia: "LUNES", horaInicio: 14, horaFin: 16, ubicacion: "Sede Tecnológica - Edificio Rojo - Salón 301" },
          { dia: "MIERCOLES", horaInicio: 14, horaFin: 16, ubicacion: "Sede Tecnológica - Edificio Rojo - Salón 301" }
        ]
      },
      {
        grupo: "020-02",
        docente: "Sandra Milena Torres",
        inscritos: 29,
        horarios: [
          { dia: "MARTES", horaInicio: 7, horaFin: 9, ubicacion: "Sede Tecnológica - Edificio Azul - Salón 201" },
          { dia: "JUEVES", horaInicio: 7, horaFin: 9, ubicacion: "Sede Tecnológica - Edificio Azul - Salón 201" }
        ]
      }
    ]
  },
  "2021105": {
    codigo: "2021105",
    nombre: "Humanidades I",
    facultad: "Facultad de Artes - ASAB",
    carrera: "Ingeniería de Sistemas",
    grupos: [
      {
        grupo: "020-01",
        docente: "Claudia Marcela Vargas",
        inscritos: 45,
        horarios: [
          { dia: "VIERNES", horaInicio: 9, horaFin: 11, ubicacion: "Sede ASAB - Auditorio Principal" }
        ]
      },
      {
        grupo: "020-02",
        docente: "Fernando Ortiz",
        inscritos: 40,
        horarios: [
          { dia: "SABADO", horaInicio: 7, horaFin: 9, ubicacion: "Sede ASAB - Salón 102" }
        ]
      }
    ]
  },
  "2021201": {
    codigo: "2021201",
    nombre: "Estructuras de Datos",
    facultad: "Facultad de Ingeniería",
    carrera: "Ingeniería de Sistemas",
    grupos: [
      {
        grupo: "020-01",
        docente: "Luis Fernando Martínez",
        inscritos: 36,
        horarios: [
          { dia: "LUNES", horaInicio: 16, horaFin: 18, ubicacion: "Sede Tecnológica - Lab. Informática 4" },
          { dia: "MIERCOLES", horaInicio: 16, horaFin: 18, ubicacion: "Sede Tecnológica - Lab. Informática 4" }
        ]
      },
      {
        grupo: "020-02",
        docente: "Paola Andrea Gómez",
        inscritos: 31,
        horarios: [
          { dia: "MARTES", horaInicio: 11, horaFin: 13, ubicacion: "Sede Tecnológica - Lab. Informática 5" },
          { dia: "JUEVES", horaInicio: 11, horaFin: 13, ubicacion: "Sede Tecnológica - Lab. Informática 5" }
        ]
      }
    ]
  },
  "2021202": {
    codigo: "2021202",
    nombre: "Bases de Datos I",
    facultad: "Facultad de Ingeniería",
    carrera: "Ingeniería de Sistemas",
    grupos: [
      {
        grupo: "020-01",
        docente: "Héctor Fabio Quintero",
        inscritos: 34,
        horarios: [
          { dia: "MARTES", horaInicio: 18, horaFin: 20, ubicacion: "Sede Tecnológica - Lab. Bases de Datos" },
          { dia: "JUEVES", horaInicio: 18, horaFin: 20, ubicacion: "Sede Tecnológica - Lab. Bases de Datos" }
        ]
      }
    ]
  },
  "2021203": {
    codigo: "2021203",
    nombre: "Redes de Computadores",
    facultad: "Facultad de Ingeniería",
    carrera: "Ingeniería de Sistemas",
    grupos: [
      {
        grupo: "020-01",
        docente: "Javier Alejandro Muñoz",
        inscritos: 27,
        horarios: [
          { dia: "LUNES", horaInicio: 18, horaFin: 20, ubicacion: "Sede Tecnológica - Lab. Redes" },
          { dia: "MIERCOLES", horaInicio: 18, horaFin: 20, ubicacion: "Sede Tecnológica - Lab. Redes" }
        ]
      }
    ]
  }
};

export const getFacultades = (): string[] => {
  const facultades = new Set<string>();
  Object.values(materiasData).forEach(m => facultades.add(m.facultad));
  return Array.from(facultades).sort();
};

export const getCarreras = (facultad?: string): string[] => {
  const carreras = new Set<string>();
  Object.values(materiasData).forEach(m => {
    if (!facultad || m.facultad === facultad) {
      carreras.add(m.carrera);
    }
  });
  return Array.from(carreras).sort();
};
