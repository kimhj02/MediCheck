package com.medicheck.server.domain.repository;

import com.medicheck.server.domain.entity.HospitalClinicTop5;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    /**
     * 진료량 상위 5개 질병명(disease_nm_1~5) 중 하나라도 부분 일치하는 병원 ID 목록.
     * {@code q}에는 와일드카드(%, _)가 없어야 하며, 서비스에서 제거합니다.
     */
    @Query("""
            SELECT DISTINCT t.hospital.id FROM HospitalClinicTop5 t
            WHERE LOWER(COALESCE(t.diseaseNm1,'')) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(COALESCE(t.diseaseNm2,'')) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(COALESCE(t.diseaseNm3,'')) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(COALESCE(t.diseaseNm4,'')) LIKE LOWER(CONCAT('%', :q, '%'))
               OR LOWER(COALESCE(t.diseaseNm5,'')) LIKE LOWER(CONCAT('%', :q, '%'))
            """)
    List<Long> findHospitalIdsWithDiseaseNameContaining(@Param("q") String q);
}

