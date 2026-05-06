package com.medicheck.server.domain.hospital.controller;

import com.medicheck.server.domain.user.repository.UserRepository;
import com.medicheck.server.domain.hospital.dto.HospitalReviewRequest;
import com.medicheck.server.domain.hospital.dto.HospitalReviewResponse;
import com.medicheck.server.domain.hospital.service.HospitalReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * 병원별 리뷰 API.
 * GET /api/hospitals/{hospitalId}/reviews — 목록 (공개)
 * GET /api/hospitals/{hospitalId}/reviews/me — 내 리뷰 (인증)
 * POST /api/hospitals/{hospitalId}/reviews — 작성/수정 (인증)
 * DELETE /api/hospitals/{hospitalId}/reviews/me — 삭제 (인증)
 */
@Tag(name = "03. 병원 리뷰", description = "병원별 리뷰 목록·작성·수정·삭제(일부는 로그인 필요)")
@RestController
@RequestMapping("/api/hospitals/{hospitalId}/reviews")
@RequiredArgsConstructor
public class HospitalReviewController {

    private final HospitalReviewService reviewService;
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

    @Operation(summary = "리뷰 목록", description = "해당 병원의 리뷰를 페이지 단위로 조회합니다. 공개 API.")
    @GetMapping
    public ResponseEntity<Page<HospitalReviewResponse>> getReviews(
            @Parameter(description = "병원 ID") @PathVariable Long hospitalId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        Page<HospitalReviewResponse> page = reviewService.getReviews(hospitalId, pageable);
        return ResponseEntity.ok(page);
    }

    @Operation(summary = "내 리뷰 조회", description = "로그인 사용자가 이 병원에 남긴 리뷰 1건. 없으면 204. Bearer JWT 필요.")
    @GetMapping("/me")
    public ResponseEntity<HospitalReviewResponse> getMyReview(
            @Parameter(description = "병원 ID") @PathVariable Long hospitalId,
            Authentication authentication
    ) {
        Long userId = getCurrentUserId(authentication);
        return reviewService.getMyReview(userId, hospitalId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @Operation(summary = "리뷰 작성·수정", description = "rating(1~5), comment로 리뷰를 등록하거나 수정합니다. Bearer JWT 필요.")
    @PostMapping
    public ResponseEntity<HospitalReviewResponse> createOrUpdate(
            @Parameter(description = "병원 ID") @PathVariable Long hospitalId,
            @RequestBody @Valid HospitalReviewRequest request,
            Authentication authentication
    ) {
        Long userId = getCurrentUserId(authentication);
        HospitalReviewResponse response = reviewService.createOrUpdate(
                userId, hospitalId, request.getRating(), request.getComment());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "내 리뷰 삭제", description = "이 병원에 대해 내가 쓴 리뷰를 삭제합니다. Bearer JWT 필요.")
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMyReview(
            @Parameter(description = "병원 ID") @PathVariable Long hospitalId,
            Authentication authentication
    ) {
        Long userId = getCurrentUserId(authentication);
        reviewService.deleteMyReview(userId, hospitalId);
        return ResponseEntity.noContent().build();
    }
}
