package com.medicheck.server;

import com.medicheck.server.global.config.HiraApiProperties;
import com.medicheck.server.global.config.HiraDiagApiProperties;
import com.medicheck.server.global.config.HiraEvalApiProperties;
import com.medicheck.server.global.config.JwtProperties;
import com.medicheck.server.global.config.KakaoMobilityProperties;
import com.medicheck.server.global.config.KakaoOAuthProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({ HiraApiProperties.class, HiraEvalApiProperties.class, HiraDiagApiProperties.class, KakaoMobilityProperties.class, KakaoOAuthProperties.class, JwtProperties.class })
public class ServerApplication {
	public static void main(String[] args) {
		SpringApplication.run(ServerApplication.class, args);
	}
}