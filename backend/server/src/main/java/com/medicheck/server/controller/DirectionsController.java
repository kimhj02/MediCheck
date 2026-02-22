package com.medicheck.server.controller;

import com.medicheck.server.config.KakaoMobilityProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 카카오모빌리티 길찾기 API 프록시.
 * REST API 키를 서버에 보관하고, 프론트에서 호출합니다.
 */
@RestController
@RequestMapping("/api/directions")
@RequiredArgsConstructor
@Slf4j
public class DirectionsController {

    private final KakaoMobilityProperties kakaoMobilityProperties;
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String DIRECTIONS_URL = "https://apis-navi.kakaomobility.com/v1/directions";

    /**
     * 출발지 → 목적지 경로 조회.
     * origin/destination: WGS84 위도,경도 (lat,lng)
     * 반환: Polyline 좌표 배열 [[lat,lng], ...] (카카오맵 LatLng 순서)
     */
    @GetMapping
    public ResponseEntity<?> getDirections(
            @RequestParam("originLat") double originLat,
            @RequestParam("originLng") double originLng,
            @RequestParam("destLat") double destLat,
            @RequestParam("destLng") double destLng
    ) {
        String key = kakaoMobilityProperties.getRestApiKey();
        if (key == null || key.isBlank()) {
            return ResponseEntity.status(503).body(Map.of(
                    "error", "directions_unavailable",
                    "message", "길찾기 API가 설정되지 않았습니다. kakao.mobility.rest-api-key를 설정하세요."
            ));
        }

        // origin, destination: lng,lat (Kakao API uses x=경도, y=위도)
        String origin = originLng + "," + originLat;
        String dest = destLng + "," + destLat;
        String url = DIRECTIONS_URL + "?origin=" + origin + "&destination=" + dest + "&summary=false";

        try {
            var headers = new org.springframework.http.HttpHeaders();
            headers.set("Authorization", "KakaoAK " + key);
            var entity = new org.springframework.http.HttpEntity<>(headers);
            var response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity, Map.class);

            @SuppressWarnings("unchecked")
            Map<String, Object> body = (Map<String, Object>) response.getBody();
            if (body == null) {
                return ResponseEntity.status(502).body(Map.of("error", "empty_response"));
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> routes = (List<Map<String, Object>>) body.get("routes");
            if (routes == null || routes.isEmpty()) {
                return ResponseEntity.ok(Map.of("path", List.of(), "distance", 0, "duration", 0));
            }

            Map<String, Object> route = routes.get(0);
            Integer resultCode = (Integer) route.get("result_code");
            if (resultCode != null && resultCode != 0) {
                return ResponseEntity.status(400).body(Map.of(
                        "error", "route_failed",
                        "message", String.valueOf(route.getOrDefault("result_msg", "경로 탐색 실패"))
                ));
            }

            List<List<Double>> path = extractPath(route);
            Map<String, Object> summary = (Map<String, Object>) route.get("summary");
            int distance = summary != null && summary.get("distance") != null
                    ? ((Number) summary.get("distance")).intValue() : 0;
            int duration = summary != null && summary.get("duration") != null
                    ? ((Number) summary.get("duration")).intValue() : 0;

            return ResponseEntity.ok(Map.of(
                    "path", path,
                    "distance", distance,
                    "duration", duration
            ));
        } catch (Exception e) {
            log.warn("Kakao Mobility Directions API 호출 실패", e);
            return ResponseEntity.status(502).body(Map.of(
                    "error", "api_error",
                    "message", e.getMessage()
            ));
        }
    }

    @SuppressWarnings("unchecked")
    private List<List<Double>> extractPath(Map<String, Object> route) {
        List<List<Double>> path = new ArrayList<>();
        List<Map<String, Object>> sections = (List<Map<String, Object>>) route.get("sections");
        if (sections == null) return path;

        for (Map<String, Object> section : sections) {
            List<Map<String, Object>> roads = (List<Map<String, Object>>) section.get("roads");
            if (roads == null) continue;
            for (Map<String, Object> road : roads) {
                List<Number> vertexes = (List<Number>) road.get("vertexes");
                if (vertexes == null) continue;
                // vertexes: [lng1, lat1, lng2, lat2, ...]
                for (int i = 0; i + 1 < vertexes.size(); i += 2) {
                    double lng = vertexes.get(i).doubleValue();
                    double lat = vertexes.get(i + 1).doubleValue();
                    path.add(List.of(lat, lng)); // [lat, lng] for Kakao LatLng
                }
            }
        }
        return path;
    }
}
