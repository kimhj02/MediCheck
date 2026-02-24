package com.medicheck.server.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security 설정.
 * - 공개 API(병원 목록/상세/근처, Swagger UI): permitAll
 * - 동기화 API(POST /api/hospitals/sync*): ROLE_ADMIN 필요 (X-Admin-Key 헤더 검증)
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final XAdminKeyAuthFilter xAdminKeyAuthFilter;
    private final PerIPDirectionsRateLimitFilter perIPDirectionsRateLimitFilter;
    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST,
                                "/api/hospitals/sync",
                                "/api/hospitals/sync/all",
                                "/api/hospitals/sync/region",
                                "/api/hospitals/sync/location")
                        .hasRole("ADMIN")
                        // 공개 인증 관련 엔드포인트만 허용 (me는 인증 필요)
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/signup",
                                "/api/auth/login/kakao",
                                "/api/hospitals/**",
                                "/api/directions/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/error"
                        )
                        .permitAll()
                        .anyRequest()
                        .authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(perIPDirectionsRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(xAdminKeyAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
