package com.medicheck.server.dto;

import com.medicheck.server.domain.entity.HospitalClinicTop5;
import lombok.Builder;
import lombok.Getter;

/**
 * 병원진료정보조회서비스 Top5 질병명 요약 DTO.
 */
@Getter
@Builder
public class HospitalTop5Summary {

    private String crtrYm;

    private String diseaseNm1;
    private String diseaseNm2;
    private String diseaseNm3;
    private String diseaseNm4;
    private String diseaseNm5;

    public static HospitalTop5Summary from(HospitalClinicTop5 top5) {
        if (top5 == null) return null;
        return HospitalTop5Summary.builder()
                .crtrYm(top5.getCrtrYm())
                .diseaseNm1(top5.getDiseaseNm1())
                .diseaseNm2(top5.getDiseaseNm2())
                .diseaseNm3(top5.getDiseaseNm3())
                .diseaseNm4(top5.getDiseaseNm4())
                .diseaseNm5(top5.getDiseaseNm5())
                .build();
    }
}

