package com.kumorai.nexo.academic.service;

import com.kumorai.nexo.academic.dto.AcademicOfferResponse;
import com.kumorai.nexo.academic.dto.AcademicOfferUploadResponse;
import com.kumorai.nexo.academic.dto.SubjectResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface AcademicOfferService {
    AcademicOfferResponse getActive();
    List<AcademicOfferResponse> listAll();
    AcademicOfferResponse activate(Long offerId);
    List<SubjectResponse> getSubjectsByOffer(Long offerId, Long studyPlanId);
    AcademicOfferUploadResponse upload(MultipartFile file, String semester, Long uploadedBy);
    void delete(Long offerId);
}
