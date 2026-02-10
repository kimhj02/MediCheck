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
 * 공공데이터포털 응답의 items: 배열 또는 items: { item: [...] } 형태 모두 처리.
 */
public class ItemsFlexibleDeserializer extends JsonDeserializer<List<HiraHospItem>> {

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
            return list;
        }

        if (node.isObject() && node.has("item")) {
            JsonNode itemNode = node.get("item");
            if (itemNode.isArray()) {
                for (JsonNode elem : itemNode) {
                    list.add(MAPPER.treeToValue(elem, HiraHospItem.class));
                }
            } else {
                list.add(MAPPER.treeToValue(itemNode, HiraHospItem.class));
            }
        }

        return list;
    }
}
