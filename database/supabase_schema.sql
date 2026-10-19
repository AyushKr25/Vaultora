-- ========================================
-- SecureBank - Database Schema (PostgreSQL / Supabase)
-- Ported from the original MySQL schema to match the SQLAlchemy models.
-- Run via Supabase SQL Editor, or: python database/apply_to_supabase.py
-- ========================================

-- pgcrypto: used for bcrypt password hashing in the seed data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop tables if they exist (clean setup, dependency-safe order)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ========================================
-- ROLES TABLE
-- ========================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- USERS TABLE
-- ========================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    role_id INT NOT NULL DEFAULT 2 REFERENCES roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    preferred_currency VARCHAR(10) DEFAULT 'USD',
    preferred_language VARCHAR(10) DEFAULT 'en',
    preferred_timezone VARCHAR(20) DEFAULT 'UTC-5',
    password_changed_at TIMESTAMP NULL,
    -- Demo/educational purposes only (NOT for production)
    plain_password VARCHAR(255) NULL
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);

-- ========================================
-- BANK ACCOUNTS TABLE
-- ========================================
CREATE TABLE bank_accounts (
    id SERIAL PRIMARY KEY,
    account_number VARCHAR(20) NOT NULL UNIQUE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_type VARCHAR(20) NOT NULL DEFAULT 'savings'
        CHECK (account_type IN ('savings', 'checking', 'business')),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    is_frozen BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    pin_hash VARCHAR(255),
    daily_limit NUMERIC(15, 2) DEFAULT 10000.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_balance CHECK (balance >= 0)
);
CREATE INDEX idx_accounts_user ON bank_accounts(user_id);
CREATE INDEX idx_accounts_number ON bank_accounts(account_number);

-- ========================================
-- TRANSACTIONS TABLE
-- ========================================
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    transaction_ref VARCHAR(50) NOT NULL UNIQUE,
    account_id INT NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL
        CHECK (transaction_type IN ('deposit', 'withdrawal', 'transfer_in', 'transfer_out')),
    amount NUMERIC(15, 2) NOT NULL,
    balance_before NUMERIC(15, 2) NOT NULL,
    balance_after NUMERIC(15, 2) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'completed'
        CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
    related_account_id INT NULL REFERENCES bank_accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_created ON transactions(created_at);
CREATE INDEX idx_transactions_ref ON transactions(transaction_ref);

