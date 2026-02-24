package com.medicheck.server.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(prefix = "app.jwt")
@Validated
public class JwtProperties {

    /**
     * JWT 서명용 시크릿. 반드시 프로퍼티/환경변수에서 설정해야 합니다.
     */
    @NotBlank
    private String secret;

    /**
     * 액세스 토큰 만료 시간(ms). 최소 1ms 이상이어야 합니다.
     */
    @Min(1)
    private long expirationMs = 86400000; // 24h

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getExpirationMs() {
        return expirationMs;
    }

    public void setExpirationMs(long expirationMs) {
        this.expirationMs = expirationMs;
    }
}
