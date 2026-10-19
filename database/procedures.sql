-- ========================================
-- Bank Management System - Stored Procedures
-- MySQL Database
-- ========================================

USE bank_management;

-- Drop existing procedures
DROP PROCEDURE IF EXISTS sp_deposit;
DROP PROCEDURE IF EXISTS sp_withdraw;
DROP PROCEDURE IF EXISTS sp_transfer;
DROP PROCEDURE IF EXISTS sp_generate_account_number;
DROP FUNCTION IF EXISTS fn_generate_transaction_ref;

-- ========================================
-- FUNCTION: Generate Transaction Reference
-- ========================================
DELIMITER //

CREATE FUNCTION fn_generate_transaction_ref()
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
    DECLARE ref VARCHAR(50);
    SET ref = CONCAT('TXN', DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'), LPAD(FLOOR(RAND() * 10000), 4, '0'));
    RETURN ref;
END//

-- ========================================
-- PROCEDURE: Generate Account Number
-- ========================================
CREATE PROCEDURE sp_generate_account_number(
    OUT p_account_number VARCHAR(20)
)
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE attempts INT DEFAULT 0;
    
    WHILE done = 0 AND attempts < 10 DO
        SET p_account_number = CONCAT('ACC', DATE_FORMAT(NOW(), '%Y%m'), LPAD(FLOOR(RAND() * 1000000), 6, '0'));
        
        IF NOT EXISTS (SELECT 1 FROM bank_accounts WHERE account_number = p_account_number) THEN
            SET done = 1;
        END IF;
        
        SET attempts = attempts + 1;
    END WHILE;
    
    IF done = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Failed to generate unique account number';
    END IF;
END//

-- ========================================
-- PROCEDURE: Deposit Money
-- ========================================
CREATE PROCEDURE sp_deposit(
    IN p_account_id INT,
    IN p_amount DECIMAL(15, 2),
    IN p_description TEXT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255),
    OUT p_transaction_ref VARCHAR(50)
)
BEGIN
    DECLARE v_current_balance DECIMAL(15, 2);
    DECLARE v_new_balance DECIMAL(15, 2);
    DECLARE v_is_frozen BOOLEAN;
    DECLARE v_is_active BOOLEAN;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'An error occurred during deposit';
    END;
    
    START TRANSACTION;
    
    -- Validate amount
    IF p_amount <= 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Deposit amount must be greater than zero';
        ROLLBACK;
    ELSE
        -- Get account details with lock
        SELECT balance, is_frozen, is_active
        INTO v_current_balance, v_is_frozen, v_is_active
        FROM bank_accounts
        WHERE id = p_account_id
        FOR UPDATE;
        
        IF v_current_balance IS NULL THEN
            SET p_success = FALSE;
            SET p_message = 'Account not found';
            ROLLBACK;
        ELSEIF v_is_frozen THEN
            SET p_success = FALSE;
            SET p_message = 'Account is frozen';
            ROLLBACK;
        ELSEIF NOT v_is_active THEN
            SET p_success = FALSE;
            SET p_message = 'Account is inactive';
            ROLLBACK;
        ELSE
            -- Calculate new balance
            SET v_new_balance = v_current_balance + p_amount;
            SET p_transaction_ref = fn_generate_transaction_ref();
            
            -- Update balance
            UPDATE bank_accounts
            SET balance = v_new_balance
            WHERE id = p_account_id;
            
            -- Record transaction
            INSERT INTO transactions (
                transaction_ref,
                account_id,
                transaction_type,
                amount,
                balance_before,
                balance_after,
                description,
                status
            ) VALUES (
                p_transaction_ref,
                p_account_id,
                'deposit',
                p_amount,
                v_current_balance,
                v_new_balance,
                IFNULL(p_description, 'Deposit'),
                'completed'
            );
            
            SET p_success = TRUE;
            SET p_message = CONCAT('Successfully deposited $', FORMAT(p_amount, 2));
            COMMIT;
        END IF;
    END IF;
END//

-- ========================================
-- PROCEDURE: Withdraw Money
-- ========================================
CREATE PROCEDURE sp_withdraw(
    IN p_account_id INT,
    IN p_amount DECIMAL(15, 2),
    IN p_description TEXT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255),
    OUT p_transaction_ref VARCHAR(50)
)
BEGIN
    DECLARE v_current_balance DECIMAL(15, 2);
    DECLARE v_new_balance DECIMAL(15, 2);
    DECLARE v_is_frozen BOOLEAN;
    DECLARE v_is_active BOOLEAN;
    DECLARE v_daily_limit DECIMAL(15, 2);
    DECLARE v_today_withdrawn DECIMAL(15, 2);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'An error occurred during withdrawal';
    END;
    
    START TRANSACTION;
    
    -- Validate amount
    IF p_amount <= 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Withdrawal amount must be greater than zero';
        ROLLBACK;
    ELSE
        -- Get account details with lock
        SELECT balance, is_frozen, is_active, daily_limit
        INTO v_current_balance, v_is_frozen, v_is_active, v_daily_limit
        FROM bank_accounts
        WHERE id = p_account_id
        FOR UPDATE;
        
        IF v_current_balance IS NULL THEN
            SET p_success = FALSE;
            SET p_message = 'Account not found';
            ROLLBACK;
        ELSEIF v_is_frozen THEN
            SET p_success = FALSE;
            SET p_message = 'Account is frozen';
            ROLLBACK;
        ELSEIF NOT v_is_active THEN
            SET p_success = FALSE;
            SET p_message = 'Account is inactive';
            ROLLBACK;
        ELSEIF p_amount > v_current_balance THEN
            SET p_success = FALSE;
            SET p_message = 'Insufficient balance';
            ROLLBACK;
        ELSE
            -- Check daily limit
            SELECT IFNULL(SUM(amount), 0)
            INTO v_today_withdrawn
            FROM transactions
            WHERE account_id = p_account_id
            AND transaction_type IN ('withdrawal', 'transfer_out')
            AND DATE(created_at) = CURDATE();
            
            IF (v_today_withdrawn + p_amount) > v_daily_limit THEN
                SET p_success = FALSE;
                SET p_message = CONCAT('Daily limit exceeded. Remaining: $', FORMAT(v_daily_limit - v_today_withdrawn, 2));
                ROLLBACK;
            ELSE
                -- Calculate new balance
                SET v_new_balance = v_current_balance - p_amount;
                SET p_transaction_ref = fn_generate_transaction_ref();
                
                -- Update balance
                UPDATE bank_accounts
                SET balance = v_new_balance
                WHERE id = p_account_id;
                
                -- Record transaction
                INSERT INTO transactions (
                    transaction_ref,
                    account_id,
                    transaction_type,
                    amount,
                    balance_before,
                    balance_after,
                    description,
                    status
                ) VALUES (
                    p_transaction_ref,
                    p_account_id,
                    'withdrawal',
                    p_amount,
                    v_current_balance,
                    v_new_balance,
                    IFNULL(p_description, 'Withdrawal'),
                    'completed'
                );
                
                SET p_success = TRUE;
                SET p_message = CONCAT('Successfully withdrew $', FORMAT(p_amount, 2));
                COMMIT;
            END IF;
        END IF;
    END IF;
