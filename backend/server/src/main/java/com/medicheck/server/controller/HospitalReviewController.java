package com.medicheck.server.controller;

import com.medicheck.server.domain.repository.UserRepository;
import com.medicheck.server.dto.HospitalReviewResponse;
import com.medicheck.server.service.HospitalReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

/**
 * 병원별 리뷰 API.
 * GET /api/hospitals/{hospitalId}/reviews — 목록 (공개)
 * GET /api/hospitals/{hospitalId}/reviews/me — 내 리뷰 (인증)
 * POST /api/hospitals/{hospitalId}/reviews — 작성/수정 (인증)
 * DELETE /api/hospitals/{hospitalId}/reviews/me — 삭제 (인증)
 */
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

    @GetMapping
    public ResponseEntity<Page<HospitalReviewResponse>> getReviews(
            @PathVariable Long hospitalId,
            @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        Page<HospitalReviewResponse> page = reviewService.getReviews(hospitalId, pageable);
        return ResponseEntity.ok(page);
    }

    @GetMapping("/me")
    public ResponseEntity<HospitalReviewResponse> getMyReview(
            @PathVariable Long hospitalId,
            Authentication authentication
    ) {
        Long userId = getCurrentUserId(authentication);
        return reviewService.getMyReview(userId, hospitalId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping
    public ResponseEntity<HospitalReviewResponse> createOrUpdate(
            @PathVariable Long hospitalId,
            @RequestBody Map<String, Object> body,
            Authentication authentication
    ) {
        Long userId = getCurrentUserId(authentication);
        int rating = body.get("rating") != null ? ((Number) body.get("rating")).intValue() : 0;
        String comment = body.get("comment") != null ? body.get("comment").toString() : null;
        HospitalReviewResponse response = reviewService.createOrUpdate(userId, hospitalId, rating, comment);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteMyReview(
            @PathVariable Long hospitalId,
            Authentication authentication
    ) {
        Long userId = getCurrentUserId(authentication);
        reviewService.deleteMyReview(userId, hospitalId);
        return ResponseEntity.noContent().build();
    }
}
