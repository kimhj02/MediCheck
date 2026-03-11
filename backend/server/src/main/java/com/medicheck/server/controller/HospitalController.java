package com.medicheck.server.controller;

import lombok.extern.slf4j.Slf4j;
import com.medicheck.server.dto.HospitalResponse;
import com.medicheck.server.dto.NearbyHospitalResponse;
import com.medicheck.server.dto.SyncResult;
import com.medicheck.server.service.HiraSyncService;
import com.medicheck.server.service.HospitalEvaluationSyncService;
import com.medicheck.server.service.HospitalService;
import com.medicheck.server.service.NearbyQueryContextHolder;
import com.medicheck.server.service.NearbyQueryMetadata;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * 안심 병원 API.
 */
@RestController
@RequestMapping("/api/hospitals")
@RequiredArgsConstructor
@Slf4j
public class HospitalController {

    private static final int SIDO_CD_MAX_LENGTH = 20;
    private static final Pattern SIDO_CD_PATTERN = Pattern.compile("^[0-9]{1," + SIDO_CD_MAX_LENGTH + "}$");

    private final HospitalService hospitalService;
    private final HiraSyncService hiraSyncService;
    private final HospitalEvaluationSyncService hospitalEvaluationSyncService;

    /**
     * 병원 목록 조회 (검색/필터/정렬/페이지네이션).
     * GET /api/hospitals?page=0&size=20&keyword=검색어&department=내과&sort=name,asc
     */
    /**
     * 병원 상세 조회.
     * GET /api/hospitals/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<HospitalResponse> getHospital(@PathVariable Long id) {
        return hospitalService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<Page<HospitalResponse>> getHospitals(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String department,
            @PageableDefault(size = 20, sort = "name") Pageable pageable
    ) {
        Page<HospitalResponse> page = hospitalService.findAll(keyword, department, pageable);
        return ResponseEntity.ok(page);
    }

    /**
     * 근처 병원 조회.
     * 사용자의 위치(lat, lng)에서 반경(radiusMeters m) 내 병원을 거리 오름차순으로 반환합니다.
     * 각 항목에 distanceMeters(미터)가 포함됩니다.
     *
     * 예: GET /api/hospitals/nearby?lat=37.5665&lng=126.9780&radiusMeters=3000
     */
    @GetMapping("/nearby")
    public ResponseEntity<List<NearbyHospitalResponse>> getNearbyHospitals(
            @RequestParam("lat") BigDecimal latitude,
            @RequestParam("lng") BigDecimal longitude,
            @RequestParam(name = "radiusMeters", defaultValue = "3000") double radiusMeters
    ) {
        try {
            List<NearbyHospitalResponse> hospitals = hospitalService.findNearby(latitude, longitude, radiusMeters);

            NearbyQueryMetadata metadata = NearbyQueryContextHolder.getMetadata();
            HttpHeaders headers = new HttpHeaders();
            if (metadata != null) {
                headers.add("X-Returned-Count", String.valueOf(metadata.returnedCount()));
                headers.add("X-Truncated", String.valueOf(metadata.truncated()));
            }

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(hospitals);
        } finally {
            NearbyQueryContextHolder.clear();
        }
    }

