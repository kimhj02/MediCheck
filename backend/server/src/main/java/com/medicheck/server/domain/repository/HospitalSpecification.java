package com.medicheck.server.domain.repository;

import com.medicheck.server.domain.entity.Hospital;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import jakarta.persistence.criteria.Predicate;

/**
 * 병원 목록 검색/필터용 Specification.
 */
public final class HospitalSpecification {

    private HospitalSpecification() {
    }

    /**
     * 키워드 검색: 병원명, 주소, 진료과에 LIKE %keyword% 적용.
     */
    public static Specification<Hospital> hasKeyword(String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return (root, query, cb) -> cb.conjunction();
        }
        String pattern = "%" + keyword.trim() + "%";
        return (root, query, cb) -> {
            Predicate name = cb.like(cb.lower(root.get("name")), pattern.toLowerCase());
            Predicate address = cb.like(cb.lower(root.get("address")), pattern.toLowerCase());
            Predicate department = cb.like(cb.lower(root.get("department")), pattern.toLowerCase());
            return cb.or(name, address, department);
        };
    }

    /**
     * 진료과 필터: department가 주어진 값과 일치(포함).
     */
    public static Specification<Hospital> hasDepartment(String department) {
        if (!StringUtils.hasText(department)) {
            return (root, query, cb) -> cb.conjunction();
        }
        String pattern = "%" + department.trim() + "%";
        return (root, query, cb) ->
                cb.like(cb.lower(root.get("department")), pattern.toLowerCase());
    }

    /**
     * keyword + department 조건을 하나의 Specification으로 합칩니다.
     */
    public static Specification<Hospital> withFilters(String keyword, String department) {
        return hasKeyword(keyword).and(hasDepartment(department));
    }
}
