package com.medicheck.server.domain.repository;

import com.medicheck.server.domain.entity.HospitalReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface HospitalReviewRepository extends JpaRepository<HospitalReview, Long> {

    Optional<HospitalReview> findByUserIdAndHospitalId(Long userId, Long hospitalId);

    Page<HospitalReview> findByHospitalIdOrderByCreatedAtDesc(Long hospitalId, Pageable pageable);

    Page<HospitalReview> findByUser_IdOrderByUpdatedAtDesc(Long userId, Pageable pageable);

    @Query("SELECT r.hospital.id, AVG(r.rating), COUNT(r) FROM HospitalReview r WHERE r.hospital.id IN :hospitalIds GROUP BY r.hospital.id")
    List<Object[]> findAverageRatingAndCountByHospitalIds(List<Long> hospitalIds);
}
