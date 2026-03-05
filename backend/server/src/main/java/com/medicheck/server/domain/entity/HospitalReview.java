package com.medicheck.server.domain.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 사용자별 병원 평가 (한 사용자당 병원 하나에 대한 평가 1건, 수정 가능).
 */
@Entity
@Table(
        name = "hospital_reviews",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "hospital_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HospitalReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    /** 별점 1~5 */
    @Column(nullable = false)
    private Integer rating;

    /** 한 줄 코멘트 (선택) */
    @Column(length = 500)
    private String comment;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public HospitalReview(User user, Hospital hospital, int rating, String comment) {
        this.user = user;
        this.hospital = hospital;
        this.rating = Math.min(5, Math.max(1, rating));
        this.comment = comment != null && comment.length() > 500 ? comment.substring(0, 500) : comment;
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void update(int rating, String comment) {
        this.rating = Math.min(5, Math.max(1, rating));
        this.comment = comment != null && comment.length() > 500 ? comment.substring(0, 500) : comment;
        this.updatedAt = LocalDateTime.now();
    }
}
