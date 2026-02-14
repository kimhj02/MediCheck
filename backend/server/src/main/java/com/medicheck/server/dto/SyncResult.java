package com.medicheck.server.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * HIRA 동기화 결과 (진단 정보 포함).
 */
@Getter
@Builder
public class SyncResult {

    /** 인증키가 설정되어 있는지 (local 프로필 또는 HIRA_SERVICE_KEY) */
    private boolean keyConfigured;

    /** HIRA API에서 조회된 건수 */
    private int fetchedCount;

    /** DB에 신규 저장된 건수 */
    private int saved;

    /** 기존 행 HIRA 데이터로 갱신된 건수 */
    private int updated;
}
