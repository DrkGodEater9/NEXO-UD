package com.kumorai.nexo.user.service;

import com.kumorai.nexo.user.dto.DeleteAccountRequest;
import com.kumorai.nexo.user.dto.UpdateNicknameRequest;
import com.kumorai.nexo.user.dto.UserProfileResponse;
import com.kumorai.nexo.user.dto.UserSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {
    UserProfileResponse getMyProfile(String email);
    UserProfileResponse getById(Long id);
    UserSummaryResponse searchByEmail(String email);
    Page<UserSummaryResponse> listAll(String emailFilter, Pageable pageable);
    void requestNicknameChangeCode(String email);
    void updateNickname(String email, UpdateNicknameRequest request);
    void deleteAccount(String email, DeleteAccountRequest request);
    void setActive(Long userId, boolean active);
}
