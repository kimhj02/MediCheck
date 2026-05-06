package com.medicheck.server.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * RestTemplate 빈 설정.
 * 카카오모빌리티 등 외부 API 호출용.
 */
@Configuration
public class RestTemplateConfig {

    private static final int CONNECT_TIMEOUT_MS = 5_000;
    private static final int READ_TIMEOUT_MS = 10_000;

    private RestTemplate createRestTemplate() {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(CONNECT_TIMEOUT_MS);
        factory.setReadTimeout(READ_TIMEOUT_MS);
        return new RestTemplate(factory);
    }

    @Bean(name = "kakaoRestTemplate")
    public RestTemplate kakaoRestTemplate() {
        return createRestTemplate();
    }

    /**
     * HIRA Open API 호출용 RestTemplate.
     * 카카오와 동일한 타임아웃(연결 5초, 읽기 10초)을 사용합니다.
     */
    @Bean(name = "hiraRestTemplate")
    public RestTemplate hiraRestTemplate() {
        return createRestTemplate();
    }
}
