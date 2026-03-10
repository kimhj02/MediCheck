package com.medicheck.server.service;

import com.medicheck.server.domain.entity.Hospital;
import com.medicheck.server.domain.entity.HospitalEvaluation;
import com.medicheck.server.domain.repository.HospitalEvaluationRepository;
import com.medicheck.server.domain.repository.HospitalRepository;
import com.medicheck.server.domain.repository.HospitalSpecification;
import com.medicheck.server.dto.HospitalEvaluationSummary;
import com.medicheck.server.dto.HospitalResponse;
import com.medicheck.server.dto.NearbyHospitalResponse;
import com.medicheck.server.dto.ReviewSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 안심 병원 조회 서비스.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HospitalService {

    private final HospitalRepository hospitalRepository;
    private final HospitalReviewService reviewService;
    private final HospitalEvaluationRepository hospitalEvaluationRepository;
    /** 근처 병원 조회 시 한 번에 반환할 최대 개수 (일단 500개로 상한 설정). */
    private static final int NEARBY_MAX_RESULTS = 500;
    /** 근처 병원 조회에서 허용할 최대 반경 (미터) — 예: 50km */
    private static final double MAX_RADIUS_METERS = 50_000;

    /**
     * 등록된 병원 목록을 페이지 단위로 조회합니다.
     * 검색(keyword), 필터(department), 정렬(sort)을 지원합니다.
     *
     * @param keyword   병원명/주소/진료과 통합 검색 (없으면 무시)
     * @param department 진료과 필터 (없으면 무시)
     * @param pageable  page, size, sort (예: sort=name,asc / sort=createdAt,desc)
     */
    public Page<HospitalResponse> findAll(String keyword, String department, Pageable pageable) {
        Specification<Hospital> spec =
                HospitalSpecification.withFilters(keyword, department);
        return hospitalRepository.findAll(spec, pageable).map(HospitalResponse::from);
    }

    /**
     * ID로 병원 한 건 조회합니다.
     *
     * @param id 병원 ID
     * @return 병원이 있으면 HospitalResponse, 없으면 empty
     */
    public Optional<HospitalResponse> findById(Long id) {
        return hospitalRepository.findById(id).map(h -> {
            HospitalResponse hr = HospitalResponse.from(h);

            // 리뷰 요약
            Map<Long, ReviewSummary> map = reviewService.getReviewSummaryByHospitalIds(List.of(id));
            ReviewSummary summary = map.get(id);
            if (summary != null) {
                hr = hr.toBuilder()
                        .averageRating(summary.getAverageRating())
                        .reviewCount(summary.getReviewCount().intValue())
                        .build();
            }

            // 병원평가정보 요약
            Optional<HospitalEvaluation> evOpt = hospitalEvaluationRepository.findByHospital_Id(id);
            if (evOpt.isPresent()) {
                HospitalEvaluationSummary evalDto = HospitalEvaluationSummary.from(evOpt.get());
                hr = hr.toBuilder()
                        .evaluation(evalDto)
                        .build();
            }
            return hr;
        });
    }

    /**
     * 사용자의 위치 기준 반경(radiusMeters m) 내 병원을 거리순으로 조회합니다.
     * 각 항목에 사용자 위치에서의 거리(distanceMeters)가 포함됩니다.
     *
     * @param latitude     사용자 위도 (WGS84)
     * @param longitude    사용자 경도 (WGS84)
     * @param radiusMeters 반경 (미터)
     */
    /**
     * TODO: 반경이 매우 큰(예: 50km) 요청에 대해서는 서버 페이징이나 프론트 단 마커 클러스터링 도입을 검토.
     * 현재는 최대 500개까지만 한 번에 반환하며, 그 이상은 잘린다는 정보를 별도 헤더로 노출합니다.
     */
    public List<NearbyHospitalResponse> findNearby(BigDecimal latitude, BigDecimal longitude, double radiusMeters) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("latitude and longitude must not be null");
        }
        if (radiusMeters <= 0) {
            throw new IllegalArgumentException("radiusMeters must be greater than 0");
        }

        double effectiveRadius = Math.min(radiusMeters, MAX_RADIUS_METERS);

        // 하나 더 가져와서(NEARBY_MAX_RESULTS + 1) 잘림 여부를 감지한다.
        List<Object[]> idAndDistance = hospitalRepository.findNearbyIdAndDistance(
                latitude.doubleValue(),
                longitude.doubleValue(),
                effectiveRadius,
                NEARBY_MAX_RESULTS + 1
        );

        if (idAndDistance.isEmpty()) {
            NearbyQueryContextHolder.clear();
            return List.of();
        }

        boolean truncated = idAndDistance.size() > NEARBY_MAX_RESULTS;
        List<Long> orderedIds = idAndDistance.stream()
                .limit(NEARBY_MAX_RESULTS)
                .map(row -> ((Number) row[0]).longValue())
                .toList();
        Map<Long, Double> idToDistance = idAndDistance.stream()
                .collect(Collectors.toMap(row -> ((Number) row[0]).longValue(), row -> ((Number) row[1]).doubleValue()));

        List<Hospital> hospitals = hospitalRepository.findAllById(orderedIds);
        Map<Long, Hospital> idToHospital = hospitals.stream().collect(Collectors.toMap(Hospital::getId, h -> h));

        // 응답 헤더에서 사용할 수 있도록 쓰레드 로컬에 메타데이터 보관
        NearbyQueryContextHolder.setMetadata(new NearbyQueryMetadata(
                orderedIds.size(),
                truncated
        ));

        Map<Long, ReviewSummary> reviewSummaryMap = reviewService.getReviewSummaryByHospitalIds(orderedIds);

        return orderedIds.stream()
                .map(id -> {
                    Hospital h = idToHospital.get(id);
                    Double dist = idToDistance.get(id);
                    if (h == null || dist == null) return null;
                    HospitalResponse hr = HospitalResponse.from(h);
                    ReviewSummary summary = reviewSummaryMap.get(id);
                    if (summary != null) {
                        hr = hr.toBuilder()
                                .averageRating(summary.getAverageRating())
                                .reviewCount(summary.getReviewCount().intValue())
                                .build();
                    }
                    return NearbyHospitalResponse.builder()
                            .hospital(hr)
                            .distanceMeters(dist)
                            .build();
                })
                .filter(r -> r != null)
                .toList();
    }
}
