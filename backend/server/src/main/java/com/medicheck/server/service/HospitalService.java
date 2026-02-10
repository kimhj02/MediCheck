package com.medicheck.server.service;

import com.medicheck.server.domain.repository.HospitalRepository;
import com.medicheck.server.dto.HospitalResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 안심 병원 조회 서비스.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HospitalService {

    private final HospitalRepository hospitalRepository;

    /**
     * 등록된 병원 목록을 페이지 단위로 조회합니다.
     */
    public Page<HospitalResponse> findAll(Pageable pageable) {
        return hospitalRepository.findAll(pageable).map(HospitalResponse::from);
    }
}
