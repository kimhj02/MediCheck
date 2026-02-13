package com.medicheck.server.service;

import com.medicheck.server.client.hira.dto.HiraHospItem;
import com.medicheck.server.domain.entity.Hospital;
import com.medicheck.server.domain.repository.HospitalRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class HospitalPersistenceServiceTest {

    @Mock
    private HospitalRepository hospitalRepository;

    @InjectMocks
    private HospitalPersistenceService hospitalPersistenceService;

    @Test
    @DisplayName("updateExistingHospitals - 기존 ykiho에 해당하는 병원만 HIRA 데이터로 갱신한다")
    void updateExistingHospitals_updatesOnlyExistingByYkiho() {
        String ykiho = "YKIHO001";
        HiraHospItem item = new HiraHospItem();
        item.setYkiho(ykiho);
        item.setYadmNm("갱신된병원명");
        item.setAddr("갱신된주소");
        item.setTelno("02-9999-8888");
        item.setClCdNm("병원");
        item.setXPos("127.0");
        item.setYPos("37.5");
        item.setEstbDd("20100101");
        item.setDrTotCnt(10);

        Hospital existing = Hospital.builder()
                .name("기존병원명")
                .address("기존주소")
                .publicCode(ykiho)
                .phone("02-1111-2222")
                .department("내과")
                .latitude(BigDecimal.valueOf(37.5))
                .longitude(BigDecimal.valueOf(127.0))
                .build();

        given(hospitalRepository.findByPublicCode(ykiho)).willReturn(Optional.of(existing));

        int updated = hospitalPersistenceService.updateExistingHospitals(List.of(item));

        assertThat(updated).isEqualTo(1);
        ArgumentCaptor<Hospital> captor = ArgumentCaptor.forClass(Hospital.class);
        verify(hospitalRepository).save(captor.capture());
        Hospital saved = captor.getValue();
        assertThat(saved.getName()).isEqualTo("갱신된병원명");
        assertThat(saved.getAddress()).isEqualTo("갱신된주소");
        assertThat(saved.getPhone()).isEqualTo("02-9999-8888");
        assertThat(saved.getDoctorTotalCount()).isEqualTo(10);
    }

    @Test
    @DisplayName("updateExistingHospitals - DB에 없는 ykiho는 건너뛴다")
    void updateExistingHospitals_skipsWhenNotFound() {
        HiraHospItem item = new HiraHospItem();
        item.setYkiho("NOEXIST");
        item.setYadmNm("병원명");
        given(hospitalRepository.findByPublicCode("NOEXIST")).willReturn(Optional.empty());

        int updated = hospitalPersistenceService.updateExistingHospitals(List.of(item));

        assertThat(updated).isZero();
        verify(hospitalRepository).findByPublicCode("NOEXIST");
        verify(hospitalRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateExistingHospitals - 빈 리스트는 0을 반환한다")
    void updateExistingHospitals_returns0ForEmptyList() {
        int updated = hospitalPersistenceService.updateExistingHospitals(List.of());
        assertThat(updated).isZero();
        verify(hospitalRepository, never()).findByPublicCode(any());
    }
}
