package com.medicheck.server.client.hira;

import com.medicheck.server.client.hira.dto.HiraAsmApiResponse;
import com.medicheck.server.client.hira.dto.HiraAsmItem;
import com.medicheck.server.config.HiraEvalApiProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.List;

/**
 * 건강보험심사평가원 병원평가정보서비스 Open API 클라이언트.
 * getHospAsmInfo1(병원평가상세등급조회) 호출.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class HiraEvaluationClient {

    private static final String OPERATION = "getHospAsmInfo1";
    private static final String RESPONSE_TYPE_JSON = "json";

    private final HiraEvalApiProperties properties;
    @Qualifier("hiraRestTemplate")
    private final RestTemplate restTemplate;

    /**
     * 병원평가상세등급 조회 (페이징). ykiho 생략 시 전체 조회.
     *
     * @param pageNo    페이지 번호 (1부터)
     * @param numOfRows 한 페이지 결과 수
     * @param ykiho     암호화된 요양기호 (null 이면 미지정)
     * @return 평가 항목별 등급 목록
     * @throws HiraApiException 인증키 누락, 비정상 응답, 통신 오류 등 HIRA API 에러 발생 시
     */
    public List<HiraAsmItem> getHospAsmInfo(int pageNo, int numOfRows, String ykiho) {
        if (properties.getServiceKey() == null || properties.getServiceKey().isBlank()) {
            log.warn("HIRA 평가 API 인증키가 설정되지 않았습니다. hira.eval.service-key 또는 HIRA_SERVICE_KEY 를 설정하세요.");
            throw new HiraApiException("HIRA 평가 API 인증키가 설정되지 않았습니다. hira.eval.service-key 또는 HIRA_SERVICE_KEY 를 설정하세요.");
        }

        try {
            UriComponentsBuilder builder = UriComponentsBuilder
                    .fromUriString(properties.getBaseUrl() + "/" + OPERATION)
                    .queryParam("ServiceKey", properties.getServiceKey())
                    .queryParam("pageNo", pageNo)
                    .queryParam("numOfRows", numOfRows)
                    .queryParam("_type", RESPONSE_TYPE_JSON);
            if (ykiho != null && !ykiho.isBlank()) {
                builder.queryParam("ykiho", ykiho);
            }

            URI uri = builder.build().encode().toUri();
            ResponseEntity<HiraAsmApiResponse> response = restTemplate.getForEntity(uri, HiraAsmApiResponse.class);
            HiraAsmApiResponse body = response.getBody();

            if (body == null) {
                log.warn("HIRA 평가 API 응답 body가 null입니다.");
                throw new HiraApiException("HIRA 평가 API 응답 body가 null입니다.");
            }
            if (body.getResponse() != null && body.getResponse().getHeader() != null) {
                String code = body.getResponse().getHeader().getResultCode();
                String msg = body.getResponse().getHeader().getResultMsg();
                if (!"00".equals(code)) {
                    log.warn("HIRA 평가 API 오류: resultCode={}, resultMsg={}", code, msg);
                    throw new HiraApiException("HIRA 평가 API 오류: resultCode=" + code + ", resultMsg=" + msg);
                }
            }
            return body.getItemList();
        } catch (Exception e) {
            log.error("HIRA 평가 API 호출 실패", e);
            throw new HiraApiException("HIRA 평가 API 호출 실패", e);
        }
    }
}
