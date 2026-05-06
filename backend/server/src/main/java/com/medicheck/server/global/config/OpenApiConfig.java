package com.medicheck.server.global.config;

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
                        .title("MediCheck · 안심 병원 찾기 API")
                        .description("""
                                NHIS MediCheck 백엔드 API 명세입니다.

                                • **병원** — 목록·상세·근처 검색, 심평원(HIRA) 동기화(관리자)
                                • **리뷰·즐겨찾기** — 로그인 후 이용
                                • **인증** — 회원가입·로그인·카카오 OAuth
                                • **길찾기** — 카카오모빌리티 경로 조회
                                """)
                        .version("1.0"));
    }
}