    /**
     * HIRA 병원정보 Open API에서 데이터를 가져와 DB에 동기화합니다.
     * local 프로필 사용 시 application-local.yaml 의 인증키가 적용됩니다.
     * POST /api/hospitals/sync?pageNo=1&numOfRows=100
     */
    @PostMapping("/sync")
    public ResponseEntity<?> syncFromHira(
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "100") int numOfRows
    ) {
        try {
            SyncResult result = hiraSyncService.syncFromHira(pageNo, numOfRows);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            // 민감한 예외 정보는 로그에만 남기고, 클라이언트에는 에러 ID만 노출
            String errorId = java.util.UUID.randomUUID().toString();
            log.error("HIRA 동기화 실패 errorId={}", errorId, e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", "sync failed",
                    "message", "internal server error",
                    "errorId", errorId
            ));
        }
    }

    /**
     * 지정 좌표 반경 내 병원을 HIRA에서 조회해 DB에 동기화합니다.
     * 구미시 전체: lat=36.12, lng=128.34, radiusMeters=20000 (약 20km)
     * POST /api/hospitals/sync/location?lat=36.12&lng=128.34&radiusMeters=20000
     */
    @PostMapping("/sync/location")
    public ResponseEntity<?> syncByLocation(
            @RequestParam("lat") double lat,
            @RequestParam("lng") double lng,
            @RequestParam(defaultValue = "50000") int radiusMeters,
            @RequestParam(defaultValue = "500") int numOfRows
    ) {
        try {
            SyncResult result = hiraSyncService.syncByLocation(lat, lng, radiusMeters, numOfRows);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            String errorId = java.util.UUID.randomUUID().toString();
            log.error("HIRA 위치 동기화 실패 errorId={}", errorId, e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", "sync-location failed",
                    "message", "internal server error",
                    "errorId", errorId
            ));
        }
    }

    /**
     * 지정 시·도 병원 정보만 HIRA에서 조회해 DB에 동기화합니다.
     * 구미(경북): sidoCd=470000
     * POST /api/hospitals/sync/region?sidoCd=470000&numOfRows=500
     */
    @PostMapping("/sync/region")
    public ResponseEntity<?> syncRegionFromHira(
            @RequestParam("sidoCd") String sidoCd,
            @RequestParam(defaultValue = "500") int numOfRows
    ) {
        String sanitized = sidoCd != null ? sidoCd.trim() : "";
        if (sanitized.isEmpty() || !SIDO_CD_PATTERN.matcher(sanitized).matches()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "invalid_sido_cd",
                    "message", "sidoCd는 1~20자리 숫자만 허용됩니다."
            ));
        }
        try {
            SyncResult result = hiraSyncService.syncRegion(sanitized, numOfRows);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            String errorId = java.util.UUID.randomUUID().toString();
            log.error("HIRA 지역 동기화 실패 errorId={}", errorId, e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", "sync-region failed",
                    "message", "internal server error",
                    "errorId", errorId
            ));
        }
    }

    /**
     * 전국 시·도 병원 정보를 HIRA에서 조회해 DB에 동기화합니다.
     * 페이지 수는 HIRA 응답이 끝날 때까지 자동으로 순회합니다.
     * POST /api/hospitals/sync/all?numOfRows=500
     */
    @PostMapping("/sync/all")
    public ResponseEntity<?> syncAllFromHira(
            @RequestParam(defaultValue = "500") int numOfRows
    ) {
        try {
            SyncResult result = hiraSyncService.syncAllRegions(numOfRows);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            String errorId = java.util.UUID.randomUUID().toString();
            log.error("HIRA 전국 동기화 실패 errorId={}", errorId, e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", "sync-all failed",
                    "message", "internal server error",
                    "errorId", errorId
            ));
        }
    }

    /**
     * HIRA 병원평가정보(getHospAsmInfo1)를 DB에 동기화합니다.
     * 우리 DB에 등록된 병원(ykiho 매칭)만 저장/갱신합니다. X-Admin-Key 헤더 필요.
     * POST /api/hospitals/sync/evaluations
     * POST /api/hospitals/sync/evaluations?maxSynced=50  → 최대 50건만 동기화 (일부만 확인 시)
     */
    @PostMapping("/sync/evaluations")
    public ResponseEntity<?> syncEvaluations(
            @RequestParam(required = false) Integer maxSynced
    ) {
        try {
            int count = hospitalEvaluationSyncService.syncAll(maxSynced);
            return ResponseEntity.ok(Map.of(
                    "synced", count,
                    "message", "병원평가정보 동기화 완료"
            ));
        } catch (Exception e) {
            String errorId = java.util.UUID.randomUUID().toString();
            log.error("병원평가정보 동기화 실패 errorId={}", errorId, e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", "sync-evaluations failed",
                    "message", "internal server error",
                    "errorId", errorId
            ));
        }
    }

    /**
     * 주소에 특정 키워드가 포함된 병원만 평가정보 동기화 (예: 구미 지역만).
     * X-Admin-Key 헤더 필요.
     * POST /api/hospitals/sync/evaluations/region?addressKeyword=구미
     * POST /api/hospitals/sync/evaluations/region?addressKeyword=구미&maxSynced=100
     */
    @PostMapping("/sync/evaluations/region")
    public ResponseEntity<?> syncEvaluationsByRegion(
            @RequestParam("addressKeyword") String addressKeyword,
            @RequestParam(required = false) Integer maxSynced
    ) {
        if (addressKeyword == null || addressKeyword.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "invalid_addressKeyword",
                    "message", "addressKeyword는 필수입니다 (예: 구미)."
            ));
        }
        try {
            int count = hospitalEvaluationSyncService.syncByAddressKeyword(addressKeyword.trim(), maxSynced);
            return ResponseEntity.ok(Map.of(
                    "synced", count,
                    "addressKeyword", addressKeyword.trim(),
                    "message", "해당 지역 병원평가정보 동기화 완료"
            ));
        } catch (Exception e) {
            String errorId = java.util.UUID.randomUUID().toString();
            log.error("병원평가정보 지역 동기화 실패 errorId={}", errorId, e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", "sync-evaluations-region failed",
                    "message", "internal server error",
                    "errorId", errorId
            ));
        }
    }

    /**
     * 특정 요양기호(ykiho)의 병원평가정보 1건만 동기화합니다. X-Admin-Key 헤더 필요.
     * POST /api/hospitals/sync/evaluations/one?ykiho=암호화된요양기호
     */
    @PostMapping("/sync/evaluations/one")
    public ResponseEntity<?> syncEvaluationOne(@RequestParam("ykiho") String ykiho) {
        if (ykiho == null || ykiho.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "invalid_ykiho",
                    "message", "ykiho는 필수입니다."
            ));
        }
        try {
            boolean synced = hospitalEvaluationSyncService.syncOne(ykiho);
            if (synced) {
                return ResponseEntity.ok(Map.of("synced", true, "message", "해당 병원 평가정보 동기화 완료"));
            }
            return ResponseEntity.ok(Map.of("synced", false, "message", "해당 병원이 DB에 없거나 API 결과가 없습니다."));
        } catch (Exception e) {
            String errorId = java.util.UUID.randomUUID().toString();
            log.error("병원평가정보 1건 동기화 실패 errorId={}", errorId, e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", "sync-evaluations-one failed",
                    "message", "internal server error",
                    "errorId", errorId
            ));
        }
    }
}
