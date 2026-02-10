package com.medicheck.server.client.hira.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * 공공데이터포털 API 응답에서 item 이 단일 객체 또는 배열인 경우 모두 List로 역직렬화.
 */
public class SingleOrArrayDeserializer extends JsonDeserializer<List<HiraHospItem>> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public List<HiraHospItem> deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        JsonNode node = p.getCodec().readTree(p);
        if (node == null || node.isNull()) return List.of();
        List<HiraHospItem> list = new ArrayList<>();
        if (node.isArray()) {
            for (JsonNode elem : node) {
                list.add(MAPPER.treeToValue(elem, HiraHospItem.class));
            }
        } else {
            list.add(MAPPER.treeToValue(node, HiraHospItem.class));
        }
        return list;
    }
}
