-- ============================================================
--  NEXO-UD  |  V7__seed_campus.sql
--  Sedes Universidad Distrital Francisco José de Caldas
-- ============================================================

INSERT INTO campuses (name, address, faculty, latitude, longitude, map_url, updated_at)
VALUES
  ('Sede Ingeniería (Sabio Caldas)',               'Calle 40 Sur No. 8B-84',           'Ingeniería',                       4.628055, -74.065277, NULL, NOW()),
  ('Sede Macarena A (Ciencias y Educación)',        'Carrera 3 No. 26A-40',             'Ciencias y Educación',             4.614416, -74.064415, NULL, NOW()),
  ('Sede Macarena B (Ciencias y Educación)',        'Carrera 3 No. 26A-40',             'Ciencias y Educación',             4.614416, -74.064415, NULL, NOW()),
  ('Sede Tecnológica',                             'Cra. 7 No. 40B-53',                'Tecnológica',                      4.577880, -74.150420, NULL, NOW()),
  ('Sede Vivero (Medio Ambiente)',                  'Carrera 5 Este No. 15-82',         'Medio Ambiente',                   4.596600, -74.065000, NULL, NOW()),
  ('Ciudadela Universitaria Bosa Porvenir',         'Diagonal 86J No. 77G-15',          'Ingeniería',                       4.629100, -74.185000, NULL, NOW()),
  ('Sede ASAB (Artes)',                            'Plaza de La Macarena No. 5-41',    'Artes',                            4.604510, -74.075420, NULL, NOW()),
  ('Edificio Calle 34',                            'Calle 34 No. 6-31',                'Ciencias y Educación',             4.623100, -74.068200, NULL, NOW()),
  ('Edificio Crisanto Luque (Ciencias)',            'Carrera 4 No. 26B-54',             'Ciencias Matemáticas y Naturales', 4.604440, -74.072700, NULL, NOW()),
  ('Aduanilla de Paiba (Biblioteca Central)',       'Av. Cra. 30 No. 45A-53',          'General',                          4.619000, -74.095000, NULL, NOW())
ON CONFLICT DO NOTHING;
