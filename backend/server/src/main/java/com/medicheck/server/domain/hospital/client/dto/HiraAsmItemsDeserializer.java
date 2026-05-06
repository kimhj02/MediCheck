package com.medicheck.server.domain.hospital.client.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/** getHospAsmInfo1 응답의 items: 배열 또는 { item: 단일/배열 } 형태 처리. */
public class HiraAsmItemsDeserializer extends JsonDeserializer<List<HiraAsmItem>> {

    @Override
    public List<HiraAsmItem> deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        var codec = p.getCodec();
        JsonNode node = codec.readTree(p);
        if (node == null || node.isNull()) return List.of();

        List<HiraAsmItem> list = new ArrayList<>();
        if (node.isArray()) {
            for (JsonNode elem : node) {
                list.add(codec.treeToValue(elem, HiraAsmItem.class));
            }
            return list;
        }
        if (node.isObject() && node.has("item")) {
            JsonNode itemNode = node.get("item");
            if (itemNode.isArray()) {
                for (JsonNode elem : itemNode) {
                    list.add(codec.treeToValue(elem, HiraAsmItem.class));
                }
            } else {
                list.add(codec.treeToValue(itemNode, HiraAsmItem.class));
            }
        }
        return list;
    }
}
