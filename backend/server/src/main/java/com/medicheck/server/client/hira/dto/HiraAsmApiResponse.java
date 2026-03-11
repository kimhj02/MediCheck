package com.medicheck.server.client.hira.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * HIRA 병원평가정보서비스 getHospAsmInfo1 JSON 응답 루트.
 */
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class HiraAsmApiResponse {

    @JsonProperty("response")
    private Response response;

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Response {
        @JsonProperty("header")
        private Header header;
        @JsonProperty("body")
        private Body body;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Header {
        @JsonProperty("resultCode")
        private String resultCode;
        @JsonProperty("resultMsg")
        private String resultMsg;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Body {
        @JsonProperty("numOfRows")
        private Integer numOfRows;
        @JsonProperty("pageNo")
        private Integer pageNo;
        @JsonProperty("totalCount")
        private Integer totalCount;
        @JsonProperty("items")
        @JsonDeserialize(using = HiraAsmItemsDeserializer.class)
        private List<HiraAsmItem> items;
    }

    public List<HiraAsmItem> getItemList() {
        if (response == null || response.getBody() == null) {
            return List.of();
        }
        List<HiraAsmItem> items = response.getBody().getItems();
        return items != null ? items : List.of();
    }
}
