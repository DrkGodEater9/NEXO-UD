package com.kumorai.nexo.auth.service;

import com.kumorai.nexo.academic.entity.StudyPlan;
import com.kumorai.nexo.academic.repository.StudyPlanRepository;
import com.kumorai.nexo.auth.dto.RegisterRequest;
import com.kumorai.nexo.auth.repository.VerificationCodeRepository;
import com.kumorai.nexo.shared.exception.NexoException;
import com.kumorai.nexo.shared.util.EmailService;
import com.kumorai.nexo.shared.util.JwtService;
import com.kumorai.nexo.user.entity.Role;
import com.kumorai.nexo.user.entity.User;
import com.kumorai.nexo.user.repository.RoleRepository;
import com.kumorai.nexo.user.repository.UserAcademicProgressRepository;
import com.kumorai.nexo.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private VerificationCodeRepository verificationCodeRepository;
    @Mock
    private UserAcademicProgressRepository academicProgressRepository;
    @Mock
    private StudyPlanRepository studyPlanRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private EmailService emailService;

    @InjectMocks
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "codeTtlMinutes", 10);
        ReflectionTestUtils.setField(authService, "maxAttempts", 3);
    }

    @Test
    void testRegisterNewUserSuccess() {
        RegisterRequest request = new RegisterRequest(
                "new.user@udistrital.edu.co",
                "newuser",
                "password123",
                "20241005001"
        );

        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());
        when(userRepository.findByNickname(request.nickname())).thenReturn(Optional.empty());
        when(userRepository.findByStudentCode(request.studentCode())).thenReturn(Optional.empty());

        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(userRepository.existsByNickname(request.nickname())).thenReturn(false);
        when(userRepository.existsByStudentCode(request.studentCode())).thenReturn(false);

        StudyPlan studyPlan = new StudyPlan();
        studyPlan.setCodigoPlan("005");
        when(studyPlanRepository.findByCodigoPlan("005")).thenReturn(Optional.of(studyPlan));
        when(passwordEncoder.encode(request.password())).thenReturn("hashed_pwd");

        assertDoesNotThrow(() -> authService.register(request));

        verify(userRepository, times(1)).save(any(User.class));
        verify(roleRepository, times(1)).save(any(Role.class));
        verify(emailService, times(1)).sendVerificationCode(eq(request.email()), anyString(), eq(10));
    }

    @Test
    void testRegisterCleansUpInactiveUser() {
        RegisterRequest request = new RegisterRequest(
                "phantom@udistrital.edu.co",
                "phantom",
                "password123",
                "20241005001"
        );

        User inactiveUser = User.builder()
                .email("phantom@udistrital.edu.co")
                .nickname("phantom")
                .studentCode("20241005001")
                .active(false)
                .build();

        // Mock lookup to return the inactive user
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(inactiveUser));
        when(userRepository.findByNickname(request.nickname())).thenReturn(Optional.empty());
        when(userRepository.findByStudentCode(request.studentCode())).thenReturn(Optional.empty());

        when(userRepository.existsByEmail(request.email())).thenReturn(false);
        when(userRepository.existsByNickname(request.nickname())).thenReturn(false);
        when(userRepository.existsByStudentCode(request.studentCode())).thenReturn(false);

        StudyPlan studyPlan = new StudyPlan();
        studyPlan.setCodigoPlan("005");
        when(studyPlanRepository.findByCodigoPlan("005")).thenReturn(Optional.of(studyPlan));
        when(passwordEncoder.encode(request.password())).thenReturn("hashed_pwd");

        assertDoesNotThrow(() -> authService.register(request));

        // Verify that userRepository.delete() was called on the inactive user
        verify(userRepository, times(1)).delete(inactiveUser);
        verify(userRepository, times(1)).flush();
        verify(userRepository, times(1)).save(any(User.class));
    }
}
