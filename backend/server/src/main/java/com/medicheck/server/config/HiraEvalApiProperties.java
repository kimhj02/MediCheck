package com.medicheck.server.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

/**
 * 건강보험심사평가원 병원평가정보서비스 Open API 설정.
 * getHospAsmInfo1(병원평가상세등급조회).
 */
@ConfigurationProperties(prefix = "hira.eval")
@Getter
@Setter
public class HiraEvalApiProperties {

    /** API 기본 URL (hospAsmInfoService1) */
    private String baseUrl = "https://apis.data.go.kr/B551182/hospAsmInfoService1";

    /** 공공데이터포털 서비스 인증키 (hira.api 와 동일 키 사용 가능) */
    private String serviceKey = "";
}
