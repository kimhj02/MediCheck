package com.medicheck.server.service;

import com.medicheck.server.client.hira.HiraClinicTop5Client;
import com.medicheck.server.client.hira.dto.HiraClinicTop5Item;
import com.medicheck.server.domain.entity.Hospital;
import com.medicheck.server.domain.entity.HospitalClinicTop5;
import com.medicheck.server.domain.repository.HospitalClinicTop5Repository;
import com.medicheck.server.domain.repository.HospitalRepository;
import com.medicheck.server.domain.repository.HospitalSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * HIRA 병원진료정보조회서비스(getClinicTop5List1) 결과를 DB에 동기화합니다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HospitalTop5SyncService {

    private static final int DEFAULT_PAGE_NO = 1;
    private static final int DEFAULT_NUM_OF_ROWS = 10;

    private final HiraClinicTop5Client clinicTop5Client;
    private final HospitalRepository hospitalRepository;
    private final HospitalClinicTop5Repository top5Repository;

    /**
     * 주소(address) 포함 키워드(예: 구미)가 들어간 병원만 Top5를 1건씩 동기화한다.
     */
    @Transactional
    public int syncByAddressKeyword(String addressKeyword, Integer maxSynced) {
        if (addressKeyword == null || addressKeyword.isBlank()) return 0;

        Specification<Hospital> spec = HospitalSpecification.addressContains(addressKeyword);
        List<Hospital> hospitals;
        if (maxSynced != null && maxSynced > 0) {
            // maxSynced가 지정되면 성공 건수 기준이 아니라 후보 조회 수 자체를 제한해 요청 시간을 예측 가능하게 만든다.
            hospitals = hospitalRepository.findAll(spec, PageRequest.of(0, maxSynced)).getContent();
        } else {
            hospitals = hospitalRepository.findAll(spec);
        }

        int count = 0;
        for (Hospital h : hospitals) {
            String ykiho = trim(h.getPublicCode(), 500);
            if (ykiho == null || ykiho.isBlank()) continue;
            if (syncOneInternal(ykiho)) {
                count++;
            }
        }

        log.info("병원진료정보 Top5 지역 동기화 완료: addressKeyword={}, synced={}", addressKeyword, count);
        return count;
    }

    /**
     * 특정 병원(요양기호)의 Top5 1건을 동기화한다.
     *
     * @return 저장/갱신 성공 여부
     */
    @Transactional
    public boolean syncOne(String ykiho) {
        if (ykiho == null || ykiho.isBlank()) return false;
        return syncOneInternal(ykiho);
    }

    private boolean syncOneInternal(String ykiho) {
        String normalized = trim(ykiho, 500);
        if (normalized == null || normalized.isBlank()) return false;

        Optional<Hospital> hospitalOpt = hospitalRepository.findByPublicCode(normalized);
        if (hospitalOpt.isEmpty()) return false;
        Hospital hospital = hospitalOpt.get();

        HiraClinicTop5Item item = clinicTop5Client.getClinicTop5List1(
                normalized, DEFAULT_PAGE_NO, DEFAULT_NUM_OF_ROWS
        );
        if (item == null) return false;

        HospitalClinicTop5 newData = HospitalClinicTop5.builder()
                .hospital(hospital)
                .ykiho(trim(item.getYkiho(), 500))
                .crtrYm(trim(item.getCrtrYm(), 10))
                .diseaseNm1(trim(item.getMfrnIntrsIlnsNm1(), 100))
                .diseaseNm2(trim(item.getMfrnIntrsIlnsNm2(), 100))
                .diseaseNm3(trim(item.getMfrnIntrsIlnsNm3(), 100))
                .diseaseNm4(trim(item.getMfrnIntrsIlnsNm4(), 100))
                .diseaseNm5(trim(item.getMfrnIntrsIlnsNm5(), 100))
                .build();

        Optional<HospitalClinicTop5> existingOpt = top5Repository.findByHospital_Id(hospital.getId());
        if (existingOpt.isPresent()) {
            existingOpt.get().updateFromApi(newData);
            top5Repository.save(existingOpt.get());
        } else {
            top5Repository.save(newData);
        }
        return true;
    }

    private static String trim(String value, int maxLen) {
        if (value == null) return null;
        String s = value.trim();
        return s.length() > maxLen ? s.substring(0, maxLen) : s;
    }
}

