package com.medicheck.server;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 공공데이터 병원진료정보조회서비스 getClinicTop5List1 샘플 코드 테스트.
 * 실환경 HIRA Open API를 호출하는 탐색용 통합 테스트로, CI에서는 실행하지 않습니다.
 */
class ApiExplorerTest {

    @Test
    @Disabled("실제 HIRA Open API를 호출하는 탐색용 통합 테스트이므로 기본 CI에서는 실행하지 않습니다.")
    @Timeout(15)
    void getClinicTop5List1() throws IOException {
        String serviceKey = "877b01235fb491f2c388d2d63a42888299c1537f21a8d518fbe80c551141ff24";
        String ykiho = "JDQ4MTg4MSM1MSMkMiMkOCMkMDAkMzgxOTYxIzUxIyQxIyQxIyQxMyQzNjE4MzIjNzEjJDEjJDgjJDgz";

        StringBuilder urlBuilder = new StringBuilder("https://apis.data.go.kr/B551182/hospDiagInfoService1/getClinicTop5List1");
        urlBuilder.append("?").append(URLEncoder.encode("ServiceKey", StandardCharsets.UTF_8)).append("=").append(URLEncoder.encode(serviceKey, StandardCharsets.UTF_8));
        urlBuilder.append("&").append(URLEncoder.encode("numOfRows", StandardCharsets.UTF_8)).append("=").append(URLEncoder.encode("1", StandardCharsets.UTF_8));
        urlBuilder.append("&").append(URLEncoder.encode("pageNo", StandardCharsets.UTF_8)).append("=").append(URLEncoder.encode("1", StandardCharsets.UTF_8));
        urlBuilder.append("&").append(URLEncoder.encode("ykiho", StandardCharsets.UTF_8)).append("=").append(URLEncoder.encode(ykiho, StandardCharsets.UTF_8));

        URL url = new URL(urlBuilder.toString());
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("Content-type", "application/json");
        int responseCode = conn.getResponseCode();
        System.out.println("Response code: " + responseCode);

        BufferedReader rd;
        if (responseCode >= 200 && responseCode <= 300) {
            rd = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
        } else {
            rd = new BufferedReader(new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8));
        }
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = rd.readLine()) != null) {
            sb.append(line);
        }
        rd.close();
        conn.disconnect();
        System.out.println(sb);

        // 최소한의 검증: 응답 코드가 2xx/3xx 범위인지 확인
        assertTrue(responseCode >= 200 && responseCode < 400, "HIRA API 응답 코드가 비정상입니다: " + responseCode);
    }
}
