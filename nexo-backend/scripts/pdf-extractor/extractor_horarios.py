#!/usr/bin/env python3
#entorno virtual - pip install pdfplumber
# python scripts/pdf-extractor/extractor_horarios.py

"""
Extractor robusto de horarios - Universidad Distrital Francisco José de Caldas
Período 2026-1

Coloca los PDFs en la carpeta pdfs/ (junto a este script) antes de ejecutar.

Output:
  data.json  — lista de materias con grupos y horarios (para importar al backend)
  data.js    — mismo contenido en formato JS (para uso frontend legacy)
"""

import pdfplumber
import re
import json
import os
import sys

# ============================================================
# CONFIGURACIÓN
# ============================================================

# Directorio de PDFs relativo a este script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PDF_DIR = os.path.join(SCRIPT_DIR, 'pdfs')

PDF_FILES = [
    'horarios_20261_Facultad_Ingenieria.pdf',
    'horarios_20261_Facultad_Artes.pdf',
    'horarios_20261_Facultad_Ciencias_Mat_y_Nat.pdf',
    'horarios_20261_Facultad_Ciencias_Salud.pdf',
    'horarios_20261_Facultad_Ciencias_y_Ed.pdf',
    'horarios_20261_Facultad_Medio_Ambiente.pdf',
    'horarios_20261_Facultad_Tecnologica.pdf',
    'horarios_20261_Segunda_Lengua_IPAZUD.pdf',
]

FACULTY_NAMES = {
    'horarios_20261_Facultad_Ingenieria.pdf': 'Ingeniería',
    'horarios_20261_Facultad_Artes.pdf': 'Artes',
    'horarios_20261_Facultad_Ciencias_Mat_y_Nat.pdf': 'Ciencias Matemáticas y Naturales',
    'horarios_20261_Facultad_Ciencias_Salud.pdf': 'Ciencias de la Salud',
    'horarios_20261_Facultad_Ciencias_y_Ed.pdf': 'Ciencias y Educación',
    'horarios_20261_Facultad_Medio_Ambiente.pdf': 'Medio Ambiente',
    'horarios_20261_Facultad_Tecnologica.pdf': 'Tecnológica',
    'horarios_20261_Segunda_Lengua_IPAZUD.pdf': 'Segunda Lengua / IPAZUD',
}

