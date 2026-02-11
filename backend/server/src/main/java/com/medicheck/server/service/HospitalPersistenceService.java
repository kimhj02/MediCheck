package com.medicheck.server.service;

import com.medicheck.server.client.hira.dto.HiraHospItem;
import com.medicheck.server.domain.entity.Hospital;
import com.medicheck.server.domain.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * HIRA 응답을 Hospital 엔티티로 저장하는 영속성 전담 서비스.
 * 트랜잭션 경계를 이 레이어에 두어, 대량 동기화에서도 페이지/지역 단위로 커밋되도록 한다.
 */
@Service
@RequiredArgsConstructor
public class HospitalPersistenceService {

    private final HospitalRepository hospitalRepository;

    /**
     * HIRA 응답 item 리스트 중 아직 DB에 없는 병원만 골라 저장하고, 저장된 건수를 반환합니다.
     * 한 번 호출이 하나의 트랜잭션으로 처리됩니다.
     */
    @Transactional
    public int saveNewHospitals(List<HiraHospItem> items) {
        if (items == null || items.isEmpty()) {
            return 0;
        }

        List<String> ykihoList = items.stream()
                .map(HiraHospItem::getYkiho)
                .filter(y -> y != null && !y.isBlank())
                .toList();

        Set<String> existingCodes = ykihoList.isEmpty()
                ? Set.of()
                : hospitalRepository.findAllByPublicCodeIn(ykihoList).stream()
                        .map(Hospital::getPublicCode)
                        .collect(Collectors.toSet());

        List<Hospital> toSave = items.stream()
                .filter(item -> {
                    String ykiho = item.getYkiho();
                    if (ykiho == null || ykiho.isBlank()) return false;
                    if (existingCodes.contains(trim(ykiho, 500))) return false;
                    String name = trim(item.getYadmNm(), 200);
                    return name != null && !name.isBlank();
                })
                .map(this::toHospital)
                .toList();

        hospitalRepository.saveAll(toSave);
        return toSave.size();
    }

    private Hospital toHospital(HiraHospItem item) {
        return Hospital.builder()
                .name(trim(item.getYadmNm(), 200))
                .address(trim(item.getAddr(), 500))
                .latitude(parseBigDecimal(toPosString(item.getYPos())))
                .longitude(parseBigDecimal(toPosString(item.getXPos())))
                .phone(trim(item.getTelno(), 20))
                .publicCode(trim(item.getYkiho(), 500))
                .department(trim(item.getClCdNm(), 100))
                .build();
    }

    /** API가 XPos/YPos를 숫자 또는 문자열로 줄 수 있어 안전하게 문자열로 변환 */
    private static String toPosString(Object value) {
        if (value == null) return null;
        return value.toString().trim();
    }

    private static String trim(String value, int maxLen) {
        if (value == null) return null;
        String s = value.trim();
        return s.length() > maxLen ? s.substring(0, maxLen) : s;
    }

    private static BigDecimal parseBigDecimal(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return new BigDecimal(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}

