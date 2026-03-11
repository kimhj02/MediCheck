package com.medicheck.server.client.hira;

/**
 * HIRA Open API 호출 실패를 나타내는 런타임 예외.
 * 인증키 누락, 비정상 응답 코드, 네트워크 오류 등을 모두 이 예외로 래핑합니다.
 */
public class HiraApiException extends RuntimeException {

    public HiraApiException(String message) {
        super(message);
    }

    public HiraApiException(String message, Throwable cause) {
        super(message, cause);
    }
}