-- ========================================
-- AUDIT LOGS TABLE
-- ========================================
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NULL REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ========================================
-- NOTIFICATIONS TABLE
-- ========================================
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'info'
        CHECK (type IN ('info', 'success', 'warning', 'error')),
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- ========================================
-- UPDATED_AT TRIGGER
-- (mirrors MySQL's ON UPDATE CURRENT_TIMESTAMP)
-- ========================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ========================================
-- SEED DATA
-- ========================================

-- Default roles
INSERT INTO roles (id, name, description) VALUES
    (1, 'admin', 'System administrator with full access'),
    (2, 'customer', 'Regular bank customer');
SELECT setval('roles_id_seq', 2, true);

-- Users (password for all: Password@123, hashed with bcrypt via pgcrypto)
INSERT INTO users (id, email, password_hash, plain_password, first_name, last_name, phone, address, date_of_birth, role_id, is_active, email_verified) VALUES
    (1, 'admin@bank.com',       crypt('Password@123', gen_salt('bf', 12)), 'Password@123', 'System', 'Admin',   '+1234567890', '123 Admin Street, Banking City',     '1985-01-15', 1, TRUE, TRUE),
    (2, 'john.doe@email.com',   crypt('Password@123', gen_salt('bf', 12)), 'Password@123', 'John',   'Doe',     '+1987654321', '456 Customer Ave, Money Town',      '1990-05-20', 2, TRUE, TRUE),
    (3, 'jane.smith@email.com', crypt('Password@123', gen_salt('bf', 12)), 'Password@123', 'Jane',   'Smith',   '+1122334455', '789 Savings Blvd, Finance City',     '1988-08-12', 2, TRUE, TRUE),
    (4, 'bob.wilson@email.com', crypt('Password@123', gen_salt('bf', 12)), 'Password@123', 'Bob',    'Wilson',  '+1555666777', '321 Investment Road, Capital Town',  '1995-03-25', 2, TRUE, TRUE),
    (5, 'alice.johnson@email.com', crypt('Password@123', gen_salt('bf', 12)), 'Password@123', 'Alice', 'Johnson', '+1999888777', '654 Wealth Street, Rich City',  '1992-11-08', 2, TRUE, FALSE);
SELECT setval('users_id_seq', 5, true);

-- Bank accounts
INSERT INTO bank_accounts (id, account_number, user_id, account_type, balance, currency, is_frozen, daily_limit) VALUES
    (1, 'ACC202401000001', 2, 'savings',   15000.00, 'USD', FALSE,  5000.00),
    (2, 'ACC202401000002', 2, 'checking',   3500.50, 'USD', FALSE, 10000.00),
    (3, 'ACC202401000003', 3, 'savings',   25000.00, 'USD', FALSE,  7500.00),
    (4, 'ACC202401000004', 3, 'business', 150000.00, 'USD', FALSE, 50000.00),
    (5, 'ACC202401000005', 4, 'savings',    8750.25, 'USD', FALSE,  5000.00),
    (6, 'ACC202401000006', 5, 'savings',   12000.00, 'USD', TRUE,   5000.00);
SELECT setval('bank_accounts_id_seq', 6, true);

-- Sample transactions
INSERT INTO transactions (transaction_ref, account_id, transaction_type, amount, balance_before, balance_after, description, status, created_at) VALUES
    ('TXN20240101120001', 1, 'deposit',     5000.00,  10000.00, 15000.00, 'Initial deposit',        'completed', '2024-01-01 10:00:00'),
    ('TXN20240102120002', 1, 'withdrawal',    500.00,  15000.00, 14500.00, 'ATM withdrawal',         'completed', '2024-01-02 14:30:00'),
    ('TXN20240103120003', 1, 'deposit',      1000.00,  14500.00, 15500.00, 'Salary credit',          'completed', '2024-01-03 09:00:00'),
    ('TXN20240105120004', 2, 'deposit',      2000.00,   1500.50,  3500.50, 'Transfer from savings',  'completed', '2024-01-05 11:20:00'),
    ('TXN20240101120005', 3, 'deposit',     10000.00,  15000.00, 25000.00, 'Business income',        'completed', '2024-01-01 16:00:00'),
    ('TXN20240104120006', 4, 'deposit',     50000.00, 100000.00, 150000.00, 'Contract payment',      'completed', '2024-01-04 10:45:00'),
    ('TXN20240106120007', 4, 'withdrawal',  20000.00, 150000.00, 130000.00, 'Supplier payment',     'completed', '2024-01-06 15:30:00'),
    ('TXN20240108120008', 4, 'deposit',     40000.00, 130000.00, 170000.00, 'Client payment',       'completed', '2024-01-08 09:15:00'),
    ('TXN20240102120009', 5, 'deposit',      3000.00,   5750.25,  8750.25, 'Freelance income',       'completed', '2024-01-02 13:00:00'),
    ('TXN20240107120010', 5, 'withdrawal',    250.00,   8750.25,  8500.25, 'Grocery shopping',       'completed', '2024-01-07 18:45:00'),
    ('TXN20240109120011', 5, 'deposit',       250.00,   8500.25,  8750.25, 'Refund',                 'completed', '2024-01-09 12:00:00');
SELECT setval('transactions_id_seq', 11, true);

-- Audit logs
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, created_at) VALUES
    (1, 'USER_LOGIN',          'user',          1, '{"ip": "192.168.1.1"}', '2024-01-01 08:00:00'),
    (2, 'ACCOUNT_CREATED',     'bank_account',  1, '{"account_number": "ACC202401000001", "type": "savings"}', '2024-01-01 09:30:00'),
    (2, 'TRANSACTION_DEPOSIT', 'transaction',   1, '{"amount": 5000.00}', '2024-01-01 10:00:00'),
    (3, 'ACCOUNT_CREATED',     'bank_account',  3, '{"account_number": "ACC202401000003", "type": "savings"}', '2024-01-01 11:00:00'),
    (1, 'ACCOUNT_FROZEN',      'bank_account',  6, '{"reason": "Suspicious activity"}', '2024-01-10 14:00:00');
SELECT setval('audit_logs_id_seq', 5, true);

-- Sample notifications
INSERT INTO notifications (user_id, type, title, message, is_read, created_at) VALUES
    (1, 'info',    'Welcome to SecureBank', 'Admin dashboard is ready to use.', TRUE,  '2024-01-01 08:05:00'),
    (2, 'success', 'Deposit Received',       '$5,000.00 has been deposited to your account ending in 0001.', FALSE, '2024-01-01 10:00:00'),
    (2, 'warning', 'Security Alert',         'New login detected on your account.', FALSE, '2024-01-02 09:12:00'),
    (3, 'success', 'Deposit Received',       '$10,000.00 has been deposited to your account ending in 0003.', FALSE, '2024-01-01 16:00:00');
SELECT setval('notifications_id_seq', 4, true);
