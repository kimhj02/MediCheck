package com.medicheck.server.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 건강보험심사평가원 병원진료정보조회서비스(OpenAPI) 설정.
 * getClinicTop5List1(요양기호 기반 진료량 상위 5 질병 목록) 호출용.
 */
@ConfigurationProperties(prefix = "hira.diag")
@Getter
@Setter
public class HiraDiagApiProperties {

    /** API 기본 URL: hospDiagInfoService1 */
    private String baseUrl = "https://apis.data.go.kr/B551182/hospDiagInfoService1";

    /** 공공데이터포털 인증키 */
    private String serviceKey = "";
}

