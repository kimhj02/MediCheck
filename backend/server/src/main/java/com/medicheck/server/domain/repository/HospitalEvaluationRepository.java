package com.medicheck.server.domain.repository;

import com.medicheck.server.domain.entity.HospitalEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 병원평가정보(심평원 getHospAsmInfo1) JPA 리포지토리.
 */
public interface HospitalEvaluationRepository extends JpaRepository<HospitalEvaluation, Long> {

    Optional<HospitalEvaluation> findByHospital_Id(Long hospitalId);

    Optional<HospitalEvaluation> findByYkiho(String ykiho);
}
