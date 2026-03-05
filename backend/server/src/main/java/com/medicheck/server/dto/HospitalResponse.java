package com.medicheck.server.dto;

import com.medicheck.server.domain.entity.Hospital;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 병원 목록/상세 API 응답 DTO.
 */
@Getter
@Builder(toBuilder = true)
public class HospitalResponse {

    private Long id;
    private String name;
    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String phone;
    private String publicCode;
    private String department;
    private Integer doctorTotalCount;
    private LocalDate establishedDate;
    private Integer mdeptSpecialistCount;
    private Integer mdeptGeneralCount;
    private Integer mdeptInternCount;
    private Integer mdeptResidentCount;
    private Integer detySpecialistCount;
    private Integer cmdcSpecialistCount;

    /** 평균 별점 (1~5, 리뷰 없으면 null) */
    private Double averageRating;
    /** 리뷰 개수 */
    private Integer reviewCount;

    public static HospitalResponse from(Hospital hospital) {
        return HospitalResponse.builder()
                .id(hospital.getId())
                .name(hospital.getName())
                .address(hospital.getAddress())
                .latitude(hospital.getLatitude())
                .longitude(hospital.getLongitude())
                .phone(hospital.getPhone())
                .publicCode(hospital.getPublicCode())
                .department(hospital.getDepartment())
                .doctorTotalCount(hospital.getDoctorTotalCount())
                .establishedDate(hospital.getEstablishedDate())
                .mdeptSpecialistCount(hospital.getMdeptSpecialistCount())
                .mdeptGeneralCount(hospital.getMdeptGeneralCount())
                .mdeptInternCount(hospital.getMdeptInternCount())
                .mdeptResidentCount(hospital.getMdeptResidentCount())
                .detySpecialistCount(hospital.getDetySpecialistCount())
                .cmdcSpecialistCount(hospital.getCmdcSpecialistCount())
                .averageRating(null)
                .reviewCount(null)
                .build();
    }
}
