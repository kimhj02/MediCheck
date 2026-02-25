package com.medicheck.server.service;

/**
 * 근처 병원 조회 메타데이터.
 * - returnedCount: 실제 반환된 병원 수
 * - truncated: 서버 상한(NEARBY_MAX_RESULTS)에 걸려 잘렸는지 여부
 */
public record NearbyQueryMetadata(
        int returnedCount,
        boolean truncated
) {
}

