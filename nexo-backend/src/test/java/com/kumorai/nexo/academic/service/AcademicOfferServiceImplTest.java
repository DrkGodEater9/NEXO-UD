package com.kumorai.nexo.academic.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kumorai.nexo.academic.dto.AcademicOfferResponse;
import com.kumorai.nexo.academic.dto.AcademicOfferUploadResponse;
import com.kumorai.nexo.academic.entity.AcademicOffer;
import com.kumorai.nexo.academic.entity.Semester;
import com.kumorai.nexo.academic.entity.StudyPlan;
import com.kumorai.nexo.academic.entity.Subject;
import com.kumorai.nexo.academic.entity.SubjectGroup;
import com.kumorai.nexo.academic.repository.AcademicOfferRepository;
import com.kumorai.nexo.academic.repository.SemesterRepository;
import com.kumorai.nexo.academic.repository.StudyPlanRepository;
import com.kumorai.nexo.academic.repository.SubjectGroupRepository;
import com.kumorai.nexo.academic.repository.SubjectRepository;
import com.kumorai.nexo.academic.repository.TimeBlockRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AcademicOfferServiceImpl - Pruebas Unitarias")
class AcademicOfferServiceImplTest {

    @Mock private AcademicOfferRepository  offerRepository;
    @Mock private StudyPlanRepository      studyPlanRepository;
    @Mock private SubjectRepository        subjectRepository;
    @Mock private SubjectGroupRepository   subjectGroupRepository;
    @Mock private TimeBlockRepository      timeBlockRepository;
    @Mock private SemesterRepository       semesterRepository;
    @Mock private ObjectMapper             objectMapper;

    @InjectMocks
    private AcademicOfferServiceImpl academicOfferService;

    // Helper — ObjectMapper real para construir JsonNodes en los tests de upload
    private final ObjectMapper realMapper = new ObjectMapper();

    private Semester semestreActivo;
    private AcademicOffer oferta;
    private StudyPlan plan;

    @BeforeEach
    void setUp() {
        semestreActivo = Semester.builder().id(1L).name("2025-1").active(true).build();

        oferta = AcademicOffer.builder()
                .id(10L)
                .semester("2025-1")
                .uploadedBy(1L)
                .active(false)
                .build();

        plan = StudyPlan.builder()
                .id(5L).codigoPlan("2016202").nombre("Ing. de Sistemas").facultad("Ingeniería").build();
    }

    // ─── getActive ────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("getActive()")
    class GetActive {

