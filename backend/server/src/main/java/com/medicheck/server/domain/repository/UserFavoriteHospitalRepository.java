package com.medicheck.server.domain.repository;

import com.medicheck.server.domain.entity.UserFavoriteHospital;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserFavoriteHospitalRepository extends JpaRepository<UserFavoriteHospital, Long> {

    boolean existsByUserIdAndHospitalId(Long userId, Long hospitalId);

    Optional<UserFavoriteHospital> findByUserIdAndHospitalId(Long userId, Long hospitalId);

    List<UserFavoriteHospital> findByUserIdOrderByCreatedAtDesc(Long userId);
}

