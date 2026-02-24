package com.medicheck.server.controller;

import com.medicheck.server.domain.entity.User;
import com.medicheck.server.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody Map<String, String> body) {
        String loginId = body.get("loginId");
        String password = body.get("password");
        String name = body.get("name");
        if (loginId == null || loginId.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "invalid_input", "message", "아이디와 비밀번호를 입력하세요."));
        }
        if (loginId.length() < 2 || loginId.length() > 50) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "invalid_login_id", "message", "아이디는 2~50자로 입력하세요."));
        }
        if (password.length() < 8) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "invalid_password", "message", "비밀번호는 8자 이상이어야 합니다."));
        }
        try {
            String token = authService.signup(loginId, password, name != null ? name : "");
            return ResponseEntity.ok(Map.of("token", token, "message", "회원가입이 완료되었습니다."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "signup_failed", "message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        String loginId = body.get("loginId");
        String password = body.get("password");
        if (loginId == null || loginId.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "invalid_input", "message", "아이디와 비밀번호를 입력하세요."));
        }
        try {
            String token = authService.login(loginId, password);
            return ResponseEntity.ok(Map.of("token", token));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "login_failed", "message", e.getMessage()));
        }
    }

    /**
     * 카카오 로그인 콜백 처리.
     * 프론트엔드에서 받은 인가 코드를 넘겨주면 JWT 토큰을 발급합니다.
     */
    @PostMapping("/login/kakao")
    public ResponseEntity<Map<String, Object>> kakaoLogin(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        String redirectUri = body.get("redirectUri");
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "invalid_input", "message", "카카오 로그인 코드가 없습니다."));
        }
        if (redirectUri == null || redirectUri.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "invalid_input", "message", "카카오 로그인 redirectUri가 없습니다."));
        }
        try {
            String token = authService.loginWithKakaoCode(code, redirectUri);
            return ResponseEntity.ok(Map.of("token", token));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(503)
                    .body(Map.of("error", "kakao_config_error", "message", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "kakao_login_failed", "message", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "unauthorized");
            return ResponseEntity.status(401).body(err);
        }
        try {
            User u = authService.getCurrentUser(auth.getName());
            Map<String, Object> body = new HashMap<>();
            body.put("loginId", u.getLoginId());
            body.put("name", u.getName());
            body.put("userId", u.getId());
            return ResponseEntity.ok(body);
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("error", "unauthorized");
            return ResponseEntity.status(401).body(err);
        }
    }
}
