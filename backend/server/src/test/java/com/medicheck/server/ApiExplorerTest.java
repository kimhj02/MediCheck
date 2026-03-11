package com.medicheck.server;

import org.junit.jupiter.api.Test;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * 공공데이터 병원진료정보조회서비스 getClinicTop5List1 샘플 코드 테스트.
 * Java 1.8 샘플 코드 기반.
 */
class ApiExplorerTest {

    @Test
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
    }
}
