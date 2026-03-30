package com.kumorai.nexo.academic.service;

import com.kumorai.nexo.academic.dto.AcademicOfferResponse;
import com.kumorai.nexo.academic.dto.SubjectGroupResponse;
import com.kumorai.nexo.academic.dto.SubjectResponse;
import com.kumorai.nexo.academic.dto.TimeBlockResponse;
import com.kumorai.nexo.academic.entity.AcademicOffer;
import com.kumorai.nexo.academic.entity.Subject;
import com.kumorai.nexo.academic.entity.SubjectGroup;
import com.kumorai.nexo.academic.entity.TimeBlock;
import com.kumorai.nexo.academic.repository.AcademicOfferRepository;
import com.kumorai.nexo.academic.repository.SubjectRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AcademicOfferServiceImpl implements AcademicOfferService {

    private final AcademicOfferRepository offerRepository;
    private final SubjectRepository subjectRepository;

    @Override
    @Transactional(readOnly = true)
    public AcademicOfferResponse getActive() {
        return offerRepository.findByActiveTrue()
                .map(this::toResponse)
                .orElseThrow(() -> NexoException.notFound("No hay oferta académica activa"));
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
