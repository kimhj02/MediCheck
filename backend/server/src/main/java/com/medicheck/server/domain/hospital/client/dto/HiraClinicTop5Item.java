package com.medicheck.server.domain.hospital.client.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * HIRA 병원진료정보조회서비스(getClinicTop5List1) 응답의 1개 item을 파싱한 결과.
 * XML/JSON 응답 모두를 허용하고, 진료량 상위 5위 질병명만 핵심으로 저장한다.
 */
@Getter
@Builder
public class HiraClinicTop5Item {

    private final String crtrYm;
    private final String ykiho;

    private final String mfrnIntrsIlnsNm1;
    private final String mfrnIntrsIlnsNm2;
    private final String mfrnIntrsIlnsNm3;
    private final String mfrnIntrsIlnsNm4;
    private final String mfrnIntrsIlnsNm5;

    public static HiraClinicTop5Item fromXml(String xml) {
        if (xml == null || xml.isBlank()) return null;
        String trimmed = xml.trim();
        if (trimmed.startsWith("{")) {
            return fromJson(trimmed);
        }

        String resultCode = extractTag(xml, "resultCode");
        // resultCode가 없으면 문서/인증 실패일 수 있으나, 우선 태그 파싱을 시도한다.
        if (resultCode != null && !resultCode.trim().equals("00")) {
            return null;
        }

        String crtrYm = extractTag(xml, "crtrYm");
        String ykiho = extractTag(xml, "ykiho");

        // OpenAPI 응답 스펙이 Nm 계열/CodeName(CdNm) 계열로 달라질 수 있어 둘 다 허용.
        String nm1 = firstNonBlank(
                extractTag(xml, "mfrnIntrsIlnsNm1"),
                extractTag(xml, "mfrnIntrsIlnsCdNm1")
        );
        String nm2 = firstNonBlank(
                extractTag(xml, "mfrnIntrsIlnsNm2"),
                extractTag(xml, "mfrnIntrsIlnsCdNm2")
        );
        String nm3 = firstNonBlank(
                extractTag(xml, "mfrnIntrsIlnsNm3"),
                extractTag(xml, "mfrnIntrsIlnsCdNm3")
        );
        String nm4 = firstNonBlank(
                extractTag(xml, "mfrnIntrsIlnsNm4"),
                extractTag(xml, "mfrnIntrsIlnsCdNm4")
        );
        String nm5 = firstNonBlank(
                extractTag(xml, "mfrnIntrsIlnsNm5"),
                extractTag(xml, "mfrnIntrsIlnsCdNm5")
        );

        // 문서상 5개가 항상 내려오지만, 안전하게 1개라도 있으면 생성한다.
        if (isAllBlank(nm1, nm2, nm3, nm4, nm5)) return null;

        return HiraClinicTop5Item.builder()
                .crtrYm(trimToNull(crtrYm))
                .ykiho(trimToNull(ykiho))
                .mfrnIntrsIlnsNm1(trimToNull(nm1))
                .mfrnIntrsIlnsNm2(trimToNull(nm2))
                .mfrnIntrsIlnsNm3(trimToNull(nm3))
                .mfrnIntrsIlnsNm4(trimToNull(nm4))
                .mfrnIntrsIlnsNm5(trimToNull(nm5))
                .build();
    }

    private static HiraClinicTop5Item fromJson(String json) {
        String resultCode = extractJsonString(json, "resultCode");
        if (resultCode != null && !resultCode.trim().equals("00")) {
            return null;
        }

        String crtrYm = extractJsonString(json, "crtrYm");
        if (crtrYm == null) {
            crtrYm = extractJsonNumberAsString(json, "crtrYm");
        }
        String ykiho = extractJsonString(json, "ykiho");

        String nm1 = firstNonBlank(
                extractJsonString(json, "mfrnIntrsIlnsNm1"),
                extractJsonString(json, "mfrnIntrsIlnsCdNm1")
        );
        String nm2 = firstNonBlank(
                extractJsonString(json, "mfrnIntrsIlnsNm2"),
                extractJsonString(json, "mfrnIntrsIlnsCdNm2")
        );
        String nm3 = firstNonBlank(
                extractJsonString(json, "mfrnIntrsIlnsNm3"),
                extractJsonString(json, "mfrnIntrsIlnsCdNm3")
        );
        String nm4 = firstNonBlank(
                extractJsonString(json, "mfrnIntrsIlnsNm4"),
                extractJsonString(json, "mfrnIntrsIlnsCdNm4")
        );
        String nm5 = firstNonBlank(
                extractJsonString(json, "mfrnIntrsIlnsNm5"),
                extractJsonString(json, "mfrnIntrsIlnsCdNm5")
        );

        if (isAllBlank(nm1, nm2, nm3, nm4, nm5)) return null;

        return HiraClinicTop5Item.builder()
                .crtrYm(trimToNull(crtrYm))
                .ykiho(trimToNull(ykiho))
                .mfrnIntrsIlnsNm1(trimToNull(nm1))
                .mfrnIntrsIlnsNm2(trimToNull(nm2))
                .mfrnIntrsIlnsNm3(trimToNull(nm3))
                .mfrnIntrsIlnsNm4(trimToNull(nm4))
                .mfrnIntrsIlnsNm5(trimToNull(nm5))
                .build();
    }

    private static boolean isAllBlank(String... values) {
        if (values == null) return true;
        for (String v : values) {
            if (v != null && !v.trim().isEmpty()) return false;
        }
        return true;
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static String firstNonBlank(String... values) {
        if (values == null) return null;
        for (String v : values) {
            if (v != null && !v.trim().isEmpty()) return v;
        }
        return null;
    }

    private static String extractTag(String xml, String tagName) {
        // 예: <mfrnIntrsIlnsNm1>감기</mfrnIntrsIlnsNm1>
        Pattern p = Pattern.compile(
                "<" + Pattern.quote(tagName) + ">\\s*(.*?)\\s*</" + Pattern.quote(tagName) + ">",
                Pattern.DOTALL
        );
        Matcher m = p.matcher(xml);
        if (!m.find()) return null;
        return m.group(1);
    }

    private static String extractJsonString(String json, String key) {
        Pattern p = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*\"(.*?)\"", Pattern.DOTALL);
        Matcher m = p.matcher(json);
        if (!m.find()) return null;
        return m.group(1);
    }

    private static String extractJsonNumberAsString(String json, String key) {
        Pattern p = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*([0-9]+)");
        Matcher m = p.matcher(json);
        if (!m.find()) return null;
        return m.group(1);
    }
}

