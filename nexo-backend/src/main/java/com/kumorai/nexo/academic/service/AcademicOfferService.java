package com.kumorai.nexo.academic.service;

import com.kumorai.nexo.academic.dto.AcademicOfferResponse;
import com.kumorai.nexo.academic.dto.SubjectResponse;

import java.util.List;

public interface AcademicOfferService {
    AcademicOfferResponse getActive();
    List<AcademicOfferResponse> listAll();
    AcademicOfferResponse activate(Long offerId);
    List<SubjectResponse> getSubjectsByOffer(Long offerId, Long studyPlanId);
}
