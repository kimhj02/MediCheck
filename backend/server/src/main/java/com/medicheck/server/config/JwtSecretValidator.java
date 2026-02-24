package com.medicheck.server.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 기동 시 JWT 시크릿(app.jwt.secret 또는 환경변수 JWT_SECRET)이 올바르게 설정되었는지 검증합니다.
 * 예측 가능한 기본값을 코드/설정에 두지 않고, 반드시 환경별로 강한 시크릿을 설정하도록 강제합니다.
 */
@Component
@RequiredArgsConstructor
public class JwtSecretValidator {

    private final JwtProperties jwtProperties;

    @PostConstruct
    public void validate() {
        String secret = jwtProperties.getSecret();
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "JWT 시크릿(app.jwt.secret 또는 환경변수 JWT_SECRET)이 설정되지 않았습니다. " +
                            "환경변수 JWT_SECRET 에 충분히 긴 임의 문자열을 설정한 뒤 서버를 기동하세요."
            );
        }
        if (secret.length() < 32) {
            throw new IllegalStateException(
                    "JWT 시크릿이 너무 짧습니다. 최소 32자 이상의 예측 불가능한 시크릿을 사용하세요."
            );
        }
    }
}

