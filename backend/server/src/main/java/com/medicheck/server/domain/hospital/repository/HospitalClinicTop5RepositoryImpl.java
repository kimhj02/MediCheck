package com.medicheck.server.domain.hospital.repository;

import com.medicheck.server.domain.hospital.entity.Hospital;
import com.medicheck.server.domain.hospital.entity.HospitalClinicTop5;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import java.util.ArrayList;
import java.util.List;

/**
 * 증상 토큰 OR 검색: 토큰마다 DB 라운드트립하지 않고 한 번의 SELECT DISTINCT로 조회합니다.
 */
public class HospitalClinicTop5RepositoryImpl implements HospitalClinicTop5RepositoryCustom {

    @PersistenceContext
    private EntityManager em;

    @Override
    public List<Long> findHospitalIdsWithDiseaseNameContainingAny(List<String> tokens) {
        if (tokens == null || tokens.isEmpty()) {
            return List.of();
        }

        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Long> cq = cb.createQuery(Long.class);
        Root<HospitalClinicTop5> root = cq.from(HospitalClinicTop5.class);
        Join<HospitalClinicTop5, Hospital> hospital = root.join("hospital");

        List<Predicate> tokenOrGroups = new ArrayList<>();
        for (String token : tokens) {
            if (token == null || token.length() < 2) {
                continue;
            }
            tokenOrGroups.add(matchTokenOnFiveDiseaseFields(cb, root, token));
        }
        if (tokenOrGroups.isEmpty()) {
            return List.of();
        }

        cq.select(hospital.get("id")).distinct(true);
        cq.where(cb.or(tokenOrGroups.toArray(Predicate[]::new)));
        return em.createQuery(cq).getResultList();
    }

    /**
     * JPQL {@code LOWER(COALESCE(diseaseNmK,'')) LIKE LOWER(CONCAT('%', :token, '%'))} 와 동일한 조건을
     * 다섯 필드에 OR로 묶습니다.
     */
    private static Predicate matchTokenOnFiveDiseaseFields(
            CriteriaBuilder cb,
            Root<HospitalClinicTop5> root,
            String token
    ) {
        Expression<String> pattern = lowerConcatPercent(cb, token);
        return cb.or(
                likeDiseaseField(cb, root, "diseaseNm1", pattern),
                likeDiseaseField(cb, root, "diseaseNm2", pattern),
                likeDiseaseField(cb, root, "diseaseNm3", pattern),
                likeDiseaseField(cb, root, "diseaseNm4", pattern),
                likeDiseaseField(cb, root, "diseaseNm5", pattern)
        );
    }

    private static Predicate likeDiseaseField(
            CriteriaBuilder cb,
            Root<HospitalClinicTop5> root,
            String attribute,
            Expression<String> pattern
    ) {
        Expression<String> field = cb.lower(cb.coalesce(root.get(attribute), cb.literal("")));
        return cb.like(field, pattern);
    }

    /** {@code LOWER(CONCAT('%', token, '%'))} */
    private static Expression<String> lowerConcatPercent(CriteriaBuilder cb, String token) {
        return cb.lower(cb.concat(cb.concat(cb.literal("%"), cb.literal(token)), cb.literal("%")));
    }
}
