package com.medicheck.server;

import com.medicheck.server.config.HiraApiProperties;
import com.medicheck.server.config.KakaoMobilityProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({ HiraApiProperties.class, KakaoMobilityProperties.class })
public class ServerApplication {

	public static void main(String[] args) {
		SpringApplication.run(ServerApplication.class, args);
	}

}
