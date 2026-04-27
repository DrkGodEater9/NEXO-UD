package com.kumorai.nexo.user.dto;

import java.time.LocalDateTime;
import java.util.List;

public record UserProfileResponse(
                Long id,
                String email,
                String nickname,
                boolean active,
                LocalDateTime createdAt,
                List<String> roles,
                // Semantic student Info added below a
                String studentCode,
                String entrySemester,
                String faculty,
                String career) {
}
