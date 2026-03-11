package com.medicheck.server.client.hira.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * HIRA 병원평가정보서비스 getHospAsmInfo1 응답의 한 건(평가등급) DTO.
 */
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class HiraAsmItem {

    @JsonProperty("ykiho")
    private String ykiho;
    @JsonProperty("yadmNm")
    private String yadmNm;
    @JsonProperty("clCd")
    private String clCd;
    @JsonProperty("clCdNm")
    private String clCdNm;
    @JsonProperty("addr")
    private String addr;

    @JsonProperty("asmGrd01")
    private String asmGrd01;
    @JsonProperty("asmGrd03")
    private String asmGrd03;
    @JsonProperty("asmGrd04")
    private String asmGrd04;
    @JsonProperty("asmGrd05")
    private String asmGrd05;
    @JsonProperty("asmGrd06")
    private String asmGrd06;
    @JsonProperty("asmGrd07")
    private String asmGrd07;
    @JsonProperty("asmGrd08")
    private String asmGrd08;
    @JsonProperty("asmGrd09")
    private String asmGrd09;
    @JsonProperty("asmGrd10")
    private String asmGrd10;
    @JsonProperty("asmGrd12")
    private String asmGrd12;
    @JsonProperty("asmGrd13")
    private String asmGrd13;
    @JsonProperty("asmGrd14")
    private String asmGrd14;
    @JsonProperty("asmGrd15")
    private String asmGrd15;
    @JsonProperty("asmGrd16")
    private String asmGrd16;
    @JsonProperty("asmGrd17")
    private String asmGrd17;
    @JsonProperty("asmGrd18")
    private String asmGrd18;
    @JsonProperty("asmGrd19")
    private String asmGrd19;
    @JsonProperty("asmGrd20")
    private String asmGrd20;
    @JsonProperty("asmGrd21")
    private String asmGrd21;
    @JsonProperty("asmGrd22")
    private String asmGrd22;
    @JsonProperty("asmGrd23")
    private String asmGrd23;
    @JsonProperty("asmGrd24")
    private String asmGrd24;
}
