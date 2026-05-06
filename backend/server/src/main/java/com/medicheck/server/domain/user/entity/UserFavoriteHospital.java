package com.medicheck.server.domain.user.entity;

import com.medicheck.server.domain.hospital.entity.Hospital;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

/**
 * 사용자별 즐겨찾기 병원.
 */
@Entity
@Table(
        name = "user_favorite_hospitals",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "hospital_id"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserFavoriteHospital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public UserFavoriteHospital(User user, Hospital hospital) {
        this.user = user;
        this.hospital = hospital;
        this.createdAt = LocalDateTime.now();
    }
}