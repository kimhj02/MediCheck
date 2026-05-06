package com.medicheck.server.global.auth;

import com.medicheck.server.global.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    private final JwtProperties props;
    private final SecretKey key;

    public JwtService(JwtProperties props) {
        this.props = props;
        this.key = hmacKeyFromConfiguredSecret(props.getSecret());
    }

    /**
     * JJWT는 HMAC 키를 UTF-8 바이트 기준 최소 256비트(32바이트)를 요구한다.
     * JwtSecretValidator와 동일하게 UTF-8 기준 32바이트 미만 시크릿은 허용하지 않는다.
     */
    private static SecretKey hmacKeyFromConfiguredSecret(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException("app.jwt.secret / JWT_SECRET must be set and non-empty.");
        }
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalArgumentException(
                    "JWT_SECRET must be at least 32 bytes in UTF-8. currentBytes=" + keyBytes.length
            );
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String createToken(String loginId, Long userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + props.getExpirationMs());
        return Jwts.builder()
                .subject(loginId)
                .claim("userId", userId)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getLoginIdFromToken(String token) {
        return parseToken(token).getSubject();
    }

    public Long getUserIdFromToken(String token) {
        return parseToken(token).get("userId", Long.class);
    }
}
