package com.medicheck.server.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * POST /api/hospitals/sync 및 /api/hospitals/sync/all 요청에 대해 X-Admin-Key 헤더를 검증합니다.
 * 유효한 경우 ROLE_ADMIN으로 인증하고, 무효한 경우 403을 반환합니다.
 */
@Component
@Slf4j
public class XAdminKeyAuthFilter extends OncePerRequestFilter {

    private static final String ADMIN_KEY_HEADER = "X-Admin-Key";
    private static final String ROLE_ADMIN = "ROLE_ADMIN";

    @Value("${admin.sync-key:${ADMIN_SYNC_KEY:}}")
    private String adminSyncKey;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !("POST".equalsIgnoreCase(request.getMethod())
                && ("/api/hospitals/sync".equals(path) || "/api/hospitals/sync/all".equals(path)));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (adminSyncKey == null || adminSyncKey.isBlank()) {
            log.error(
                    "admin.sync-key(또는 ADMIN_SYNC_KEY)가 비어 있어 동기화 API 접근을 거부합니다. "
                            + "프로덕션에서는 반드시 비어 있지 않은 값으로 설정해야 합니다."
            );
            sendForbidden(response);
            return;
        }
        String key = request.getHeader(ADMIN_KEY_HEADER);
        if (key == null || !adminSyncKey.equals(key)) {
            sendForbidden(response);
            return;
        }
        var auth = new UsernamePasswordAuthenticationToken(
                "admin",
                null,
                Collections.singletonList(new SimpleGrantedAuthority(ROLE_ADMIN))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
        filterChain.doFilter(request, response);
    }

    private void sendForbidden(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"error\":\"forbidden\",\"message\":\"admin access required for sync\"}");
    }
}
