package com.medicheck.server.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 카카오 OAuth 로그인 설정.
 * developers.kakao.com → 앱 → REST API 키, 클라이언트 시크릿 사용.
 */
@ConfigurationProperties(prefix = "kakao.oauth")
@Getter
@Setter
public class KakaoOAuthProperties {

    /** 카카오 앱 REST API 키 (client_id) */
    private String restApiKey = "";

    /** 카카오 앱 클라이언트 시크릿 (선택) */
    private String clientSecret = "";
}

