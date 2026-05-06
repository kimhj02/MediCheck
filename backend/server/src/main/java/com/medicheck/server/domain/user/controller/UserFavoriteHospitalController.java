package com.medicheck.server.domain.user.controller;

import com.medicheck.server.domain.user.repository.UserRepository;
import com.medicheck.server.domain.hospital.dto.HospitalResponse;
import com.medicheck.server.domain.hospital.dto.MyHospitalReviewItemResponse;
import com.medicheck.server.domain.hospital.service.HospitalReviewService;
import com.medicheck.server.domain.user.service.UserFavoriteHospitalService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
 * 로그인 사용자 기준 API: 즐겨찾기, 내 리뷰 목록.
 * 베이스 경로 {@code /api/users/me} 하위에 {@code /favorites}, {@code /reviews} 를 둡니다.
 */
@Tag(name = "02. 즐겨찾기·내 리뷰", description = "로그인 사용자 즐겨찾기 및 작성 리뷰 목록")
@RestController
@RequestMapping("/api/users/me")
@RequiredArgsConstructor
public class UserFavoriteHospitalController {

    private final UserFavoriteHospitalService favoriteService;
    private final HospitalReviewService hospitalReviewService;
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
    @GetMapping("/favorites")
    public ResponseEntity<List<HospitalResponse>> getFavorites(Authentication authentication) {
        Long userId = getCurrentUserId(authentication);
        List<HospitalResponse> favorites = favoriteService.getFavorites(userId);
        return ResponseEntity.ok(favorites);
    }

    @Operation(summary = "즐겨찾기 추가", description = "해당 병원을 즐겨찾기에 추가합니다. Bearer JWT 필요.")
    @PostMapping("/favorites/{hospitalId}")
    public ResponseEntity<Map<String, Object>> addFavorite(
            @Parameter(description = "병원 ID") @PathVariable Long hospitalId,
            Authentication authentication
    ) {
        Long userId = getCurrentUserId(authentication);
        favoriteService.addFavorite(userId, hospitalId);
        return ResponseEntity.ok(Map.of("favorite", true));
    }

    @Operation(summary = "즐겨찾기 해제", description = "해당 병원을 즐겨찾기에서 제거합니다. Bearer JWT 필요.")
    @DeleteMapping("/favorites/{hospitalId}")
    public ResponseEntity<Map<String, Object>> removeFavorite(
            @Parameter(description = "병원 ID") @PathVariable Long hospitalId,
            Authentication authentication
    ) {
        Long userId = getCurrentUserId(authentication);
        favoriteService.removeFavorite(userId, hospitalId);
        return ResponseEntity.ok(Map.of("favorite", false));
    }

    @Operation(summary = "내 리뷰 목록", description = "작성한 리뷰를 최근 수정순으로 페이지네이션합니다. Bearer JWT 필요.")
    @GetMapping("/reviews")
    public ResponseEntity<Page<MyHospitalReviewItemResponse>> getMyReviews(
            Authentication authentication,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        Long userId = getCurrentUserId(authentication);
        Page<MyHospitalReviewItemResponse> page = hospitalReviewService.getMyReviewsForUser(userId, pageable);
        return ResponseEntity.ok(page);
    }
}
