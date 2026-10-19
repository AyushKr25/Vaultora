-- Combined setup script for SecureBank database
-- Run this script with: mysql -u root -padmin < setup_database.sql

-- Create database
DROP DATABASE IF EXISTS bank_app;
CREATE DATABASE bank_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bank_app;

-- Roles table
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users table (matched to SQLAlchemy model)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    role_id INT NOT NULL DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role_id)
);

-- Bank accounts table
CREATE TABLE bank_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account_number VARCHAR(20) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    account_type ENUM('savings', 'checking', 'business') DEFAULT 'savings',
    balance DECIMAL(15, 2) DEFAULT 0.00,
    daily_limit DECIMAL(15, 2) DEFAULT 10000.00,
    is_active BOOLEAN DEFAULT TRUE,
    is_frozen BOOLEAN DEFAULT FALSE,
    freeze_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_accounts_user (user_id),
    INDEX idx_accounts_number (account_number)
);

-- Transactions table
CREATE TABLE transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    transaction_ref VARCHAR(50) NOT NULL UNIQUE,
    account_id INT NOT NULL,
    transaction_type ENUM('deposit', 'withdrawal', 'transfer_in', 'transfer_out') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    balance_before DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    description TEXT,
    related_account_id INT NULL,
    status ENUM('pending', 'completed', 'failed', 'reversed') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (related_account_id) REFERENCES bank_accounts(id) ON DELETE SET NULL,
    INDEX idx_transactions_account (account_id),
    INDEX idx_transactions_type (transaction_type),
    INDEX idx_transactions_date (created_at)
);

-- Audit logs table (matched to SQLAlchemy model)
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_date (created_at)
);

-- Insert roles
INSERT INTO roles (id, name, description) VALUES
(1, 'admin', 'System administrator with full access'),
(2, 'customer', 'Regular bank customer');

-- Insert users with proper bcrypt hash for Password@123
INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role_id, is_active, email_verified) VALUES
(1, 'admin@bank.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.jYFqPnIjYQlHPe', 'Admin', 'User', '+1234567890', 1, TRUE, TRUE),
(2, 'john.doe@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.jYFqPnIjYQlHPe', 'John', 'Doe', '+1987654321', 2, TRUE, TRUE),
(3, 'jane.smith@email.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.jYFqPnIjYQlHPe', 'Jane', 'Smith', '+1122334455', 2, TRUE, TRUE);

-- Insert bank accounts
INSERT INTO bank_accounts (id, account_number, user_id, account_type, balance, daily_limit) VALUES
(1, 'ACC2024010001', 2, 'savings', 15000.00, 10000.00),
(2, 'ACC2024010002', 2, 'checking', 5000.00, 15000.00),
(3, 'ACC2024010003', 3, 'savings', 25000.00, 10000.00),
(4, 'ACC2024010004', 3, 'business', 50000.00, 50000.00);

-- Insert sample transactions
INSERT INTO transactions (transaction_ref, account_id, transaction_type, amount, balance_before, balance_after, description) VALUES
('TXN20240101001', 1, 'deposit', 5000.00, 10000.00, 15000.00, 'Initial deposit'),
('TXN20240101002', 2, 'deposit', 3000.00, 2000.00, 5000.00, 'Salary credit'),
('TXN20240101003', 3, 'deposit', 10000.00, 15000.00, 25000.00, 'Investment return'),
('TXN20240101004', 1, 'withdrawal', 500.00, 15500.00, 15000.00, 'ATM withdrawal');

-- Insert audit logs
INSERT INTO audit_logs (user_id, action, entity_type, entity_id) VALUES
(1, 'user_login', 'users', 1),
(2, 'account_created', 'bank_accounts', 1),
(2, 'deposit', 'transactions', 1);

SELECT 'Database setup completed successfully!' AS Status;
