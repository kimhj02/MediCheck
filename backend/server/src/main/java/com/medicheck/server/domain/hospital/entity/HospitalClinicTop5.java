package com.medicheck.server.domain.hospital.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * HIRA 병원진료정보조회서비스(getClinicTop5List1) 결과 저장.
 * 요양기호(ykiho) 기준으로 병원에서 진료량 상위 5개 질병명을 저장한다.
 */
@Entity
@Table(name = "hospital_clinic_top5")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HospitalClinicTop5 {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 병원당 Top5 레코드 1건만 유지하기 위해 unique 제약을 둔 연관관계입니다.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false, unique = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Hospital hospital;

    /** 암호화된 요양기호 (API 응답 기준) */
    @Column(name = "ykiho", length = 500)
    private String ykiho;

    /** 기준년월 (예: 201610) */
    @Column(name = "crtr_ym", length = 10)
    private String crtrYm;

    @Column(name = "disease_nm_1", length = 100)
    private String diseaseNm1;
    @Column(name = "disease_nm_2", length = 100)
    private String diseaseNm2;
    @Column(name = "disease_nm_3", length = 100)
    private String diseaseNm3;
    @Column(name = "disease_nm_4", length = 100)
    private String diseaseNm4;
    @Column(name = "disease_nm_5", length = 100)
    private String diseaseNm5;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public HospitalClinicTop5(
            Hospital hospital,
            String ykiho,
            String crtrYm,
            String diseaseNm1,
            String diseaseNm2,
            String diseaseNm3,
            String diseaseNm4,
            String diseaseNm5
    ) {
        this.hospital = hospital;
        this.ykiho = ykiho;
        this.crtrYm = crtrYm;
        this.diseaseNm1 = diseaseNm1;
        this.diseaseNm2 = diseaseNm2;
        this.diseaseNm3 = diseaseNm3;
        this.diseaseNm4 = diseaseNm4;
        this.diseaseNm5 = diseaseNm5;
    }

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void updateFromApi(HospitalClinicTop5 newData) {
        if (newData == null) return;
        if (newData.ykiho != null) this.ykiho = newData.ykiho;
        if (newData.crtrYm != null) this.crtrYm = newData.crtrYm;
        if (newData.diseaseNm1 != null) this.diseaseNm1 = newData.diseaseNm1;
        if (newData.diseaseNm2 != null) this.diseaseNm2 = newData.diseaseNm2;
        if (newData.diseaseNm3 != null) this.diseaseNm3 = newData.diseaseNm3;
        if (newData.diseaseNm4 != null) this.diseaseNm4 = newData.diseaseNm4;
        if (newData.diseaseNm5 != null) this.diseaseNm5 = newData.diseaseNm5;
    }
}

