package com.medicheck.server.security;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.LoadingCache;
import com.medicheck.server.config.DirectionsRateLimitProperties;
import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

/**
 * /api/directions GET 요청에 대해 IP별 호출 제한을 적용합니다.
 * Resilience4j RateLimiter를 IP마다 Caffeine 캐시로 관리합니다.
 */
@Component
public class PerIPDirectionsRateLimitFilter extends OncePerRequestFilter {

    private static final String DIRECTIONS_PATH = "/api/directions";

    private final LoadingCache<String, RateLimiter> limiters;

    public PerIPDirectionsRateLimitFilter(DirectionsRateLimitProperties props) {
        RateLimiterConfig config = RateLimiterConfig.custom()
                .limitForPeriod(props.getPerClientLimitForPeriod())
                .limitRefreshPeriod(props.getPerClientRefreshPeriod())
                .timeoutDuration(Duration.ZERO)
                .build();
        this.limiters = Caffeine.newBuilder()
                .maximumSize(10_000)
                .expireAfterAccess(Duration.ofMinutes(10))
                .build(ip -> RateLimiter.of(ip, config));
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
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        String remote = request.getRemoteAddr();
        return remote != null ? remote : "unknown";
    }
}
