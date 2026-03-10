package com.medicheck.server.dto;

import com.medicheck.server.domain.entity.HospitalEvaluation;
import lombok.Builder;
import lombok.Getter;

/**
 * 병원 상세에서 노출할 병원평가정보 요약 DTO.
 * (필요 시 프런트에서 중요 지표만 선택적으로 사용)
 */
@Getter
@Builder
public class HospitalEvaluationSummary {

    private String ykiho;
    private String yadmNm;
    private String clCd;
    private String clCdNm;
    private String addr;

    private String asmGrd01;
    private String asmGrd03;
    private String asmGrd04;
    private String asmGrd05;
    private String asmGrd06;
    private String asmGrd07;
    private String asmGrd08;
    private String asmGrd09;
    private String asmGrd10;
    private String asmGrd12;
    private String asmGrd13;
    private String asmGrd14;
    private String asmGrd15;
    private String asmGrd16;
    private String asmGrd17;
    private String asmGrd18;
    private String asmGrd19;
    private String asmGrd20;
    private String asmGrd21;
    private String asmGrd22;
    private String asmGrd23;
    private String asmGrd24;

    public static HospitalEvaluationSummary from(HospitalEvaluation ev) {
        if (ev == null) return null;
        return HospitalEvaluationSummary.builder()
                .ykiho(ev.getYkiho())
                .yadmNm(ev.getYadmNm())
                .clCd(ev.getClCd())
                .clCdNm(ev.getClCdNm())
                .addr(ev.getAddr())
                .asmGrd01(ev.getAsmGrd01())
                .asmGrd03(ev.getAsmGrd03())
                .asmGrd04(ev.getAsmGrd04())
                .asmGrd05(ev.getAsmGrd05())
                .asmGrd06(ev.getAsmGrd06())
                .asmGrd07(ev.getAsmGrd07())
                .asmGrd08(ev.getAsmGrd08())
                .asmGrd09(ev.getAsmGrd09())
                .asmGrd10(ev.getAsmGrd10())
                .asmGrd12(ev.getAsmGrd12())
                .asmGrd13(ev.getAsmGrd13())
                .asmGrd14(ev.getAsmGrd14())
                .asmGrd15(ev.getAsmGrd15())
                .asmGrd16(ev.getAsmGrd16())
                .asmGrd17(ev.getAsmGrd17())
                .asmGrd18(ev.getAsmGrd18())
                .asmGrd19(ev.getAsmGrd19())
                .asmGrd20(ev.getAsmGrd20())
                .asmGrd21(ev.getAsmGrd21())
                .asmGrd22(ev.getAsmGrd22())
                .asmGrd23(ev.getAsmGrd23())
                .asmGrd24(ev.getAsmGrd24())
                .build();
    }
}

