package com.medicheck.server.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI(Swagger) 문서 설정.
 * Swagger UI: /swagger-ui.html, API 스펙: /v3/api-docs
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI medicheckOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("MediCheck API")
                        .description("심평원·건보 공공데이터 기반 안심 병원 찾기 서비스 API. 병원 목록/상세/근처 조회, HIRA 동기화.")
                        .version("1.0"));
    }
}
