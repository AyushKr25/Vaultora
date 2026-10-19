"""Add password_changed_at column to users table."""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from sqlalchemy import text

app = create_app()

with app.app_context():
    try:
        # Check if column exists
        result = db.session.execute(text("SHOW COLUMNS FROM users LIKE 'password_changed_at'"))
        if not result.fetchone():
            db.session.execute(text("ALTER TABLE users ADD COLUMN password_changed_at DATETIME DEFAULT NULL"))
            db.session.commit()
            print("✅ Added password_changed_at column to users table")
        else:
            print("✅ password_changed_at column already exists")
    except Exception as e:
        print(f"Error: {e}")
        db.session.rollback()
