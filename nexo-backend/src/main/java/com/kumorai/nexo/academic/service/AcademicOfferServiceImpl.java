package com.kumorai.nexo.academic.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kumorai.nexo.academic.dto.AcademicOfferResponse;
import com.kumorai.nexo.academic.dto.AcademicOfferUploadResponse;
import com.kumorai.nexo.academic.dto.SubjectGroupResponse;
import com.kumorai.nexo.academic.dto.SubjectResponse;
import com.kumorai.nexo.academic.dto.TimeBlockResponse;
import com.kumorai.nexo.academic.entity.AcademicOffer;
import com.kumorai.nexo.academic.entity.DayOfWeek;
import com.kumorai.nexo.academic.entity.StudyPlan;
import com.kumorai.nexo.academic.entity.Subject;
import com.kumorai.nexo.academic.entity.SubjectGroup;
import com.kumorai.nexo.academic.entity.Semester;
import com.kumorai.nexo.academic.entity.TimeBlock;
import com.kumorai.nexo.academic.repository.AcademicOfferRepository;
import com.kumorai.nexo.academic.repository.SemesterRepository;
import com.kumorai.nexo.academic.repository.StudyPlanRepository;
import com.kumorai.nexo.academic.repository.SubjectGroupRepository;
import com.kumorai.nexo.academic.repository.SubjectRepository;
import com.kumorai.nexo.academic.repository.TimeBlockRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AcademicOfferServiceImpl implements AcademicOfferService {

    private final AcademicOfferRepository offerRepository;
    private final StudyPlanRepository studyPlanRepository;
    private final SubjectRepository subjectRepository;
    private final SubjectGroupRepository subjectGroupRepository;
    private final TimeBlockRepository timeBlockRepository;
    private final SemesterRepository semesterRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public AcademicOfferResponse getActive() {
        Semester activeSemester = semesterRepository.findByActiveTrue()
                .orElseThrow(() -> NexoException.notFound("No hay semestre activo configurado."));
                
        return offerRepository.findFirstBySemesterOrderByUploadedAtDesc(activeSemester.getName())
                .map(this::toResponse)
                .orElseThrow(() -> NexoException.notFound("No se han cargado materias para el semestre activo (" + activeSemester.getName() + ")"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AcademicOfferResponse> listAll() {
        return offerRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public AcademicOfferResponse activate(Long offerId) {
        AcademicOffer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> NexoException.notFound("Oferta académica no encontrada"));
        offerRepository.deactivateAll();
        offer.setActive(true);
        return toResponse(offerRepository.save(offer));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubjectResponse> getSubjectsByOffer(Long offerId, Long studyPlanId) {
        if (!offerRepository.existsById(offerId)) {
            throw NexoException.notFound("Oferta académica no encontrada");
        }
        return subjectRepository.findByOfferIdAndOptionalStudyPlan(offerId, studyPlanId)
                .stream().map(this::toSubjectResponse).toList();
    }

    // ── Upload ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public AcademicOfferUploadResponse upload(MultipartFile file, String semester, Long uploadedBy) {
        // Validar que el semestre corresponde al semestre activo
        Semester activeSemester = semesterRepository.findByActiveTrue()
                .orElseThrow(() -> NexoException.badRequest(
                        "No hay un semestre activo configurado. Ve a Configuración y activa un semestre."));
        if (!activeSemester.getName().equals(semester)) {
            throw NexoException.badRequest(
                    "El semestre '" + semester + "' no coincide con el semestre activo '" + activeSemester.getName() + "'");
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(file.getInputStream());
        } catch (Exception e) {
            throw NexoException.badRequest("El archivo no es un JSON válido: " + e.getMessage());
        }

        if (!root.isArray()) {
            throw NexoException.badRequest("El JSON debe ser un array de materias");
        }

        // 1. Crear la oferta
        AcademicOffer offer = AcademicOffer.builder()
                .semester(semester)
                .uploadedBy(uploadedBy)
                .active(false)
                .build();
        offer = offerRepository.save(offer);

        // 2. Parsear materias
        Set<String> facultades = new HashSet<>();
        Set<String> carreras   = new HashSet<>();
        List<String> warnings  = new ArrayList<>();
        int totalMaterias = 0, totalGrupos = 0, totalHorarios = 0;

        for (JsonNode materiaNode : root) {
            String codigoPlan = materiaNode.path("carrera_codigo").asText("000");
            String carreraNombre = materiaNode.path("carrera").asText("SIN NOMBRE");
            String facultadNombre = materiaNode.path("facultad").asText("SIN FACULTAD");
            String codigoMateria = materiaNode.path("codigo").asText();
            String nombreMateria = materiaNode.path("nombre").asText("SIN NOMBRE");

            facultades.add(facultadNombre);
            carreras.add(codigoPlan);

            // Get-or-create StudyPlan
            StudyPlan plan = studyPlanRepository.findByCodigoPlan(codigoPlan)
                    .orElseGet(() -> studyPlanRepository.save(
                            StudyPlan.builder()
                                    .codigoPlan(codigoPlan)
                                    .nombre(carreraNombre)
                                    .facultad(facultadNombre)
                                    .build()
                    ));

            // Create Subject (new per upload — linked to the offer via its groups)
            Subject subject = subjectRepository.save(
                    Subject.builder()
                            .codigo(codigoMateria)
                            .nombre(nombreMateria)
                            .studyPlan(plan)
                            .build()
            );
            totalMaterias++;

            JsonNode grupos = materiaNode.path("grupos");
            for (JsonNode grupoNode : grupos) {
                String grupoCode = grupoNode.path("grupo").asText("SIN-GRUPO");
                int inscritos   = grupoNode.path("inscritos").asInt(0);
                String docente  = grupoNode.path("docente").asText("POR ASIGNAR");

                SubjectGroup group = subjectGroupRepository.save(
                        SubjectGroup.builder()
                                .subject(subject)
                                .academicOffer(offer)
                                .grupoCode(grupoCode)
                                .inscritos(inscritos)
                                .docente(docente)
                                .build()
                );
                totalGrupos++;

                JsonNode horarios = grupoNode.path("horarios");
                for (JsonNode horarioNode : horarios) {
                    String diaStr   = horarioNode.path("dia").asText();
                    int horaInicio  = horarioNode.path("horaInicio").asInt();
                    int horaFin     = horarioNode.path("horaFin").asInt();
                    String ubicacion = horarioNode.path("ubicacion").asText("POR ASIGNAR");

                    DayOfWeek dia;
                    try {
                        dia = DayOfWeek.valueOf(diaStr.toUpperCase());
                    } catch (IllegalArgumentException e) {
                        warnings.add("Día inválido '" + diaStr + "' en " + nombreMateria + " GRP " + grupoCode);
                        continue;
                    }

                    if (horaFin <= horaInicio) {
                        warnings.add("Horario inválido " + horaInicio + "-" + horaFin
                                + " en " + nombreMateria + " GRP " + grupoCode);
                        continue;
                    }

                    timeBlockRepository.save(
                            TimeBlock.builder()
                                    .subjectGroup(group)
                                    .dia(dia)
                                    .horaInicio(horaInicio)
                                    .horaFin(horaFin)
                                    .ubicacion(ubicacion)
                                    .build()
                    );
                    totalHorarios++;
                }
            }
        }

        return new AcademicOfferUploadResponse(
                offer.getId(),
                offer.getSemester(),
                offer.getUploadedAt(),
                facultades.size(),
                carreras.size(),
                totalMaterias,
                totalGrupos,
                totalHorarios,
                warnings
        );
    }

    @Override
    @Transactional
    public void delete(Long offerId) {
        AcademicOffer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> NexoException.notFound("Oferta académica no encontrada"));
                
        // Encontrar todos los grupos asociados a esta oferta
        List<SubjectGroup> groups = subjectGroupRepository.findByAcademicOfferId(offerId);
        
        // Extraer los Subjects correspondientes a esos grupos para eliminarlos completos y que en cascada borren los grupos y time_blocks
        // (Nota: el extractor crea Subjects nuevos por cada carga, por lo que podemos borrarlos sin afectar otras cargas)
        Set<Subject> subjectsToDelete = groups.stream()
                .map(SubjectGroup::getSubject)
                .collect(Collectors.toSet());
                
        subjectRepository.deleteAll(subjectsToDelete);
        offerRepository.delete(offer);
    }

    // ── Mappers ──────────────────────────────────────────────────────────────

    private AcademicOfferResponse toResponse(AcademicOffer offer) {
        return new AcademicOfferResponse(
                offer.getId(),
                offer.getSemester(),
                offer.isActive(),
                offer.getUploadedAt(),
                offer.getUploadedBy()
        );
    }

    private SubjectResponse toSubjectResponse(Subject subject) {
        return new SubjectResponse(
                subject.getId(),
                subject.getCodigo(),
                subject.getNombre(),
                subject.getStudyPlan().getId(),
                subject.getStudyPlan().getFacultad(),
                subject.getStudyPlan().getNombre(),
                subject.getGrupos().stream().map(this::toGroupResponse).toList()
        );
    }

    private SubjectGroupResponse toGroupResponse(SubjectGroup group) {
        return new SubjectGroupResponse(
                group.getId(),
                group.getGrupoCode(),
                group.getInscritos(),
                group.getDocente(),
                group.getHorarios().stream().map(this::toBlockResponse).toList()
        );
    }

    private TimeBlockResponse toBlockResponse(TimeBlock block) {
        return new TimeBlockResponse(
                block.getId(),
                block.getDia().name(),
                block.getHoraInicio(),
                block.getHoraFin(),
                block.getUbicacion()
        );
    }
}
