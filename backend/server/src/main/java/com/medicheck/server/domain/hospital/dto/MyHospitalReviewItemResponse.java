package com.medicheck.server.domain.hospital.dto;

import com.medicheck.server.domain.hospital.entity.HospitalReview;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 내 정보 → 내 리뷰 목록용 (병원 정보 + 리뷰 요약).
 */
@Getter
@Builder
public class MyHospitalReviewItemResponse {

    private Long hospitalId;
    private String hospitalName;
    private Long id;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MyHospitalReviewItemResponse from(HospitalReview review) {
        return MyHospitalReviewItemResponse.builder()
                .hospitalId(review.getHospital().getId())
                .hospitalName(review.getHospital().getName())
                .id(review.getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}
