package com.medicheck.server.client.hira;

import com.medicheck.server.client.hira.dto.HiraClinicTop5Item;
import com.medicheck.server.config.HiraDiagApiProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;

/**
 * HIRA 병원진료정보조회서비스(OpenAPI) 클라이언트.
 * getClinicTop5List1 호출을 통해 요양기호(ykiho) 기반 진료량 상위 5 질병명을 조회한다.
 *
 * 응답은 문서 기준 XML이며, {@link HiraClinicTop5Item#fromXml(String)} 로 파싱한다.
 */
@Component
@Slf4j
public class HiraClinicTop5Client {

    private static final String OPERATION = "getClinicTop5List1";

    private final HiraDiagApiProperties properties;

    private final RestTemplate restTemplate;

    public HiraClinicTop5Client(
            HiraDiagApiProperties properties,
            @Qualifier("hiraRestTemplate") RestTemplate restTemplate
    ) {
        this.properties = properties;
        this.restTemplate = restTemplate;
    }

    public HiraClinicTop5Item getClinicTop5List1(String ykiho, int pageNo, int numOfRows) {
        if (properties.getServiceKey() == null || properties.getServiceKey().isBlank()) {
            log.warn("HIRA 진료Top5 API 인증키가 설정되지 않았습니다. hira.diag.api.service-key 또는 HIRA_SERVICE_KEY 확인");
            return null;
        }
        if (ykiho == null || ykiho.isBlank()) return null;

        try {
            UriComponentsBuilder builder = UriComponentsBuilder
                    .fromUriString(properties.getBaseUrl() + "/" + OPERATION)
                    .queryParam("ServiceKey", properties.getServiceKey())
                    .queryParam("numOfRows", numOfRows)
                    .queryParam("pageNo", pageNo)
                    .queryParam("ykiho", ykiho);

            URI uri = builder.build().encode().toUri();
            ResponseEntity<String> response = restTemplate.getForEntity(uri, String.class);
            String raw = response.getBody();

            if (raw == null || raw.isBlank()) return null;
            HiraClinicTop5Item parsed = HiraClinicTop5Item.fromXml(raw);
            if (parsed == null) {
                String compact = raw.replaceAll("\\s+", " ");
                if (compact.length() > 400) compact = compact.substring(0, 400) + "...";
                log.warn("HIRA getClinicTop5List1 파싱 결과 없음 ykiho={}, status={}, raw={}",
                        ykiho, response.getStatusCode().value(), compact);
            }
            return parsed;
        } catch (Exception e) {
            log.error("HIRA getClinicTop5List1 호출 실패 ykiho={}", ykiho, e);
            return null;
        }
    }
}

