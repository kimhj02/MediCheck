package com.medicheck.server.domain.hospital.repository;

import com.medicheck.server.domain.hospital.entity.HospitalClinicTop5;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * HIRA 병원진료정보조회서비스(getClinicTop5List1) 결과 저장 리포지토리.
 */
public interface HospitalClinicTop5Repository extends JpaRepository<HospitalClinicTop5, Long>, HospitalClinicTop5RepositoryCustom {

    Optional<HospitalClinicTop5> findByHospital_Id(Long hospitalId);

    /** 특정 병원의 Top5 1건(유니크)을 삭제하고 삭제 건수를 반환 */
    long deleteByHospital_Id(Long hospitalId);

    /** 근처 병원 목록용: 여러 병원 ID에 대한 Top5를 한 번에 조회 */
    List<HospitalClinicTop5> findByHospital_IdIn(List<Long> hospitalIds);

    /** 증상 검색 정렬용: 병원 엔티티를 한 번에 로드 (N+1 방지) */
    @Query("""
            SELECT DISTINCT t FROM HospitalClinicTop5 t JOIN FETCH t.hospital h
            WHERE h.id IN :ids
            """)
    List<HospitalClinicTop5> findAllByHospitalIdInWithHospitalFetch(@Param("ids") List<Long> ids);

    /**
     * 증상별 병원찾기 피커용: Top5 질병명 1~5열에서 실제로 등장한 값만 모아 중복 제거(2자 이상, 최대 400건).
     */
    @Query(
            value = """
                    SELECT DISTINCT TRIM(v) AS disease_name
                    FROM (
                        SELECT disease_nm_1 AS v FROM hospital_clinic_top5
                            WHERE disease_nm_1 IS NOT NULL AND TRIM(disease_nm_1) <> ''
                        UNION ALL
                        SELECT disease_nm_2 FROM hospital_clinic_top5
                            WHERE disease_nm_2 IS NOT NULL AND TRIM(disease_nm_2) <> ''
                        UNION ALL
                        SELECT disease_nm_3 FROM hospital_clinic_top5
                            WHERE disease_nm_3 IS NOT NULL AND TRIM(disease_nm_3) <> ''
                        UNION ALL
                        SELECT disease_nm_4 FROM hospital_clinic_top5
                            WHERE disease_nm_4 IS NOT NULL AND TRIM(disease_nm_4) <> ''
                        UNION ALL
                        SELECT disease_nm_5 FROM hospital_clinic_top5
                            WHERE disease_nm_5 IS NOT NULL AND TRIM(disease_nm_5) <> ''
                    ) AS combined
                    WHERE CHAR_LENGTH(TRIM(v)) >= 2
                    ORDER BY disease_name
                    LIMIT 400
                    """,
            nativeQuery = true
    )
    List<String> findDistinctDiseaseNamesForPicker();
}