DIAS_VALIDOS = ['LUNES', 'MARTES', 'MIERCOLES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'SÁBADO', 'DOMINGO']

DIA_NORMALIZE = {
    'LUNES': 'LUNES',
    'MARTES': 'MARTES',
    'MIERCOLES': 'MIERCOLES',
    'MIÉRCOLES': 'MIERCOLES',
    'JUEVES': 'JUEVES',
    'VIERNES': 'VIERNES',
    'SABADO': 'SABADO',
    'SÁBADO': 'SABADO',
    'DOMINGO': 'DOMINGO',
}

# ============================================================
# UTILIDADES
# ============================================================

def fix_encoding(text):
    if not text:
        return text
    text = text.replace('?', 'Ñ')
    return text


def normalize_dia(dia):
    dia_upper = dia.upper().strip()
    return DIA_NORMALIZE.get(dia_upper, dia_upper)


def clean_docente(raw):
    if not raw or not raw.strip():
        return "POR ASIGNAR"
    raw = raw.strip()
    raw = fix_encoding(raw)
    noise = ['POR ASIGNAR', 'Docente']
    for n in noise:
        if raw.upper() == n.upper():
            return "POR ASIGNAR"
    raw = re.sub(r'\s+', ' ', raw).strip()
    if len(raw) < 3:
        return "POR ASIGNAR"
    return raw


# ============================================================
# PARSER PRINCIPAL
# ============================================================

def join_continuation_lines(lines):
    principal_patterns = [
        r'^\d+\s+\w',
        r'^GRP\.',
        r'^INSCRITOS\s+\d',
        r'^Cod\.\s+Espacio',
        r'^ESPACIO\s+ACAD',
        r'^PROYECTO\s+CURRICULAR',
        r'^FACULTAD\s+',
        r'^Anio\s+\d',
        r'^Periodo\s+\d',
    ]

    result = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        is_principal = any(re.match(pat, stripped, re.IGNORECASE) for pat in principal_patterns)
        if is_principal:
            result.append(stripped)
        else:
            if result:
                last = result[-1]
                last_upper = last.upper()
                if last_upper.startswith('ESPACIO ACAD'):
                    result[-1] = last + ' ' + stripped
                # overflow de grilla: descartar
    return result


def parse_schedule_line(line):
    line = line.strip()
    if not line:
        return None

    code_match = re.match(r'^(\d+)\s+', line)
    if not code_match:
        return None

    codigo = code_match.group(1)
    rest = line[code_match.end():]

    dia_found = None
    dia_pos = -1
    for dia in DIAS_VALIDOS:
        pattern = r'\b' + dia + r'\b'
        m = re.search(pattern, rest.upper())
        if m:
            after_dia = rest[m.end():].strip()
            hora_match = re.match(r'(\d{1,2})-(\d{1,2})', after_dia)
            if hora_match:
                dia_found = dia
                dia_pos = m.start()
                break

    if not dia_found:
        return None

    nombre_materia = rest[:dia_pos].strip()
    after_dia_text = rest[dia_pos + len(dia_found):].strip()
    hora_match = re.match(r'(\d{1,2})-(\d{1,2})', after_dia_text)
    if not hora_match:
        return None

    hora_inicio = int(hora_match.group(1))
    hora_fin = int(hora_match.group(2))

    if hora_inicio < 5 or hora_inicio > 22 or hora_fin < 6 or hora_fin > 23:
        return None
    if hora_fin <= hora_inicio:
        return None

    ubicacion_docente = after_dia_text[hora_match.end():].strip()
    ubicacion, docente = split_ubicacion_docente(ubicacion_docente)

    return {
        'codigo': codigo,
        'nombre_materia': nombre_materia,
        'dia': normalize_dia(dia_found),
        'horaInicio': hora_inicio,
        'horaFin': hora_fin,
        'ubicacion': fix_encoding(ubicacion),
        'docente': clean_docente(docente),
    }


def split_ubicacion_docente(text):
    text = text.strip()
    if not text:
        return ("POR ASIGNAR", "POR ASIGNAR")

    if re.match(r'^(POR\s+ASIGNAR\s*)+$', text, re.IGNORECASE):
        return ("POR ASIGNAR", "POR ASIGNAR")

    pa_match = re.search(r'\s+POR\s+ASIGNAR\s*$', text, re.IGNORECASE)
    if pa_match:
        ubicacion = text[:pa_match.start()].strip()
        if not ubicacion:
            ubicacion = "POR ASIGNAR"
        return (ubicacion, "POR ASIGNAR")

    location_words = {
        'AULA', 'SALON', 'LABORATORIO', 'BLOQUE', 'SALA', 'EDIFICIO',
        'CALLE', 'MODALIDAD', 'VIRTUAL', 'PORVENIR', 'MACARENA',
        'TECNOLOGICA', 'VIVERO', 'NATURA', 'CASA', 'AUTONOMA',
        'AUDITORIO', 'TORRE', 'SABIO', 'CALDAS', 'ADMINISTRATIVO',
        'PALACIO', 'MERCED', 'SOTANO', 'CIENCIAS', 'SALUD', 'ASAB',
        'ACADEMIA', 'SUPERIOR', 'ARTES', 'CRISANTO', 'LUQUE',
        'MONJAS', 'TECHNE', 'DIBUJO', 'MAGISTRAL', 'CONVENCIONAL',
        'GRUPAL', 'TRABAJO', 'MULTIPLE', 'SOFTWARE', 'INFORMATICA',
        'MUSICA', 'MET', 'MTCM', 'DIGITAL', 'BASICAS', 'CLASE',
        'SISTEMAS', 'ESPECIALIZADA', 'INFORMATICA', 'CONVENCIONAL',
        'POR', 'ASIGNAR', 'PARA', 'NATURA',
    }

    tokens = text.split()
    if len(tokens) <= 1:
        if tokens[0].upper() in location_words or tokens[0].isdigit():
            return (text, "POR ASIGNAR")
        return ("POR ASIGNAR", text)

    docente_start_idx = len(tokens)
    consecutive_name_words = 0

    for i in range(len(tokens) - 1, -1, -1):
        word = tokens[i].upper().strip('.,;:()')
        is_number = bool(re.match(r'^[\d]+[A-Z]?$', word))
        is_alpha = bool(re.match(r'^[A-ZÁÉÍÓÚÑ?]+$', word))
        is_location = word in location_words
        is_short_code = len(word) <= 2 and is_number

        if is_alpha and not is_location and len(word) >= 2:
            consecutive_name_words += 1
            docente_start_idx = i
        elif is_number or is_location or is_short_code:
            break
        elif word in ('DE', 'DEL', 'LA', 'LOS', 'LAS', 'Y'):
            if consecutive_name_words >= 1:
                consecutive_name_words += 1
                docente_start_idx = i
            else:
                break
        else:
            break

    if consecutive_name_words < 2:
        return (text, "POR ASIGNAR")

    ubicacion_tokens = tokens[:docente_start_idx]
    docente_tokens = tokens[docente_start_idx:]
    ubicacion = ' '.join(ubicacion_tokens).strip()
    docente = ' '.join(docente_tokens).strip()

    if not ubicacion:
        ubicacion = "POR ASIGNAR"
    if not docente or len(docente) < 3:
        docente = "POR ASIGNAR"

    return (ubicacion, docente)


# ============================================================
# PARSER DE ESTRUCTURA DEL PDF
# ============================================================

def parse_pdf(pdf_path, faculty_name):
    print(f"\nProcesando: {pdf_path} ({faculty_name})")

    if not os.path.exists(pdf_path):
        print(f"  [ERROR] Archivo no encontrado: {pdf_path}")
        return {}

    pdf = pdfplumber.open(pdf_path)
    full_text = ""
    for page in pdf.pages:
        text = page.extract_text() or ""
        full_text += text + "\n"
    pdf.close()

    raw_lines = full_text.split('\n')
    lines = join_continuation_lines(raw_lines)

    # Paso 1: mapear código de carrera -> nombre
    career_map = {}
    current_career_name = None

    for line in lines:
        line_stripped = line.strip()
        pc_match = re.match(r'PROYECTO\s+CURRICULAR\s+(.+)', line_stripped, re.IGNORECASE)
        if pc_match:
            current_career_name = pc_match.group(1).strip()
            continue
        grp_match = re.match(r'GRP\.\s*(\d{1,4})\s*-\s*(\d{1,4})', line_stripped, re.IGNORECASE)
        if grp_match and current_career_name:
            code = grp_match.group(1)
            if code not in career_map:
                career_map[code] = current_career_name

    print(f"  Carreras detectadas: {len(career_map)}")
    for code, name in sorted(career_map.items()):
        print(f"    {code}: {name}")

    # Paso 2: parsear materias y grupos
    materias = {}
    current_career = None
    current_materia_name = None
    current_materia_code = None
    current_grupo = None
    current_career_code = None
    current_inscritos = 0
    current_horarios = []
    last_known_career_code = None
    implicit_group_counter = 0

    def save_group():
        nonlocal current_horarios, current_grupo, current_inscritos
        if not current_horarios or not current_materia_code:
            return
        cc = current_career_code or last_known_career_code or "000"
        carrera_name = career_map.get(cc, current_career or f"Carrera {cc}")
        key = f"{faculty_name}|{cc}|{current_materia_code}"
        if key not in materias:
            materias[key] = {
                'codigo': current_materia_code,
                'nombre': fix_encoding(current_materia_name or "SIN NOMBRE"),
                'facultad': faculty_name,
                'carrera': fix_encoding(carrera_name),
                'carrera_codigo': cc,
                'grupos': [],
            }
        docentes = [h['docente'] for h in current_horarios if h.get('docente') != 'POR ASIGNAR']
        docente_principal = docentes[0] if docentes else "POR ASIGNAR"
        grupo_code = current_grupo or f"IMPL-{implicit_group_counter}"
        horarios_clean = [
            {
                'dia': h['dia'],
                'horaInicio': h['horaInicio'],
                'horaFin': h['horaFin'],
                'ubicacion': h.get('ubicacion', 'POR ASIGNAR'),
            }
            for h in current_horarios
        ]
        materias[key]['grupos'].append({
            'grupo': grupo_code,
            'inscritos': current_inscritos,
            'docente': fix_encoding(docente_principal),
            'horarios': horarios_clean,
        })

    for line in lines:
        line_stripped = line.strip()
        line_upper = line_stripped.upper()

        pc_match = re.match(r'PROYECTO\s+CURRICULAR\s+(.+)', line_stripped, re.IGNORECASE)
        if pc_match:
            current_career = pc_match.group(1).strip()
            continue

        ea_match = re.match(r'ESPACIO\s+ACAD[EÉ]MICO\s+(.+)', line_stripped, re.IGNORECASE)
        if ea_match:
            save_group()
            current_materia_name = ea_match.group(1).strip()
            current_materia_code = None
            current_grupo = None
            current_career_code = None
            current_inscritos = 0
            current_horarios = []
            implicit_group_counter = 0
            continue

        grp_match = re.match(r'GRP\.\s*(\d{1,4})\s*-\s*(\d{1,4})', line_stripped, re.IGNORECASE)
        if grp_match:
            save_group()
            current_career_code = grp_match.group(1)
            last_known_career_code = current_career_code
            current_grupo = f"{grp_match.group(1)}-{grp_match.group(2)}"
            current_inscritos = 0
            current_horarios = []
            continue

        ins_match = re.match(r'INSCRITOS\s+(\d+)', line_stripped, re.IGNORECASE)
        if ins_match:
            current_inscritos = int(ins_match.group(1))
            continue

        if line_upper.startswith('COD.') or line_upper.startswith('COD '):
            continue
        if re.match(r'^(ANIO|PERIODO|FACULTAD)\s', line_upper):
            continue

        parsed = parse_schedule_line(line_stripped)
        if parsed:
            if not current_materia_code:
                current_materia_code = parsed['codigo']
            if parsed['nombre_materia'] and len(parsed['nombre_materia']) > 3:
                if not current_materia_name or current_materia_name == "SIN NOMBRE":
                    current_materia_name = parsed['nombre_materia']
            if not current_grupo and not current_horarios:
                implicit_group_counter += 1
                current_grupo = None
                if not current_career_code and last_known_career_code:
                    current_career_code = last_known_career_code
            conflict = any(
                h['dia'] == parsed['dia'] and h['horaInicio'] == parsed['horaInicio']
                for h in current_horarios
            )
            if conflict:
                save_group()
                implicit_group_counter += 1
                current_grupo = None
                current_horarios = []
                current_inscritos = 0
            current_horarios.append({
                'dia': parsed['dia'],
                'horaInicio': parsed['horaInicio'],
                'horaFin': parsed['horaFin'],
                'ubicacion': parsed['ubicacion'],
                'docente': parsed['docente'],
            })

    save_group()

    total_grupos = sum(len(m['grupos']) for m in materias.values())
    total_horarios = sum(
        sum(len(g['horarios']) for g in m['grupos'])
        for m in materias.values()
    )
    print(f"  Materias: {len(materias)}")
    print(f"  Grupos: {total_grupos}")
    print(f"  Horarios individuales: {total_horarios}")

    return materias


# ============================================================
# VALIDACIÓN
# ============================================================

def validate_materias(materias):
    warnings = []
    for key, mat in materias.items():
        for grupo in mat['grupos']:
            horarios = grupo['horarios']
            total_horas = sum(h['horaFin'] - h['horaInicio'] for h in horarios)
            if total_horas > 8:
                warnings.append(
                    f"[WARN] {mat['nombre']} (GRP {grupo['grupo']}): "
                    f"{total_horas} horas semanales (posible error)"
                )
            seen = set()
            for h in horarios:
                sig = (h['dia'], h['horaInicio'], h['horaFin'])
                if sig in seen:
                    warnings.append(
                        f"[WARN] {mat['nombre']} (GRP {grupo['grupo']}): "
                        f"Horario duplicado {h['dia']} {h['horaInicio']}-{h['horaFin']}"
                    )
                seen.add(sig)
            doc = grupo['docente']
            if doc != "POR ASIGNAR":
                loc_words = ['AULA', 'SALON', 'BLOQUE', 'LABORATORIO', 'EDIFICIO', 'CALLE']
                for lw in loc_words:
                    if re.search(r'\b' + lw + r'\b', doc.upper()):
                        warnings.append(
                            f"[WARN] {mat['nombre']} (GRP {grupo['grupo']}): "
                            f"Docente parece ubicación: '{doc}'"
                        )
                        break
    return warnings


# ============================================================
# GENERADORES DE OUTPUT
# ============================================================

def generate_json(materias, output_path):
    output = []
    for key, mat in sorted(materias.items(), key=lambda x: (x[1]['facultad'], x[1]['carrera'], x[1]['nombre'])):
        output.append({
            'codigo': mat['codigo'],
            'nombre': mat['nombre'],
            'facultad': mat['facultad'],
            'carrera': mat['carrera'],
            'carrera_codigo': mat['carrera_codigo'],
            'grupos': mat['grupos'],
        })
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"\nJSON generado: {output_path}")
    return output


