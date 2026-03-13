package com.medicheck.server.controller;

import com.medicheck.server.dto.HospitalResponse;
import com.medicheck.server.domain.repository.UserRepository;
import com.medicheck.server.service.UserFavoriteHospitalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;
import java.util.Map;

/**
 * 로그인 사용자 기준 즐겨찾기 병원 API.
 *
 * /api/users/me/favorites**
 */
@Tag(name = "02. 즐겨찾기 병원", description = "로그인 사용자의 즐겨찾기 목록·추가·삭제")
@RestController
@RequestMapping("/api/users/me/favorites")
@RequiredArgsConstructor
public class UserFavoriteHospitalController {

    private final UserFavoriteHospitalService favoriteService;
    private final UserRepository userRepository;

    private Long getCurrentUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "인증되지 않은 요청입니다.");
        }
        String loginId = authentication.getName();
        return userRepository.findByLoginId(loginId)
                .map(u -> u.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자 정보를 찾을 수 없습니다."));
    }

    @Operation(summary = "즐겨찾기 목록", description = "로그인한 사용자가 등록한 즐겨찾기 병원 목록을 반환합니다. Bearer JWT 필요.")
    @GetMapping
    public ResponseEntity<List<HospitalResponse>> getFavorites(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        List<HospitalResponse> favorites = favoriteService.getFavorites(userId);
        return ResponseEntity.ok(favorites);
    }

    @Operation(summary = "즐겨찾기 추가", description = "해당 병원을 즐겨찾기에 추가합니다. Bearer JWT 필요.")
    @PostMapping("/{hospitalId}")
    public ResponseEntity<Map<String, Object>> addFavorite(
            @Parameter(description = "병원 ID") @PathVariable Long hospitalId,
            Authentication authentication
    ) {
        Long userId = getCurrentUserId(authentication);
        favoriteService.addFavorite(userId, hospitalId);
        return ResponseEntity.ok(Map.of("favorite", true));
    }

    @Operation(summary = "즐겨찾기 해제", description = "해당 병원을 즐겨찾기에서 제거합니다. Bearer JWT 필요.")
    @DeleteMapping("/{hospitalId}")
    public ResponseEntity<Map<String, Object>> removeFavorite(
            @Parameter(description = "병원 ID") @PathVariable Long hospitalId,
            Authentication authentication
    ) {
        Long userId = getCurrentUserId(authentication);
        favoriteService.removeFavorite(userId, hospitalId);
        return ResponseEntity.ok(Map.of("favorite", false));
    }
}

