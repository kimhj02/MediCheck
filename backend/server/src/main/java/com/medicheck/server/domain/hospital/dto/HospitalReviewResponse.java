package com.medicheck.server.domain.hospital.dto;

import com.medicheck.server.domain.hospital.entity.HospitalReview;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class HospitalReviewResponse {

    private Long id;
    private Long userId;
    private String userDisplayName;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static HospitalReviewResponse from(HospitalReview review) {
        String displayName = review.getUser().getName() != null && !review.getUser().getName().isBlank()
                ? review.getUser().getName()
                : review.getUser().getLoginId();
        return HospitalReviewResponse.builder()
                .id(review.getId())
                .userId(review.getUser().getId())
                .userDisplayName(displayName)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
