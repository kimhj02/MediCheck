package com.medicheck.server.domain.hospital.repository;

import java.util.List;

/**
 * {@link HospitalClinicTop5Repository} 커스텀 쿼리.
 */
public interface HospitalClinicTop5RepositoryCustom {

    /**
     * 토큰 중 하나라도 질병명 1~5 필드에 부분 일치(LIKE, 대소문자 무시)하면 해당 병원 ID를 포함합니다(OR).
     * 토큰은 서비스에서 {@code sanitizeLikeSubstring} 처리된 값만 넘깁니다.
     */
    List<Long> findHospitalIdsWithDiseaseNameContainingAny(List<String> tokens);
}
