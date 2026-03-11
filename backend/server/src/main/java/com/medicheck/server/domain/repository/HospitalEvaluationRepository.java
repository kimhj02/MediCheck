package com.medicheck.server.domain.repository;

import com.medicheck.server.domain.entity.HospitalEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * 병원평가정보(심평원 getHospAsmInfo1) JPA 리포지토리.
 */
public interface HospitalEvaluationRepository extends JpaRepository<HospitalEvaluation, Long> {

    Optional<HospitalEvaluation> findByHospital_Id(Long hospitalId);

    /** 여러 병원 ID에 대한 평가를 한 번에 조회 (근처 병원 목록용) */
    List<HospitalEvaluation> findByHospital_IdIn(List<Long> hospitalIds);

    Optional<HospitalEvaluation> findByYkiho(String ykiho);
}
