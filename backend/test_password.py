"""
Test script to verify bcrypt password hashing and update database
"""
import bcrypt
import pymysql

# Generate a fresh password hash
password = 'Password@123'
password_bytes = password.encode('utf-8')
salt = bcrypt.gensalt()
password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')

print(f"Generated hash: {password_hash}")
print(f"Hash length: {len(password_hash)}")

# Test verification locally
test_result = bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
print(f"Local verification: {'PASS' if test_result else 'FAIL'}")

# Connect to database and update
try:
    connection = pymysql.connect(
        host='localhost',
        user='root',
        password='admin',
        database='bank_app',
        charset='utf8mb4'
    )
    
    with connection.cursor() as cursor:
        # Update all users
        sql = "UPDATE users SET password_hash = %s"
        cursor.execute(sql, (password_hash,))
        print(f"Updated {cursor.rowcount} users")
        
        # Verify the update
        cursor.execute("SELECT email, password_hash FROM users")
        for row in cursor.fetchall():
            email, db_hash = row
            verify = bcrypt.checkpw(password.encode('utf-8'), db_hash.encode('utf-8'))
            print(f"{email}: {'✓' if verify else '✗'}")
    
    connection.commit()
    connection.close()
    print("\nDatabase updated successfully!")
    print(f"All users can now login with: Password@123")
    
except Exception as e:
    print(f"Database error: {e}")
