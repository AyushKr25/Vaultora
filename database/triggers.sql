-- ========================================
-- Bank Management System - Triggers
-- MySQL Database
-- ========================================

USE bank_management;

-- Drop existing triggers
DROP TRIGGER IF EXISTS trg_after_transaction_insert;
DROP TRIGGER IF EXISTS trg_after_account_update;
DROP TRIGGER IF EXISTS trg_after_user_update;

-- ========================================
-- TRANSACTION LOGGING TRIGGER
-- Logs all transactions to audit_logs
-- ========================================
DELIMITER //

CREATE TRIGGER trg_after_transaction_insert
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        new_values,
        created_at
    )
    SELECT 
        ba.user_id,
        CONCAT('TRANSACTION_', UPPER(NEW.transaction_type)),
        'transaction',
        NEW.id,
        JSON_OBJECT(
            'transaction_ref', NEW.transaction_ref,
            'amount', NEW.amount,
            'balance_before', NEW.balance_before,
            'balance_after', NEW.balance_after,
            'type', NEW.transaction_type,
            'status', NEW.status
        ),
        NOW()
    FROM bank_accounts ba
    WHERE ba.id = NEW.account_id;
END//

-- ========================================
-- ACCOUNT STATUS CHANGE TRIGGER
-- Logs when account is frozen/unfrozen
-- ========================================
CREATE TRIGGER trg_after_account_update
AFTER UPDATE ON bank_accounts
FOR EACH ROW
BEGIN
    -- Log freeze/unfreeze status changes
    IF OLD.is_frozen != NEW.is_frozen THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            old_values,
            new_values,
            created_at
        )
        VALUES (
            NEW.user_id,
            IF(NEW.is_frozen, 'ACCOUNT_FROZEN', 'ACCOUNT_UNFROZEN'),
            'bank_account',
            NEW.id,
            JSON_OBJECT('is_frozen', OLD.is_frozen),
            JSON_OBJECT('is_frozen', NEW.is_frozen),
            NOW()
        );
    END IF;
    
    -- Log large balance changes (> $10000)
    IF ABS(NEW.balance - OLD.balance) > 10000 THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            old_values,
            new_values,
            created_at
        )
        VALUES (
            NEW.user_id,
            'LARGE_BALANCE_CHANGE',
            'bank_account',
            NEW.id,
            JSON_OBJECT('balance', OLD.balance),
            JSON_OBJECT('balance', NEW.balance, 'change', NEW.balance - OLD.balance),
            NOW()
        );
    END IF;
END//

-- ========================================
-- USER UPDATE TRIGGER
-- Logs user profile changes
-- ========================================
CREATE TRIGGER trg_after_user_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    -- Log status changes
    IF OLD.is_active != NEW.is_active THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            old_values,
            new_values,
            created_at
        )
        VALUES (
            NEW.id,
            IF(NEW.is_active, 'USER_ACTIVATED', 'USER_DEACTIVATED'),
            'user',
            NEW.id,
            JSON_OBJECT('is_active', OLD.is_active),
            JSON_OBJECT('is_active', NEW.is_active),
            NOW()
        );
    END IF;
    
    -- Log role changes
    IF OLD.role_id != NEW.role_id THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            old_values,
            new_values,
            created_at
        )
        VALUES (
            NEW.id,
            'ROLE_CHANGED',
            'user',
            NEW.id,
            JSON_OBJECT('role_id', OLD.role_id),
            JSON_OBJECT('role_id', NEW.role_id),
            NOW()
        );
    END IF;
END//

DELIMITER ;

SELECT 'Triggers created successfully!' AS Status;