        @Test
        @DisplayName("Debe retornar la oferta activa del semestre configurado")
        void debeRetornarOfertaActiva_cuandoExiste() {
            when(semesterRepository.findByActiveTrue()).thenReturn(Optional.of(semestreActivo));
            when(offerRepository.findFirstBySemesterOrderByUploadedAtDesc("2025-1"))
                    .thenReturn(Optional.of(oferta));

            AcademicOfferResponse result = academicOfferService.getActive();

            assertThat(result).isNotNull();
            assertThat(result.id()).isEqualTo(10L);
            assertThat(result.semester()).isEqualTo("2025-1");
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando no hay semestre activo configurado")
        void debeLanzarExcepcion_cuandoNoHaySemestreActivo() {
            when(semesterRepository.findByActiveTrue()).thenReturn(Optional.empty());

            assertThatThrownBy(() -> academicOfferService.getActive())
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND))
                    .hasMessageContaining("No hay semestre activo configurado");
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando hay semestre activo pero sin oferta cargada")
        void debeLanzarExcepcion_cuandoSemestreSinOferta() {
            when(semesterRepository.findByActiveTrue()).thenReturn(Optional.of(semestreActivo));
            when(offerRepository.findFirstBySemesterOrderByUploadedAtDesc(anyString()))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> academicOfferService.getActive())
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND))
                    .hasMessageContaining("2025-1");
        }
    }

    // ─── listAll ──────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("listAll()")
    class ListAll {

        @Test
        @DisplayName("Debe retornar todas las ofertas académicas")
        void debeRetornarTodasLasOfertas() {
            when(offerRepository.findAll()).thenReturn(List.of(oferta));

            List<AcademicOfferResponse> result = academicOfferService.listAll();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).semester()).isEqualTo("2025-1");
        }

        @Test
        @DisplayName("Debe retornar lista vacía cuando no hay ofertas")
        void debeRetornarListaVacia_cuandoNoHayOfertas() {
            when(offerRepository.findAll()).thenReturn(List.of());

            List<AcademicOfferResponse> result = academicOfferService.listAll();

            assertThat(result).isEmpty();
        }
    }

    // ─── activate ─────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("activate()")
    class Activate {

        @Test
        @DisplayName("Debe desactivar todas las ofertas y activar la indicada")
        void debeActivarOferta_yDesactivarLasDemas() {
            when(offerRepository.findById(10L)).thenReturn(Optional.of(oferta));
            when(offerRepository.save(any(AcademicOffer.class))).thenAnswer(inv -> inv.getArgument(0));

            AcademicOfferResponse result = academicOfferService.activate(10L);

            verify(offerRepository, times(1)).deactivateAll();
            assertThat(result.active()).isTrue();
        }

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando la oferta no existe")
        void debeLanzarExcepcion_cuandoOfertaNoExiste() {
            when(offerRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> academicOfferService.activate(99L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

            verify(offerRepository, never()).deactivateAll();
        }
    }

    // ─── getSubjectsByOffer ───────────────────────────────────────────────────

    @Nested
    @DisplayName("getSubjectsByOffer()")
    class GetSubjectsByOffer {

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando la oferta no existe")
        void debeLanzarExcepcion_cuandoOfertaNoExiste() {
            when(offerRepository.existsById(anyLong())).thenReturn(false);

            assertThatThrownBy(() -> academicOfferService.getSubjectsByOffer(99L, null))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        }

        @Test
        @DisplayName("Debe retornar lista vacía cuando la oferta existe pero no tiene materias")
        void debeRetornarListaVacia_cuandoOfertaSinMaterias() {
            when(offerRepository.existsById(10L)).thenReturn(true);
            when(subjectRepository.findByOfferIdAndOptionalStudyPlan(10L, null)).thenReturn(List.of());

            var result = academicOfferService.getSubjectsByOffer(10L, null);

            assertThat(result).isEmpty();
        }
    }

    // ─── delete ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("delete()")
    class Delete {

        @Test
        @DisplayName("Debe lanzar NexoException 404 cuando la oferta no existe")
        void debeLanzarExcepcion_cuandoOfertaNoExiste() {
            when(offerRepository.findById(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> academicOfferService.delete(99L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

            verify(subjectRepository, never()).deleteAll(any());
            verify(offerRepository, never()).delete(any(AcademicOffer.class));
        }

        @Test
        @DisplayName("Debe eliminar los subjects asociados y luego la oferta")
        void debeEliminarSubjectsYOferta() {
            Subject subject = Subject.builder().id(100L).codigo("MAT101").nombre("Cálculo").studyPlan(plan).build();
            SubjectGroup group = SubjectGroup.builder().id(200L).subject(subject).academicOffer(oferta).build();

            when(offerRepository.findById(10L)).thenReturn(Optional.of(oferta));
            when(subjectGroupRepository.findByAcademicOfferId(10L)).thenReturn(List.of(group));

            academicOfferService.delete(10L);

            verify(subjectRepository, times(1)).deleteAll(argThat(subjects ->
                    ((Set<Subject>) subjects).contains(subject)
            ));
            verify(offerRepository, times(1)).delete(oferta);
        }
    }

    // ─── upload ───────────────────────────────────────────────────────────────

    @Nested
    @DisplayName("upload()")
    class Upload {

        private MultipartFile file;

        @BeforeEach
        void setUpFile() {
            file = mock(MultipartFile.class);
        }

        @Test
        @DisplayName("Debe lanzar NexoException 400 cuando no hay semestre activo configurado")
        void debeLanzarExcepcion_cuandoNoHaySemestreActivo() {
            when(semesterRepository.findByActiveTrue()).thenReturn(Optional.empty());

            assertThatThrownBy(() -> academicOfferService.upload(file, "2025-1", 1L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));
        }

        @Test
        @DisplayName("Debe lanzar NexoException 400 cuando el semestre del archivo no coincide con el activo")
        void debeLanzarExcepcion_cuandoSemestreNoCoincide() {
            when(semesterRepository.findByActiveTrue()).thenReturn(Optional.of(semestreActivo));

            assertThatThrownBy(() -> academicOfferService.upload(file, "2024-2", 1L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST))
                    .hasMessageContaining("2024-2");
        }

        @Test
        @DisplayName("Debe lanzar NexoException 400 cuando el archivo no es JSON válido")
        void debeLanzarExcepcion_cuandoJsonInvalido() throws IOException {
            when(semesterRepository.findByActiveTrue()).thenReturn(Optional.of(semestreActivo));
            when(file.getInputStream()).thenReturn(new ByteArrayInputStream("not json".getBytes()));
            when(objectMapper.readTree(any(java.io.InputStream.class)))
                    .thenThrow(new IOException("invalid json"));

            assertThatThrownBy(() -> academicOfferService.upload(file, "2025-1", 1L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST))
                    .hasMessageContaining("JSON válido");
        }

        @Test
        @DisplayName("Debe lanzar NexoException 400 cuando el JSON no es un array")
        void debeLanzarExcepcion_cuandoJsonNoEsArray() throws IOException {
            JsonNode objeto = realMapper.readTree("{\"key\": \"value\"}");
            when(semesterRepository.findByActiveTrue()).thenReturn(Optional.of(semestreActivo));
            when(file.getInputStream()).thenReturn(new ByteArrayInputStream("{}".getBytes()));
            when(objectMapper.readTree(any(java.io.InputStream.class))).thenReturn(objeto);

            assertThatThrownBy(() -> academicOfferService.upload(file, "2025-1", 1L))
                    .isInstanceOf(NexoException.class)
                    .satisfies(ex -> assertThat(((NexoException) ex).getStatus()).isEqualTo(HttpStatus.BAD_REQUEST))
                    .hasMessageContaining("array");
        }

        @Test
        @DisplayName("Debe procesar correctamente una carga mínima con 1 materia, 1 grupo y 1 horario")
        void debeProcesarCargaMinima() throws IOException {
            String json = """
                    [{
                      "carrera_codigo": "2016202",
                      "carrera": "Ing. de Sistemas",
                      "facultad": "Facultad de Ingeniería",
                      "codigo": "MAT101",
                      "nombre": "Cálculo Diferencial",
                      "grupos": [{
                        "grupo": "A",
                        "inscritos": 25,
                        "docente": "Dr. García",
                        "horarios": [{
                          "dia": "LUNES",
                          "horaInicio": 8,
                          "horaFin": 10,
                          "ubicacion": "Edificio A"
                        }]
                      }]
                    }]
                    """;

            JsonNode root = realMapper.readTree(json);
            Subject savedSubject = Subject.builder().id(100L).codigo("MAT101").nombre("Cálculo Diferencial")
                    .studyPlan(plan).build();
            SubjectGroup savedGroup = SubjectGroup.builder().id(200L).subject(savedSubject)
                    .academicOffer(oferta).grupoCode("A").inscritos(25).docente("Dr. García").build();

            when(semesterRepository.findByActiveTrue()).thenReturn(Optional.of(semestreActivo));
            when(file.getInputStream()).thenReturn(new ByteArrayInputStream(json.getBytes()));
            when(objectMapper.readTree(any(java.io.InputStream.class))).thenReturn(root);
            when(offerRepository.save(any(AcademicOffer.class))).thenReturn(oferta);
            when(studyPlanRepository.findByCodigoPlan("2016202")).thenReturn(Optional.of(plan));
            when(subjectRepository.save(any(Subject.class))).thenReturn(savedSubject);
            when(subjectGroupRepository.save(any(SubjectGroup.class))).thenReturn(savedGroup);
            when(timeBlockRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

            AcademicOfferUploadResponse result = academicOfferService.upload(file, "2025-1", 1L);

            assertThat(result.materias()).isEqualTo(1);
            assertThat(result.grupos()).isEqualTo(1);
            assertThat(result.horarios()).isEqualTo(1);
            assertThat(result.warnings()).isEmpty();
        }

        @Test
        @DisplayName("Debe generar advertencia cuando el día del horario es inválido")
        void debeGenerarAdvertencia_cuandoDiaInvalido() throws IOException {
            String json = """
                    [{
                      "carrera_codigo": "2016202", "carrera": "Ing.", "facultad": "Fac.",
                      "codigo": "MAT101", "nombre": "Cálculo",
                      "grupos": [{"grupo": "A", "inscritos": 0, "docente": "X",
                        "horarios": [{"dia": "DIADEINVALIDO", "horaInicio": 8, "horaFin": 10, "ubicacion": "A"}]
                      }]
                    }]
                    """;

            JsonNode root = realMapper.readTree(json);
            Subject savedSubject = Subject.builder().id(100L).codigo("MAT101").nombre("Cálculo").studyPlan(plan).build();
            SubjectGroup savedGroup = SubjectGroup.builder().id(200L).subject(savedSubject)
                    .academicOffer(oferta).grupoCode("A").inscritos(0).docente("X").build();

            when(semesterRepository.findByActiveTrue()).thenReturn(Optional.of(semestreActivo));
            when(file.getInputStream()).thenReturn(new ByteArrayInputStream(json.getBytes()));
            when(objectMapper.readTree(any(java.io.InputStream.class))).thenReturn(root);
            when(offerRepository.save(any(AcademicOffer.class))).thenReturn(oferta);
            when(studyPlanRepository.findByCodigoPlan(anyString())).thenReturn(Optional.of(plan));
            when(subjectRepository.save(any(Subject.class))).thenReturn(savedSubject);
            when(subjectGroupRepository.save(any(SubjectGroup.class))).thenReturn(savedGroup);

            AcademicOfferUploadResponse result = academicOfferService.upload(file, "2025-1", 1L);

            assertThat(result.warnings()).hasSize(1);
            assertThat(result.warnings().get(0)).contains("DIADEINVALIDO");
            assertThat(result.horarios()).isZero();
        }

        @Test
        @DisplayName("Debe generar advertencia cuando la hora de fin es menor o igual a la de inicio")
        void debeGenerarAdvertencia_cuandoHorarioInvalido() throws IOException {
            String json = """
                    [{
                      "carrera_codigo": "2016202", "carrera": "Ing.", "facultad": "Fac.",
                      "codigo": "MAT101", "nombre": "Cálculo",
                      "grupos": [{"grupo": "A", "inscritos": 0, "docente": "X",
                        "horarios": [{"dia": "LUNES", "horaInicio": 10, "horaFin": 8, "ubicacion": "A"}]
                      }]
                    }]
                    """;

            JsonNode root = realMapper.readTree(json);
            Subject savedSubject = Subject.builder().id(100L).codigo("MAT101").nombre("Cálculo").studyPlan(plan).build();
            SubjectGroup savedGroup = SubjectGroup.builder().id(200L).subject(savedSubject)
                    .academicOffer(oferta).grupoCode("A").inscritos(0).docente("X").build();

            when(semesterRepository.findByActiveTrue()).thenReturn(Optional.of(semestreActivo));
            when(file.getInputStream()).thenReturn(new ByteArrayInputStream(json.getBytes()));
            when(objectMapper.readTree(any(java.io.InputStream.class))).thenReturn(root);
            when(offerRepository.save(any(AcademicOffer.class))).thenReturn(oferta);
            when(studyPlanRepository.findByCodigoPlan(anyString())).thenReturn(Optional.of(plan));
            when(subjectRepository.save(any(Subject.class))).thenReturn(savedSubject);
            when(subjectGroupRepository.save(any(SubjectGroup.class))).thenReturn(savedGroup);

            AcademicOfferUploadResponse result = academicOfferService.upload(file, "2025-1", 1L);

            assertThat(result.warnings()).hasSize(1);
            assertThat(result.horarios()).isZero();
            verify(timeBlockRepository, never()).save(any());
        }

        @Test
        @DisplayName("Debe crear un nuevo StudyPlan cuando el código de carrera no existe en BD")
        void debeCrearNuevoPlan_cuandoNoExisteEnBD() throws IOException {
            String json = """
                    [{
                      "carrera_codigo": "NUEVO99",
                      "carrera": "Carrera Nueva",
                      "facultad": "Facultad X",
                      "codigo": "CN001", "nombre": "Materia Nueva",
                      "grupos": []
                    }]
                    """;

            JsonNode root = realMapper.readTree(json);
            StudyPlan nuevoPlan = StudyPlan.builder().id(99L).codigoPlan("NUEVO99")
                    .nombre("Carrera Nueva").facultad("Facultad X").build();
            Subject savedSubject = Subject.builder().id(100L).codigo("CN001").nombre("Materia Nueva")
                    .studyPlan(nuevoPlan).build();

            when(semesterRepository.findByActiveTrue()).thenReturn(Optional.of(semestreActivo));
            when(file.getInputStream()).thenReturn(new ByteArrayInputStream(json.getBytes()));
            when(objectMapper.readTree(any(java.io.InputStream.class))).thenReturn(root);
            when(offerRepository.save(any(AcademicOffer.class))).thenReturn(oferta);
            when(studyPlanRepository.findByCodigoPlan("NUEVO99")).thenReturn(Optional.empty());
            when(studyPlanRepository.save(any(StudyPlan.class))).thenReturn(nuevoPlan);
            when(subjectRepository.save(any(Subject.class))).thenReturn(savedSubject);

            AcademicOfferUploadResponse result = academicOfferService.upload(file, "2025-1", 1L);

            verify(studyPlanRepository, times(1)).save(argThat(p ->
                    p.getCodigoPlan().equals("NUEVO99") && p.getNombre().equals("Carrera Nueva")));
            assertThat(result.materias()).isEqualTo(1);
        }
    }
}
