package com.kumorai.nexo.shared;

import com.kumorai.nexo.academic.dto.*;
import com.kumorai.nexo.campus.dto.CampusResponse;
import com.kumorai.nexo.campus.dto.ClassroomResponse;
import com.kumorai.nexo.content.dto.AnnouncementResponse;
import com.kumorai.nexo.content.dto.CalendarEventResponse;
import com.kumorai.nexo.content.dto.WelfareContentResponse;
import com.kumorai.nexo.report.dto.ReportResponse;
import com.kumorai.nexo.schedule.dto.ScheduleResponse;
import com.kumorai.nexo.user.dto.AcademicProgressResponse;
import com.kumorai.nexo.user.dto.SubjectProgressResponse;
import com.kumorai.nexo.user.dto.UserProfileResponse;
import com.kumorai.nexo.user.dto.UserSummaryResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;

public final class TestData {

    private TestData() {
    }

    public static RequestPostProcessor auth(String email, String... roles) {
        List<SimpleGrantedAuthority> authorities = Arrays.stream(roles)
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .toList();
        return authentication(new UsernamePasswordAuthenticationToken(email, null, authorities));
    }

    public static UserProfileResponse userProfile() {
        return new UserProfileResponse(1L, "test@udistrital.edu.co", "nick", true,
                LocalDateTime.now(), List.of("ESTUDIANTE"), "20201000001", "2020-1",
                "INGENIERIA", "Sistemas");
    }

    public static UserSummaryResponse userSummary() {
        return new UserSummaryResponse(1L, "test@udistrital.edu.co", "nick", true);
    }

    public static CampusResponse campus() {
        return new CampusResponse(1L, "Ingenieria", "Cra 8", "INGENIERIA", 4.0, -74.0, "map", List.of());
    }

    public static ClassroomResponse classroom() {
        return new ClassroomResponse(1L, "Lab 1", "A", "2", true, List.of("/uploads/a.png"));
    }

    public static AnnouncementResponse announcement() {
        return new AnnouncementResponse(1L, "Aviso", "Cuerpo", "UNIVERSIDAD", "GENERAL", null,
                null, null, 1L, LocalDateTime.now(), LocalDateTime.now());
    }

    public static CalendarEventResponse calendarEvent() {
        return new CalendarEventResponse(1L, "Evento", "Desc", "OTRO",
                LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 2), 1L);
    }

    public static WelfareContentResponse welfare() {
        return new WelfareContentResponse(1L, "Bienestar", "Corto", "Largo", "BECAS",
                null, null, 1L, LocalDateTime.now(), LocalDateTime.now());
    }

    public static AcademicOfferResponse academicOffer() {
        return new AcademicOfferResponse(1L, "2025-1", true, LocalDateTime.now(), 1L);
    }

    public static AcademicOfferUploadResponse academicOfferUpload() {
        return new AcademicOfferUploadResponse(1L, "2025-1", LocalDateTime.now(), 1, 1, 1, 1, 1, List.of());
    }

    public static StudyPlanResponse studyPlan() {
        return new StudyPlanResponse(1L, "375", "Ingenieria de Sistemas", "INGENIERIA");
    }

    public static CurriculumSubjectResponse curriculumSubject() {
        return new CurriculumSubjectResponse(1L, "101", "Calculo", 3, 1, 1L);
    }

    public static AcademicProgressResponse progress() {
        return new AcademicProgressResponse(1L, 1L, "Sistemas", "375", LocalDateTime.now(),
                160, 30, 12, List.of(subjectProgress()));
    }

    public static SubjectProgressResponse subjectProgress() {
        return new SubjectProgressResponse(1L, 1L, "101", "Calculo", 3, 1, "CURSANDO", null);
    }

    public static ReportResponse report() {
        return new ReportResponse(1L, 1L, "OTRO", "Descripcion", null, "PENDIENTE",
                LocalDateTime.now(), null);
    }

    public static SubjectResponse subject() {
        return new SubjectResponse(1L, "101", "Calculo", 1L, "INGENIERIA", "Sistemas", List.of());
    }

    public static ScheduleResponse schedule() {
        return new ScheduleResponse(1L, 1L, "Mi horario", "2025-1", "Notas", 3,
                false, LocalDateTime.now(), LocalDateTime.now(), List.of());
    }
}
