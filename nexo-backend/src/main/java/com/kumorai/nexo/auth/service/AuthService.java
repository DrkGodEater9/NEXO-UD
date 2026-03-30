package com.kumorai.nexo.auth.service;

import com.kumorai.nexo.auth.dto.LoginRequest;
import com.kumorai.nexo.auth.dto.LoginResponse;
import com.kumorai.nexo.auth.dto.RegisterRequest;
import com.kumorai.nexo.auth.dto.ResetPasswordRequest;
import com.kumorai.nexo.auth.dto.VerifyCodeRequest;

public interface AuthService {
    void register(RegisterRequest request);
    void verifyCode(VerifyCodeRequest request);
    void resendCode(String email);
    LoginResponse login(LoginRequest request);
    void forgotPassword(String email);
    void resetPassword(ResetPasswordRequest request);
}
