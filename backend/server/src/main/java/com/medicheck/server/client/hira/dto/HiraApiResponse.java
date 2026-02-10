package com.medicheck.server.client.hira.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * HIRA 병원정보서비스 API JSON 응답 루트.
 * response.body.items 는 배열 또는 { item: [...] } 형태 모두 지원.
 */
@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class HiraApiResponse {

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
        @JsonProperty("totalCount")
        private Integer totalCount;
        @JsonProperty("pageNo")
        private Integer pageNo;
        @JsonProperty("numOfRows")
        private Integer numOfRows;
        @JsonProperty("items")
        @JsonDeserialize(using = ItemsFlexibleDeserializer.class)
        private List<HiraHospItem> items;
    }

    /** body.items 를 리스트로 반환 (배열 / items.item 형태 모두 처리됨) */
    public List<HiraHospItem> getItemList() {
        if (response == null || response.getBody() == null) {
            return List.of();
        }
        List<HiraHospItem> items = response.getBody().getItems();
        return items != null ? items : List.of();
    }
}
