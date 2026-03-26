-- 기존 스키마(FK 제약 이름/옵션 불명)를 안전하게 교정하기 위해
-- 테이블/참조 테이블 존재 시에만 FK를 교체하여 ON DELETE CASCADE를 강제한다.

DROP PROCEDURE IF EXISTS ensure_fk_on_delete_cascade;

DELIMITER $$
CREATE PROCEDURE ensure_fk_on_delete_cascade(
    IN p_table_name VARCHAR(64),
    IN p_column_name VARCHAR(64),
    IN p_ref_table_name VARCHAR(64),
    IN p_ref_column_name VARCHAR(64),
    IN p_constraint_name VARCHAR(64)
)
proc: BEGIN
    DECLARE v_table_exists INT DEFAULT 0;
    DECLARE v_ref_table_exists INT DEFAULT 0;
    DECLARE v_existing_fk_name VARCHAR(64);
    DECLARE v_existing_delete_rule VARCHAR(20);
    DECLARE v_existing_same_name INT DEFAULT 0;

    SELECT COUNT(*)
      INTO v_table_exists
      FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = p_table_name;

    SELECT COUNT(*)
      INTO v_ref_table_exists
      FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = p_ref_table_name;

    IF v_table_exists = 0 OR v_ref_table_exists = 0 THEN
        LEAVE proc;
    END IF;

    SELECT kcu.CONSTRAINT_NAME, rc.DELETE_RULE
      INTO v_existing_fk_name, v_existing_delete_rule
      FROM information_schema.KEY_COLUMN_USAGE kcu
      JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
        ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
       AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
       AND rc.TABLE_NAME = kcu.TABLE_NAME
     WHERE kcu.CONSTRAINT_SCHEMA = DATABASE()
       AND kcu.TABLE_NAME = p_table_name
       AND kcu.COLUMN_NAME = p_column_name
       AND kcu.REFERENCED_TABLE_NAME = p_ref_table_name
       AND kcu.REFERENCED_COLUMN_NAME = p_ref_column_name
     LIMIT 1;

    IF v_existing_fk_name IS NOT NULL AND v_existing_delete_rule = 'CASCADE' THEN
        LEAVE proc;
    END IF;

    IF v_existing_fk_name IS NOT NULL THEN
        SET @drop_sql = CONCAT(
            'ALTER TABLE `', p_table_name, '` DROP FOREIGN KEY `', v_existing_fk_name, '`'
        );
        PREPARE stmt_drop FROM @drop_sql;
        EXECUTE stmt_drop;
        DEALLOCATE PREPARE stmt_drop;
    END IF;

    SELECT COUNT(*)
      INTO v_existing_same_name
      FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = p_table_name
       AND CONSTRAINT_NAME = p_constraint_name
       AND CONSTRAINT_TYPE = 'FOREIGN KEY';

    IF v_existing_same_name > 0 THEN
        SET @drop_name_sql = CONCAT(
            'ALTER TABLE `', p_table_name, '` DROP FOREIGN KEY `', p_constraint_name, '`'
        );
        PREPARE stmt_drop_name FROM @drop_name_sql;
        EXECUTE stmt_drop_name;
        DEALLOCATE PREPARE stmt_drop_name;
    END IF;

    SET @add_sql = CONCAT(
        'ALTER TABLE `', p_table_name, '` ',
        'ADD CONSTRAINT `', p_constraint_name, '` ',
        'FOREIGN KEY (`', p_column_name, '`) ',
        'REFERENCES `', p_ref_table_name, '`(`', p_ref_column_name, '`) ',
        'ON DELETE CASCADE'
    );
    PREPARE stmt_add FROM @add_sql;
    EXECUTE stmt_add;
    DEALLOCATE PREPARE stmt_add;
END $$
DELIMITER ;

CALL ensure_fk_on_delete_cascade('user_favorite_hospitals', 'user_id', 'users', 'id', 'fk_user_favorite_hospitals_user');
CALL ensure_fk_on_delete_cascade('user_favorite_hospitals', 'hospital_id', 'hospitals', 'id', 'fk_user_favorite_hospitals_hospital');
CALL ensure_fk_on_delete_cascade('hospital_reviews', 'user_id', 'users', 'id', 'fk_hospital_reviews_user');
CALL ensure_fk_on_delete_cascade('hospital_reviews', 'hospital_id', 'hospitals', 'id', 'fk_hospital_reviews_hospital');
CALL ensure_fk_on_delete_cascade('hospital_clinic_top5', 'hospital_id', 'hospitals', 'id', 'fk_hospital_clinic_top5_hospital');
CALL ensure_fk_on_delete_cascade('hospital_evaluations', 'hospital_id', 'hospitals', 'id', 'fk_hospital_evaluations_hospital');

DROP PROCEDURE IF EXISTS ensure_fk_on_delete_cascade;
