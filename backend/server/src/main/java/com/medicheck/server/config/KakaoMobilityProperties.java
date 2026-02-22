package com.medicheck.server.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Getter;
import lombok.Setter;

/**
 * 카카오모빌리티 길찾기 API 설정.
 * developers.kakao.com → 앱 → 플랫폼 키 → REST API 키 사용.
 */
@ConfigurationProperties(prefix = "kakao.mobility")
@Getter
@Setter
public class KakaoMobilityProperties {

    /** REST API 키 (KakaoAK 인증용) */
    private String restApiKey = "";
}
