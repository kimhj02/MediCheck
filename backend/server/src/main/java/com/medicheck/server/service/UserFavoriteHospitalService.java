package com.medicheck.server.service;

import com.medicheck.server.domain.entity.Hospital;
import com.medicheck.server.domain.entity.User;
import com.medicheck.server.domain.entity.UserFavoriteHospital;
import com.medicheck.server.domain.repository.HospitalRepository;
import com.medicheck.server.domain.repository.UserFavoriteHospitalRepository;
import com.medicheck.server.domain.repository.UserRepository;
import com.medicheck.server.dto.HospitalResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserFavoriteHospitalService {

    private final UserFavoriteHospitalRepository favoriteRepository;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;

    /**
     * 현재 사용자 기준 즐겨찾기 병원 목록을 조회합니다.
     */
    @Transactional(readOnly = true)
    public List<HospitalResponse> getFavorites(Long userId) {
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(UserFavoriteHospital::getHospital)
                .map(HospitalResponse::from)
                .toList();
    }

    /**
     * 즐겨찾기에 추가합니다. 이미 존재하면 아무 작업도 하지 않습니다.
     */
    public void addFavorite(Long userId, Long hospitalId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new IllegalArgumentException("병원을 찾을 수 없습니다."));
        UserFavoriteHospital favorite = new UserFavoriteHospital(user, hospital);
        try {
            favoriteRepository.save(favorite);
        } catch (DataIntegrityViolationException ignored) {
            // 이미 동일한 (user, hospital) 즐겨찾기가 존재하는 경우 — idempotent 처리
        }
    }

    /**
     * 즐겨찾기에서 제거합니다. 존재하지 않아도 예외를 던지지 않습니다.
     */
    public void removeFavorite(Long userId, Long hospitalId) {
        favoriteRepository.findByUserIdAndHospitalId(userId, hospitalId)
                .ifPresent(favoriteRepository::delete);
    }
}

