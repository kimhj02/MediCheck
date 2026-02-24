package com.medicheck.server.controller;

import com.medicheck.server.dto.HospitalResponse;
import com.medicheck.server.domain.repository.UserRepository;
import com.medicheck.server.service.UserFavoriteHospitalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 로그인 사용자 기준 즐겨찾기 병원 API.
 *
 * /api/users/me/favorites**
 */
@RestController
@RequestMapping("/api/users/me/favorites")
@RequiredArgsConstructor
public class UserFavoriteHospitalController {

    private final UserFavoriteHospitalService favoriteService;
    private final UserRepository userRepository;

    private Long getCurrentUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("인증되지 않은 요청입니다.");
        }
        String loginId = authentication.getName();
        return userRepository.findByLoginId(loginId)
                .map(u -> u.getId())
                .orElseThrow(() -> new IllegalStateException("사용자 정보를 찾을 수 없습니다."));
    }

    @GetMapping
    public ResponseEntity<List<HospitalResponse>> getFavorites(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        List<HospitalResponse> favorites = favoriteService.getFavorites(userId);
        return ResponseEntity.ok(favorites);
    }

    @PostMapping("/{hospitalId}")
    public ResponseEntity<Map<String, Object>> addFavorite(
            @PathVariable Long hospitalId,
            Authentication authentication
    ) {
        Long userId = getCurrentUserId(authentication);
        favoriteService.addFavorite(userId, hospitalId);
        return ResponseEntity.ok(Map.of("favorite", true));
    }

    @DeleteMapping("/{hospitalId}")
    public ResponseEntity<Map<String, Object>> removeFavorite(
            @PathVariable Long hospitalId,
            Authentication authentication
    ) {
        Long userId = getCurrentUserId(authentication);
        favoriteService.removeFavorite(userId, hospitalId);
        return ResponseEntity.ok(Map.of("favorite", false));
    }
}

