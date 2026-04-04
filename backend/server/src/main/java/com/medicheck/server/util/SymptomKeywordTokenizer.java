package com.medicheck.server.util;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * 증상 검색어를 공백·쉼표 등으로 나누어 토큰 목록으로 만듭니다.
 * HIRA Top5 질병명과의 부분 일치 검색에 사용합니다.
 */
public final class SymptomKeywordTokenizer {

    private SymptomKeywordTokenizer() {
    }

    /**
     * 2자 미만 토큰은 제외합니다. 구분자로만 나뉘어 비면 원문 전체(2자 이상)를 한 토큰으로 씁니다.
     */
    public static List<String> tokenize(String raw) {
        if (raw == null) {
            return List.of();
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            return List.of();
        }
        String[] parts = trimmed.split("[\\s,，、]+");
        Set<String> out = new LinkedHashSet<>();
        for (String p : parts) {
            String t = p.trim();
            if (t.length() >= 2) {
                out.add(t);
            }
        }
        if (out.isEmpty() && trimmed.length() >= 2) {
            out.add(trimmed);
        }
        return List.copyOf(out);
    }
}
