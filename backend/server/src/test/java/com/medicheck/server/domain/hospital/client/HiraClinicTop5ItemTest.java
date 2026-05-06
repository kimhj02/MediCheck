package com.medicheck.server.domain.hospital.client;

import com.medicheck.server.domain.hospital.client.dto.HiraClinicTop5Item;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class HiraClinicTop5ItemTest {

    @Test
    @DisplayName("getClinicTop5List1 XML에서 상위 5개 질병명이 정상 파싱된다")
    void fromXml_parsesTop5Diseases() {
        String xml = """
                <response>
                  <header>
                    <resultCode>00</resultCode>
                    <resultMsg>NORMAL SERVICE.</resultMsg>
                  </header>
                  <body>
                    <items>
                      <item>
                        <crtrYm>201610</crtrYm>
                        <mfrnIntrsIlnsNm1>감기</mfrnIntrsIlnsNm1>
                        <mfrnIntrsIlnsNm2>당뇨병</mfrnIntrsIlnsNm2>
                        <mfrnIntrsIlnsNm3>불면증</mfrnIntrsIlnsNm3>
                        <mfrnIntrsIlnsNm4>비염</mfrnIntrsIlnsNm4>
                        <mfrnIntrsIlnsNm5>장염</mfrnIntrsIlnsNm5>
                        <ykiho>YKIHO001</ykiho>
                      </item>
                    </items>
                  </body>
                </response>
                """;

        HiraClinicTop5Item item = HiraClinicTop5Item.fromXml(xml);
        assertThat(item).isNotNull();

        assertThat(item.getCrtrYm()).isEqualTo("201610");
        assertThat(item.getYkiho()).isEqualTo("YKIHO001");

        assertThat(item.getMfrnIntrsIlnsNm1()).isEqualTo("감기");
        assertThat(item.getMfrnIntrsIlnsNm2()).isEqualTo("당뇨병");
        assertThat(item.getMfrnIntrsIlnsNm3()).isEqualTo("불면증");
        assertThat(item.getMfrnIntrsIlnsNm4()).isEqualTo("비염");
        assertThat(item.getMfrnIntrsIlnsNm5()).isEqualTo("장염");
    }
}

