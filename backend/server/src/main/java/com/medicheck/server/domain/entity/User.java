package com.medicheck.server.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 사용자 엔티티. 회원가입/로그인용.
 */
@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String loginId;

    /**
     * 기존 DB 스키마에 존재하는 이메일 컬럼과 매핑.
     * 현재 화면에서는 실제 이메일을 받지 않으므로,
     * loginId 기반의 내부용 이메일을 자동으로 생성해서 저장합니다.
     */
    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false, length = 255)
    private String passwordHash;

    /**
     * 기존 스키마에 남아있는 password 컬럼과 매핑.
     * 실제로는 사용하지 않고, passwordHash 값으로 채워서
     * NOT NULL 제약만 만족시킵니다.
     */
    @Column(name = "password", nullable = false, length = 255)
    private String legacyPassword;

    @Column(nullable = false, length = 50)
    private String name;

    /**
     * 기존 스키마에 남아있는 nickname 컬럼과 매핑.
     * 실제 화면에서는 별도 닉네임을 받지 않으므로
     * 기본적으로 name 이나 loginId를 복사해서 저장합니다.
     */
    @Column(nullable = false, length = 50)
    private String nickname;

    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    @Builder
    public User(String loginId, String email, String passwordHash, String name) {
        this.loginId = loginId;
        this.email = email;
        this.passwordHash = passwordHash;
        this.legacyPassword = passwordHash;
        this.name = name;
        String baseNickname = (name != null && !name.isBlank()) ? name.trim() : loginId;
        this.nickname = baseNickname != null ? baseNickname : "user";
    }
}
