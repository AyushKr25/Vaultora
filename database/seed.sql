-- ========================================
-- Bank Management System - Seed Data
-- MySQL Database
-- ========================================

USE bank_management;

-- Clear existing data (for clean setup)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE audit_logs;
TRUNCATE TABLE transactions;
TRUNCATE TABLE bank_accounts;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- INSERT USERS
-- Password for all users: Password@123
-- BCrypt hash of 'Password@123'
-- ========================================
INSERT INTO users (email, password_hash, first_name, last_name, phone, address, date_of_birth, role_id, is_active, email_verified) VALUES
-- Admin user
('admin@bank.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4JJXTA4VLDAKaWGe', 'System', 'Admin', '+1234567890', '123 Admin Street, Banking City', '1985-01-15', 1, TRUE, TRUE),
-- Customer users
('john.doe@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4JJXTA4VLDAKaWGe', 'John', 'Doe', '+1987654321', '456 Customer Ave, Money Town', '1990-05-20', 2, TRUE, TRUE),
('jane.smith@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4JJXTA4VLDAKaWGe', 'Jane', 'Smith', '+1122334455', '789 Savings Blvd, Finance City', '1988-08-12', 2, TRUE, TRUE),
('bob.wilson@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4JJXTA4VLDAKaWGe', 'Bob', 'Wilson', '+1555666777', '321 Investment Road, Capital Town', '1995-03-25', 2, TRUE, TRUE),
('alice.johnson@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4JJXTA4VLDAKaWGe', 'Alice', 'Johnson', '+1999888777', '654 Wealth Street, Rich City', '1992-11-08', 2, TRUE, FALSE);

-- ========================================
-- INSERT BANK ACCOUNTS
-- ========================================
INSERT INTO bank_accounts (account_number, user_id, account_type, balance, currency, is_frozen, daily_limit) VALUES
-- John Doe's accounts
('ACC202401000001', 2, 'savings', 15000.00, 'USD', FALSE, 5000.00),
('ACC202401000002', 2, 'checking', 3500.50, 'USD', FALSE, 10000.00),
-- Jane Smith's accounts
('ACC202401000003', 3, 'savings', 25000.00, 'USD', FALSE, 7500.00),
('ACC202401000004', 3, 'business', 150000.00, 'USD', FALSE, 50000.00),
-- Bob Wilson's account
('ACC202401000005', 4, 'savings', 8750.25, 'USD', FALSE, 5000.00),
-- Alice Johnson's account (frozen for demo)
('ACC202401000006', 5, 'savings', 12000.00, 'USD', TRUE, 5000.00);

-- ========================================
-- INSERT SAMPLE TRANSACTIONS
-- ========================================
INSERT INTO transactions (transaction_ref, account_id, transaction_type, amount, balance_before, balance_after, description, status, created_at) VALUES
-- John Doe transactions
('TXN20240101120001', 1, 'deposit', 5000.00, 10000.00, 15000.00, 'Initial deposit', 'completed', '2024-01-01 10:00:00'),
('TXN20240102120002', 1, 'withdrawal', 500.00, 15000.00, 14500.00, 'ATM withdrawal', 'completed', '2024-01-02 14:30:00'),
('TXN20240103120003', 1, 'deposit', 1000.00, 14500.00, 15500.00, 'Salary credit', 'completed', '2024-01-03 09:00:00'),
('TXN20240105120004', 2, 'deposit', 2000.00, 1500.50, 3500.50, 'Transfer from savings', 'completed', '2024-01-05 11:20:00'),
-- Jane Smith transactions
('TXN20240101120005', 3, 'deposit', 10000.00, 15000.00, 25000.00, 'Business income', 'completed', '2024-01-01 16:00:00'),
('TXN20240104120006', 4, 'deposit', 50000.00, 100000.00, 150000.00, 'Contract payment', 'completed', '2024-01-04 10:45:00'),
('TXN20240106120007', 4, 'withdrawal', 20000.00, 150000.00, 130000.00, 'Supplier payment', 'completed', '2024-01-06 15:30:00'),
('TXN20240108120008', 4, 'deposit', 40000.00, 130000.00, 170000.00, 'Client payment', 'completed', '2024-01-08 09:15:00'),
-- Bob Wilson transactions
('TXN20240102120009', 5, 'deposit', 3000.00, 5750.25, 8750.25, 'Freelance income', 'completed', '2024-01-02 13:00:00'),
('TXN20240107120010', 5, 'withdrawal', 250.00, 8750.25, 8500.25, 'Grocery shopping', 'completed', '2024-01-07 18:45:00'),
('TXN20240109120011', 5, 'deposit', 250.00, 8500.25, 8750.25, 'Refund', 'completed', '2024-01-09 12:00:00');

-- ========================================
-- INSERT AUDIT LOGS
-- ========================================
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at) VALUES
(1, 'USER_LOGIN', 'user', 1, '{"ip": "192.168.1.1"}', '2024-01-01 08:00:00'),
(2, 'ACCOUNT_CREATED', 'bank_account', 1, '{"account_number": "ACC202401000001", "type": "savings"}', '2024-01-01 09:30:00'),
(2, 'TRANSACTION_DEPOSIT', 'transaction', 1, '{"amount": 5000.00}', '2024-01-01 10:00:00'),
(3, 'ACCOUNT_CREATED', 'bank_account', 3, '{"account_number": "ACC202401000003", "type": "savings"}', '2024-01-01 11:00:00'),
(1, 'ACCOUNT_FROZEN', 'bank_account', 6, '{"reason": "Suspicious activity"}', '2024-01-10 14:00:00');

SELECT 'Seed data inserted successfully!' AS Status;
SELECT CONCAT('Created ', COUNT(*), ' users') AS Users FROM users;
SELECT CONCAT('Created ', COUNT(*), ' bank accounts') AS Accounts FROM bank_accounts;
SELECT CONCAT('Created ', COUNT(*), ' transactions') AS Transactions FROM transactions;