def generate_js(materias, output_path):
    facultades = sorted(set(m['facultad'] for m in materias.values()))
    carreras = sorted(set(m['carrera'] for m in materias.values()))

    js = "// Datos de materias y horarios - Universidad Distrital\n"
    js += "// Generado automáticamente\n\n"
    js += "const facultadesDisponibles = [\n"
    for f in facultades:
        js += f'    "{f}",\n'
    js += "];\n\nconst carrerasDisponibles = [\n"
    for c in carreras:
        js += f'    "{c}",\n'
    js += "];\n\nconst materiasData = [\n"

    for key, mat in sorted(materias.items(), key=lambda x: (x[1]['facultad'], x[1]['carrera'], x[1]['nombre'])):
        nombre = mat['nombre'].replace('"', '\\"').replace("'", "\\'")
        carrera = mat['carrera'].replace('"', '\\"')
        js += "    {\n"
        js += f'        codigo: "{mat["codigo"]}",\n'
        js += f'        nombre: "{nombre}",\n'
        js += f'        facultad: "{mat["facultad"]}",\n'
        js += f'        carrera: "{carrera}",\n'
        js += f'        carrera_codigo: "{mat["carrera_codigo"]}",\n'
        js += "        grupos: [\n"
        for grupo in mat['grupos']:
            docente = grupo['docente'].replace('"', '\\"')
            js += "            {\n"
            js += f'                grupo: "{grupo["grupo"]}",\n'
            js += f'                inscritos: {grupo["inscritos"]},\n'
            js += f'                docente: "{docente}",\n'
            js += "                horarios: [\n"
            for h in grupo['horarios']:
                ubi = h['ubicacion'].replace('"', '\\"')
                js += f'                    {{ dia: "{h["dia"]}", horaInicio: {h["horaInicio"]}, horaFin: {h["horaFin"]}, ubicacion: "{ubi}" }},\n'
            js += "                ]\n            },\n"
        js += "        ]\n    },\n"

    js += "];\n"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(js)
    print(f"JS generado: {output_path}")


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    print("=" * 60)
    print("PROCESADOR DE HORARIOS v2.0")
    print("Universidad Distrital Francisco José de Caldas - 2026-1")
    print("=" * 60)

    all_materias = {}

    for pdf_file in PDF_FILES:
        faculty = FACULTY_NAMES.get(pdf_file, "Desconocida")
        pdf_path = os.path.join(PDF_DIR, pdf_file)
        pdf_materias = parse_pdf(pdf_path, faculty)
        for key, mat in pdf_materias.items():
            if key in all_materias:
                all_materias[key]['grupos'].extend(mat['grupos'])
            else:
                all_materias[key] = mat

    print("\n" + "=" * 60)
    print("VALIDACIÓN")
    print("=" * 60)
    warnings = validate_materias(all_materias)
    if warnings:
        print(f"\n{len(warnings)} advertencias:")
        for w in warnings[:30]:
            print(f"  {w}")
        if len(warnings) > 30:
            print(f"  ... y {len(warnings) - 30} más")
    else:
        print("Sin advertencias.")

    print("\n" + "=" * 60)
    print("GENERANDO ARCHIVOS")
    print("=" * 60)
    generate_json(all_materias, os.path.join(os.path.dirname(SCRIPT_DIR), 'data.json'))
    generate_js(all_materias, os.path.join(os.path.dirname(SCRIPT_DIR), 'data.js'))

    total_materias = len(all_materias)
    total_grupos = sum(len(m['grupos']) for m in all_materias.values())
    total_horarios = sum(
        sum(len(g['horarios']) for g in m['grupos'])
        for m in all_materias.values()
    )
    facultades = set(m['facultad'] for m in all_materias.values())
    carreras = set(m['carrera'] for m in all_materias.values())

    print(f"\n{'='*60}")
    print("RESUMEN FINAL")
    print('='*60)
    print(f"Facultades: {len(facultades)}")
    print(f"Carreras: {len(carreras)}")
    print(f"Materias únicas: {total_materias}")
    print(f"Grupos totales: {total_grupos}")
    print(f"Horarios individuales: {total_horarios}")
    print("\nPor facultad:")
    by_fac = {}
    for m in all_materias.values():
        fac = m['facultad']
        if fac not in by_fac:
            by_fac[fac] = {'materias': 0, 'grupos': 0}
        by_fac[fac]['materias'] += 1
        by_fac[fac]['grupos'] += len(m['grupos'])
    for fac in sorted(by_fac.keys()):
        info = by_fac[fac]
        print(f"  {fac}: {info['materias']} materias, {info['grupos']} grupos")
