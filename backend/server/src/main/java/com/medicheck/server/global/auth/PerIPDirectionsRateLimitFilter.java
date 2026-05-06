package com.medicheck.server.global.auth;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.LoadingCache;
import com.medicheck.server.global.config.DirectionsRateLimitProperties;
import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.InetAddress;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;
import java.time.Duration;

/**
 * /api/directions GET 요청에 대해 IP별 호출 제한을 적용합니다.
 * Resilience4j RateLimiter를 IP마다 Caffeine 캐시로 관리합니다.
 */
@Component
public class PerIPDirectionsRateLimitFilter extends OncePerRequestFilter {

    private static final String DIRECTIONS_PATH = "/api/directions";

    private final LoadingCache<String, RateLimiter> limiters;
    private final Set<String> trustedProxies;

    public PerIPDirectionsRateLimitFilter(
            DirectionsRateLimitProperties props,
            @Value("${app.security.trusted-proxies:127.0.0.1,::1}") String trustedProxiesRaw) {
        RateLimiterConfig config = RateLimiterConfig.custom()
                .limitForPeriod(props.getPerClientLimitForPeriod())
                .limitRefreshPeriod(props.getPerClientRefreshPeriod())
                .timeoutDuration(Duration.ZERO)
                .build();
        this.limiters = Caffeine.newBuilder()
                .maximumSize(10_000)
                .expireAfterAccess(Duration.ofMinutes(10))
                .build(ip -> RateLimiter.of(ip, config));
        this.trustedProxies = Arrays.stream(trustedProxiesRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!"GET".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        return path == null || !path.startsWith(DIRECTIONS_PATH);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String clientIp = resolveClientIp(request);
        RateLimiter limiter = limiters.get(clientIp);

        if (!limiter.acquirePermission()) {
            response.setStatus(429); // TOO_MANY_REQUESTS
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":\"rate_limit_exceeded\",\"message\":\"요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String remote = request.getRemoteAddr();
        if (!isTrustedProxy(remote)) {
            return remote != null ? remote : "unknown";
        }

        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String candidate = forwarded.split(",")[0].trim();
            if (isValidIp(candidate)) {
                return candidate;
            }
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank() && isValidIp(realIp.trim())) {
            return realIp.trim();
        }
        return remote != null ? remote : "unknown";
    }

    private boolean isTrustedProxy(String ip) {
        return ip != null && trustedProxies.contains(ip);
    }

    private boolean isValidIp(String ip) {
        try {
            InetAddress.getByName(ip);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }
}
