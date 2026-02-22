package com.medicheck.server.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * 길찾기 API 호출 제한 설정.
 * per-client: IP별 제한 (Caffeine 캐시 기반).
 * global: 서버 전역 안전장치 (Resilience4j).
 */
@Component
@ConfigurationProperties(prefix = "directions.rate-limit")
public class DirectionsRateLimitProperties {

    /** IP당 기간당 최대 호출 수 */
    private int perClientLimitForPeriod = 30;
    /** IP당 제한 갱신 주기 */
    private Duration perClientRefreshPeriod = Duration.ofMinutes(1);
    /** 전역 기간당 최대 호출 수 (모든 클라이언트 합산) */
    private int globalLimitForPeriod = 300;

    public int getPerClientLimitForPeriod() {
        return perClientLimitForPeriod;
    }

    public void setPerClientLimitForPeriod(int perClientLimitForPeriod) {
        this.perClientLimitForPeriod = perClientLimitForPeriod;
    }

    public Duration getPerClientRefreshPeriod() {
        return perClientRefreshPeriod;
    }

    public void setPerClientRefreshPeriod(Duration perClientRefreshPeriod) {
        this.perClientRefreshPeriod = perClientRefreshPeriod;
    }

    public int getGlobalLimitForPeriod() {
        return globalLimitForPeriod;
    }

    public void setGlobalLimitForPeriod(int globalLimitForPeriod) {
        this.globalLimitForPeriod = globalLimitForPeriod;
    }
}
