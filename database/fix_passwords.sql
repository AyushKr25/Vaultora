-- Fix user passwords with correct bcrypt hash for 'Password@123'
UPDATE users SET password_hash = '$2b$12$gvYm0QJ.ZHqVlP9B1Lr6neJL6bM9K8pXmVgHl0.xH4eO1kM2eW6L2' WHERE email = 'admin@bank.com';
UPDATE users SET password_hash = '$2b$12$gvYm0QJ.ZHqVlP9B1Lr6neJL6bM9K8pXmVgHl0.xH4eO1kM2eW6L2' WHERE email = 'john.doe@email.com';
UPDATE users SET password_hash = '$2b$12$gvYm0QJ.ZHqVlP9B1Lr6neJL6bM9K8pXmVgHl0.xH4eO1kM2eW6L2' WHERE email = 'jane.smith@email.com';
SELECT email, password_hash FROM users;
