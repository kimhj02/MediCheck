package com.medicheck.server.domain.entity;

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
 * 병원평가정보서비스(getHospAsmInfo1) 결과 저장.
 * 평가항목별 등급(1~5등급, 등급제외 등) — Hibernate ddl-auto로 테이블 생성/갱신.
 */
@Entity
@Table(name = "hospital_evaluations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HospitalEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false, unique = true)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Hospital hospital;

    /** 암호화된 요양기호 (API 응답 기준) */
    @Column(name = "ykiho", length = 500)
    private String ykiho;

    /** 요양기관명 (API 응답) */
    @Column(name = "yadm_nm", length = 200)
    private String yadmNm;

    /** 종별코드 */
    @Column(name = "cl_cd", length = 10)
    private String clCd;

    /** 종별코드명 */
    @Column(name = "cl_cd_nm", length = 50)
    private String clCdNm;

    /** 주소 */
    @Column(name = "addr", length = 500)
    private String addr;

    @Column(name = "asm_grd_01", length = 20)
    private String asmGrd01;
    @Column(name = "asm_grd_03", length = 20)
    private String asmGrd03;
    @Column(name = "asm_grd_04", length = 20)
    private String asmGrd04;
    @Column(name = "asm_grd_05", length = 20)
    private String asmGrd05;
    @Column(name = "asm_grd_06", length = 20)
    private String asmGrd06;
    @Column(name = "asm_grd_07", length = 20)
    private String asmGrd07;
    @Column(name = "asm_grd_08", length = 20)
    private String asmGrd08;
    @Column(name = "asm_grd_09", length = 20)
    private String asmGrd09;
    @Column(name = "asm_grd_10", length = 20)
    private String asmGrd10;
    @Column(name = "asm_grd_12", length = 20)
    private String asmGrd12;
    @Column(name = "asm_grd_13", length = 20)
    private String asmGrd13;
    @Column(name = "asm_grd_14", length = 20)
    private String asmGrd14;
    @Column(name = "asm_grd_15", length = 20)
    private String asmGrd15;
    @Column(name = "asm_grd_16", length = 20)
    private String asmGrd16;
    @Column(name = "asm_grd_17", length = 20)
    private String asmGrd17;
    @Column(name = "asm_grd_18", length = 20)
    private String asmGrd18;
    @Column(name = "asm_grd_19", length = 20)
    private String asmGrd19;
    @Column(name = "asm_grd_20", length = 20)
    private String asmGrd20;
    @Column(name = "asm_grd_21", length = 20)
    private String asmGrd21;
    @Column(name = "asm_grd_22", length = 20)
    private String asmGrd22;
    @Column(name = "asm_grd_23", length = 20)
    private String asmGrd23;
    @Column(name = "asm_grd_24", length = 20)
    private String asmGrd24;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public HospitalEvaluation(
            Hospital hospital,
            String ykiho,
            String yadmNm,
            String clCd,
            String clCdNm,
            String addr,
            String asmGrd01, String asmGrd03, String asmGrd04, String asmGrd05, String asmGrd06,
            String asmGrd07, String asmGrd08, String asmGrd09, String asmGrd10, String asmGrd12,
            String asmGrd13, String asmGrd14, String asmGrd15, String asmGrd16, String asmGrd17,
            String asmGrd18, String asmGrd19, String asmGrd20, String asmGrd21, String asmGrd22,
            String asmGrd23, String asmGrd24
    ) {
        this.hospital = hospital;
        this.ykiho = ykiho;
        this.yadmNm = yadmNm;
        this.clCd = clCd;
        this.clCdNm = clCdNm;
        this.addr = addr;
        this.asmGrd01 = asmGrd01;
        this.asmGrd03 = asmGrd03;
        this.asmGrd04 = asmGrd04;
        this.asmGrd05 = asmGrd05;
        this.asmGrd06 = asmGrd06;
        this.asmGrd07 = asmGrd07;
        this.asmGrd08 = asmGrd08;
        this.asmGrd09 = asmGrd09;
        this.asmGrd10 = asmGrd10;
        this.asmGrd12 = asmGrd12;
        this.asmGrd13 = asmGrd13;
        this.asmGrd14 = asmGrd14;
        this.asmGrd15 = asmGrd15;
        this.asmGrd16 = asmGrd16;
        this.asmGrd17 = asmGrd17;
        this.asmGrd18 = asmGrd18;
        this.asmGrd19 = asmGrd19;
        this.asmGrd20 = asmGrd20;
        this.asmGrd21 = asmGrd21;
        this.asmGrd22 = asmGrd22;
        this.asmGrd23 = asmGrd23;
        this.asmGrd24 = asmGrd24;
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

    /** API 응답으로 기존 엔티티 갱신 (hospital 참조는 유지) */
    public void updateFromApi(
            String yadmNm,
            String clCd,
            String clCdNm,
            String addr,
            String asmGrd01, String asmGrd03, String asmGrd04, String asmGrd05, String asmGrd06,
            String asmGrd07, String asmGrd08, String asmGrd09, String asmGrd10, String asmGrd12,
            String asmGrd13, String asmGrd14, String asmGrd15, String asmGrd16, String asmGrd17,
            String asmGrd18, String asmGrd19, String asmGrd20, String asmGrd21, String asmGrd22,
            String asmGrd23, String asmGrd24
    ) {
        if (yadmNm != null) this.yadmNm = yadmNm;
        if (clCd != null) this.clCd = clCd;
        if (clCdNm != null) this.clCdNm = clCdNm;
        if (addr != null) this.addr = addr;
        if (asmGrd01 != null) this.asmGrd01 = asmGrd01;
        if (asmGrd03 != null) this.asmGrd03 = asmGrd03;
        if (asmGrd04 != null) this.asmGrd04 = asmGrd04;
        if (asmGrd05 != null) this.asmGrd05 = asmGrd05;
        if (asmGrd06 != null) this.asmGrd06 = asmGrd06;
        if (asmGrd07 != null) this.asmGrd07 = asmGrd07;
        if (asmGrd08 != null) this.asmGrd08 = asmGrd08;
        if (asmGrd09 != null) this.asmGrd09 = asmGrd09;
        if (asmGrd10 != null) this.asmGrd10 = asmGrd10;
        if (asmGrd12 != null) this.asmGrd12 = asmGrd12;
        if (asmGrd13 != null) this.asmGrd13 = asmGrd13;
        if (asmGrd14 != null) this.asmGrd14 = asmGrd14;
        if (asmGrd15 != null) this.asmGrd15 = asmGrd15;
        if (asmGrd16 != null) this.asmGrd16 = asmGrd16;
        if (asmGrd17 != null) this.asmGrd17 = asmGrd17;
        if (asmGrd18 != null) this.asmGrd18 = asmGrd18;
        if (asmGrd19 != null) this.asmGrd19 = asmGrd19;
        if (asmGrd20 != null) this.asmGrd20 = asmGrd20;
        if (asmGrd21 != null) this.asmGrd21 = asmGrd21;
        if (asmGrd22 != null) this.asmGrd22 = asmGrd22;
        if (asmGrd23 != null) this.asmGrd23 = asmGrd23;
        if (asmGrd24 != null) this.asmGrd24 = asmGrd24;
    }
}
