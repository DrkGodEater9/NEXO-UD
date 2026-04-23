INSERT INTO flyway_schema_history
    (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
VALUES
    (2, '2', 'add student fields', 'SQL', 'V2__add_student_fields.sql',  748932011, 'postgres', NOW(), 15, TRUE),
    (3, '3', 'seed study plans',   'SQL', 'V3__seed_study_plans.sql',    -812345678, 'postgres', NOW(), 20, TRUE),
    (4, '4', 'insert super admin', 'SQL', 'V4__insert_super_admin.sql',   123456789, 'postgres', NOW(), 10, TRUE),
    (5, '5', 'create semesters',   'SQL', 'V5__create_semesters.sql',    -987654321, 'postgres', NOW(), 10, TRUE);
