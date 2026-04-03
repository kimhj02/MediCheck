package com.medicheck.server.controller;

import lombok.extern.slf4j.Slf4j;
import com.medicheck.server.dto.HospitalResponse;
import com.medicheck.server.dto.NearbyHospitalResponse;
import com.medicheck.server.dto.SyncResult;
import com.medicheck.server.service.HiraSyncService;
import com.medicheck.server.service.HospitalEvaluationSyncService;
import com.medicheck.server.service.HospitalTop5SyncService;
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

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * 안심 병원 API.
 */
@Tag(name = "01. 병원 조회·HIRA 동기화", description = "병원 목록·상세·근처 검색, 심평원 병원/평가 동기화(관리자 키 필요)")
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
    private final HospitalTop5SyncService hospitalTop5SyncService;

    /**
     * 병원 목록 조회 (검색/필터/정렬/페이지네이션).
     * GET /api/hospitals?page=0&size=20&keyword=검색어&department=내과&sort=name,asc
     */
    /**
     * 병원 상세 조회.
     * GET /api/hospitals/{id}
     */
    @Operation(summary = "병원 상세", description = "병원 ID로 상세 정보를 조회합니다. 심평원 평가·리뷰 요약이 있으면 포함됩니다.")
    @GetMapping("/{id}")
    public ResponseEntity<HospitalResponse> getHospital(
            @Parameter(description = "병원 PK") @PathVariable Long id) {
        return hospitalService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "병원 목록", description = "keyword(이름·주소·진료과), department 필터, 페이지네이션·정렬을 지원합니다.")
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
     * 증상·질환 키워드로 병원 검색 (HIRA Top5 질병명 기준).
     * GET /api/hospitals/search/symptom?symptom=두통&keyword=구미&page=0&size=20
     */
    @Operation(
            summary = "증상·질환 기준 병원 검색",
            description = "병원진료정보 Top5(상위 5개 질병명) 중 하나라도 symptom 토큰과 부분 일치하면 포함됩니다. "
                    + "공백·쉼표로 여러 토큰을 넣으면 하나라도 매칭되면 포함(OR)합니다. "
                    + "keyword·department는 기존 목록 검색과 동일한 추가 필터입니다."
    )
    @GetMapping("/search/symptom")
    public ResponseEntity<Page<HospitalResponse>> searchBySymptom(
            @Parameter(description = "증상 또는 질환 키워드 (예: 두통, 감기)") @RequestParam("symptom") String symptom,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String department,
            @PageableDefault(size = 20, sort = "name") Pageable pageable
    ) {
        Page<HospitalResponse> page = hospitalService.findAllBySymptom(symptom, keyword, department, pageable);
        return ResponseEntity.ok(page);
    }

    /**
     * 근처 병원 조회.
     * 사용자의 위치(lat, lng)에서 반경(radiusMeters m) 내 병원을 거리 오름차순으로 반환합니다.
     * 각 항목에 distanceMeters(미터)가 포함됩니다.
     *
     * 예: GET /api/hospitals/nearby?lat=37.5665&lng=126.9780&radiusMeters=3000
     */
    @Operation(summary = "근처 병원", description = "lat, lng 기준 반경(radiusMeters) 내 병원을 거리순으로 반환합니다. 응답 헤더 X-Returned-Count, X-Truncated 참고.")
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
    @Operation(summary = "HIRA 페이지 동기화", description = "관리자 키(X-Admin-Key) 필요. HIRA 병원기본목록 1페이지를 DB에 반영합니다.")
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
    @Operation(summary = "HIRA 위치 반경 동기화", description = "관리자 키 필요. 지정 좌표 반경 내 병원을 HIRA에서 조회해 DB에 저장합니다.")
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
    @Operation(summary = "HIRA 시·도 동기화", description = "관리자 키 필요. sidoCd(예: 경북 470000) 단위로 HIRA 병원 목록을 동기화합니다.")
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
    @Operation(summary = "HIRA 전국 동기화", description = "관리자 키 필요. 시·도별로 순회하며 전국 병원 정보를 동기화합니다. 시간이 오래 걸릴 수 있습니다.")
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
    @Operation(summary = "심평원 평가 전체 동기화", description = "관리자 키 필요. getHospAsmInfo1 페이지를 순회해 DB에 있는 병원만 평가 정보를 저장·갱신합니다. maxSynced로 건수 제한 가능.")
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
    @Operation(summary = "심평원 평가 지역 동기화", description = "관리자 키 필요. 주소에 addressKeyword(예: 구미)가 포함된 병원만 평가를 1건씩 동기화합니다.")
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
    @Operation(summary = "심평원 평가 1건 동기화", description = "관리자 키 필요. 요양기호(ykiho) 한 병원만 평가 API로 조회해 저장합니다.")
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

    /**
     * 주소에 특정 키워드가 포함된 병원만 Top5(진료량 상위 5 질병)를 동기화 (예: 구미 지역).
     * X-Admin-Key 헤더 필요.
     * POST /api/hospitals/sync/top5/region?addressKeyword=구미
     * POST /api/hospitals/sync/top5/region?addressKeyword=구미&maxSynced=100
     */
    @Operation(summary = "심평원 진료 Top5 지역 동기화", description = "관리자 키 필요. 주소에 addressKeyword(예: 구미)가 포함된 병원만 Top5(진료량 상위 5 질병) 1건씩 동기화합니다.")
    @PostMapping("/sync/top5/region")
    public ResponseEntity<?> syncTop5ByRegion(
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
            int count = hospitalTop5SyncService.syncByAddressKeyword(addressKeyword.trim(), maxSynced);
            return ResponseEntity.ok(Map.of(
                    "synced", count,
                    "addressKeyword", addressKeyword.trim(),
                    "message", "해당 지역 진료 Top5 동기화 완료"
            ));
        } catch (Exception e) {
            String errorId = java.util.UUID.randomUUID().toString();
            log.error("진료 Top5 지역 동기화 실패 errorId={}", errorId, e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", "sync-top5-region failed",
                    "message", "internal server error",
                    "errorId", errorId
            ));
        }
    }

    /**
     * 특정 요양기호(ykiho)의 진료 Top5(진료량 상위 5 질병)를 1건 동기화한다.
     * X-Admin-Key 헤더 필요.
     * POST /api/hospitals/sync/top5/one?ykiho=암호화된요양기호
     */
    @Operation(summary = "심평원 진료 Top5 1건 동기화", description = "관리자 키 필요. 요양기호(ykiho) 한 병원의 Top5(진료량 상위 5 질병) 데이터를 저장·갱신합니다.")
    @PostMapping("/sync/top5/one")
    public ResponseEntity<?> syncTop5One(@RequestParam("ykiho") String ykiho) {
        if (ykiho == null || ykiho.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "invalid_ykiho",
                    "message", "ykiho는 필수입니다."
            ));
        }
        try {
            boolean synced = hospitalTop5SyncService.syncOne(ykiho);
            if (synced) {
                return ResponseEntity.ok(Map.of("synced", true, "message", "해당 병원 Top5 동기화 완료"));
            }
            return ResponseEntity.ok(Map.of("synced", false, "message", "해당 병원이 DB에 없거나 API 결과가 없습니다."));
        } catch (Exception e) {
            String errorId = java.util.UUID.randomUUID().toString();
            log.error("진료 Top5 1건 동기화 실패 errorId={}", errorId, e);
            return ResponseEntity.status(500).body(Map.of(
                    "error", "sync-top5-one failed",
                    "message", "internal server error",
                    "errorId", errorId
            ));
        }
    }
}
