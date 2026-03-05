package com.medicheck.server.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 병원별 리뷰 요약 (평균 별점, 리뷰 개수).
 */
@Getter
@AllArgsConstructor
public class ReviewSummary {
    private final Double averageRating;
    private final Long reviewCount;
}