END//

-- ========================================
-- PROCEDURE: Transfer Money
-- ========================================
CREATE PROCEDURE sp_transfer(
    IN p_from_account_id INT,
    IN p_to_account_id INT,
    IN p_amount DECIMAL(15, 2),
    IN p_description TEXT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(255),
    OUT p_transaction_ref VARCHAR(50)
)
BEGIN
    DECLARE v_from_balance DECIMAL(15, 2);
    DECLARE v_to_balance DECIMAL(15, 2);
    DECLARE v_from_frozen BOOLEAN;
    DECLARE v_to_frozen BOOLEAN;
    DECLARE v_from_active BOOLEAN;
    DECLARE v_to_active BOOLEAN;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'An error occurred during transfer';
    END;
    
    START TRANSACTION;
    
    -- Validate
    IF p_from_account_id = p_to_account_id THEN
        SET p_success = FALSE;
        SET p_message = 'Cannot transfer to the same account';
        ROLLBACK;
    ELSEIF p_amount <= 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Transfer amount must be greater than zero';
        ROLLBACK;
    ELSE
        -- Lock both accounts (in order to prevent deadlocks)
        SELECT balance, is_frozen, is_active
        INTO v_from_balance, v_from_frozen, v_from_active
        FROM bank_accounts
        WHERE id = p_from_account_id
        FOR UPDATE;
        
        SELECT balance, is_frozen, is_active
        INTO v_to_balance, v_to_frozen, v_to_active
        FROM bank_accounts
        WHERE id = p_to_account_id
        FOR UPDATE;
        
        IF v_from_balance IS NULL THEN
            SET p_success = FALSE;
            SET p_message = 'Source account not found';
            ROLLBACK;
        ELSEIF v_to_balance IS NULL THEN
            SET p_success = FALSE;
            SET p_message = 'Destination account not found';
            ROLLBACK;
        ELSEIF v_from_frozen OR v_to_frozen THEN
            SET p_success = FALSE;
            SET p_message = 'One or both accounts are frozen';
            ROLLBACK;
        ELSEIF NOT v_from_active OR NOT v_to_active THEN
            SET p_success = FALSE;
            SET p_message = 'One or both accounts are inactive';
            ROLLBACK;
        ELSEIF p_amount > v_from_balance THEN
            SET p_success = FALSE;
            SET p_message = 'Insufficient balance';
            ROLLBACK;
        ELSE
            SET p_transaction_ref = fn_generate_transaction_ref();
            
            -- Debit source account
            UPDATE bank_accounts
            SET balance = balance - p_amount
            WHERE id = p_from_account_id;
            
            -- Credit destination account
            UPDATE bank_accounts
            SET balance = balance + p_amount
            WHERE id = p_to_account_id;
            
            -- Record outgoing transaction
            INSERT INTO transactions (
                transaction_ref,
                account_id,
                transaction_type,
                amount,
                balance_before,
                balance_after,
                description,
                status,
                related_account_id
            ) VALUES (
                p_transaction_ref,
                p_from_account_id,
                'transfer_out',
                p_amount,
                v_from_balance,
                v_from_balance - p_amount,
                IFNULL(p_description, 'Transfer'),
                'completed',
                p_to_account_id
            );
            
            -- Record incoming transaction
            INSERT INTO transactions (
                transaction_ref,
                account_id,
                transaction_type,
                amount,
                balance_before,
                balance_after,
                description,
                status,
                related_account_id
            ) VALUES (
                CONCAT(p_transaction_ref, '-R'),
                p_to_account_id,
                'transfer_in',
                p_amount,
                v_to_balance,
                v_to_balance + p_amount,
                IFNULL(p_description, 'Transfer received'),
                'completed',
                p_from_account_id
            );
            
            SET p_success = TRUE;
            SET p_message = CONCAT('Successfully transferred $', FORMAT(p_amount, 2));
            COMMIT;
        END IF;
    END IF;
END//

DELIMITER ;

SELECT 'Stored procedures created successfully!' AS Status;
