package com.medicheck.server.service;

import com.medicheck.server.domain.entity.Hospital;
import com.medicheck.server.domain.entity.HospitalReview;
import com.medicheck.server.domain.entity.User;
import com.medicheck.server.domain.repository.HospitalRepository;
import com.medicheck.server.domain.repository.HospitalReviewRepository;
import com.medicheck.server.domain.repository.UserRepository;
import com.medicheck.server.dto.HospitalReviewResponse;
import com.medicheck.server.dto.ReviewSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HospitalReviewService {

    private final HospitalReviewRepository reviewRepository;
    private final HospitalRepository hospitalRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Map<Long, ReviewSummary> getReviewSummaryByHospitalIds(List<Long> hospitalIds) {
        if (hospitalIds == null || hospitalIds.isEmpty()) {
            return Map.of();
        }
        List<Object[]> rows = reviewRepository.findAverageRatingAndCountByHospitalIds(hospitalIds);
        return rows.stream().collect(Collectors.toMap(
                row -> ((Number) row[0]).longValue(),
                row -> new ReviewSummary(((Number) row[1]).doubleValue(), ((Number) row[2]).longValue())
        ));
    }

    @Transactional(readOnly = true)
    public Page<HospitalReviewResponse> getReviews(Long hospitalId, Pageable pageable) {
        return reviewRepository.findByHospitalIdOrderByCreatedAtDesc(hospitalId, pageable)
                .map(HospitalReviewResponse::from);
    }

    @Transactional(readOnly = true)
    public Optional<HospitalReviewResponse> getMyReview(Long userId, Long hospitalId) {
        return reviewRepository.findByUserIdAndHospitalId(userId, hospitalId)
                .map(HospitalReviewResponse::from);
    }

    @Transactional
    public HospitalReviewResponse createOrUpdate(Long userId, Long hospitalId, int rating, String comment) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new IllegalArgumentException("병원을 찾을 수 없습니다."));
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("별점은 1~5 사이여야 합니다.");
        }
        return reviewRepository.findByUserIdAndHospitalId(userId, hospitalId)
                .map(existing -> {
                    existing.update(rating, comment);
                    return HospitalReviewResponse.from(existing);
                })
                .orElseGet(() -> {
                    HospitalReview review = new HospitalReview(user, hospital, rating, comment);
                    return HospitalReviewResponse.from(reviewRepository.save(review));
                });
    }

    @Transactional
    public void deleteMyReview(Long userId, Long hospitalId) {
        reviewRepository.findByUserIdAndHospitalId(userId, hospitalId)
                .ifPresent(reviewRepository::delete);
    }
}
