package com.medicheck.server.service;

/**
 * 근처 병원 조회 시 메타데이터를 전달하기 위한 ThreadLocal 컨텍스트.
 * 컨트롤러에서 응답 헤더를 세팅할 때 사용합니다.
 */
public final class NearbyQueryContextHolder {

    private static final ThreadLocal<NearbyQueryMetadata> CONTEXT = new ThreadLocal<>();

    private NearbyQueryContextHolder() {
    }

    public static void setMetadata(NearbyQueryMetadata metadata) {
        CONTEXT.set(metadata);
    }

    public static NearbyQueryMetadata getMetadata() {
        return CONTEXT.get();
    }

    public static void clear() {
        CONTEXT.remove();
    }
}

