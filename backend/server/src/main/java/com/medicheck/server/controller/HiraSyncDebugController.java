package com.medicheck.server.controller;

import com.medicheck.server.client.hira.HiraHospitalClient;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * HIRA API 디버그용 엔드포인트.
 * local 프로필에서만 활성화됩니다.
 */

@Tag(name = "06. HIRA 디버그(local)", description = "local 프로필 전용 — HIRA API 원문 확인")
@RestController
@RequestMapping("/api/hospitals")
@RequiredArgsConstructor
@Profile("local")
public class HiraSyncDebugController {

    private final HiraHospitalClient hiraHospitalClient;

    /**
     * HIRA API 원문 응답 확인 (디버그용). GET /api/hospitals/sync/debug
     * 경북: ?sidoCd=470000
     */
    @Operation(summary = "HIRA 원문 디버그", description = "local 전용. HIRA 병원기본목록 API 원문(raw) 응답을 확인합니다. 경북 예: sidoCd=470000")
    @GetMapping("/sync/debug")
    public ResponseEntity<Map<String, Object>> syncDebug(
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "10") int numOfRows,
            @RequestParam(required = false) String sidoCd
    ) {
        HiraHospitalClient.RawResponseResult r = (sidoCd != null && !sidoCd.isBlank())
                ? hiraHospitalClient.getRawResponse(pageNo, numOfRows, sidoCd)
                : hiraHospitalClient.getRawResponse(pageNo, numOfRows);
        return ResponseEntity.ok(Map.of(
                "keyConfigured", r.keyConfigured(),
                "rawResponse", r.rawResponse() != null ? r.rawResponse() : "",
                "error", r.error() != null ? r.error() : ""
        ));
    }
}