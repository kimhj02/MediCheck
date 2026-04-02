package com.medicheck.server.domain.repository;

import com.medicheck.server.domain.entity.HospitalClinicTop5;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * HIRA 병원진료정보조회서비스(getClinicTop5List1) 결과 저장 리포지토리.
 */
public interface HospitalClinicTop5Repository extends JpaRepository<HospitalClinicTop5, Long> {

    Optional<HospitalClinicTop5> findByHospital_Id(Long hospitalId);

    /** 특정 병원의 Top5 1건(유니크)을 삭제하고 삭제 건수를 반환 */
    long deleteByHospital_Id(Long hospitalId);

    /** 근처 병원 목록용: 여러 병원 ID에 대한 Top5를 한 번에 조회 */
    List<HospitalClinicTop5> findByHospital_IdIn(List<Long> hospitalIds);
}

