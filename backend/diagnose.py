"""
Diagnostic script to test database connectivity and user query
"""
import sys
sys.path.insert(0, '.')

from dotenv import load_dotenv
load_dotenv()

import os
print(f"DB_NAME: {os.getenv('DB_NAME')}")
print(f"DB_PASSWORD: {'*' * len(os.getenv('DB_PASSWORD', ''))}")

from app import create_app
from app.extensions import db
from app.models import User, Role

app = create_app()

with app.app_context():
    try:
        # Test database connection
        print("\n1. Testing database connection...")
        result = db.session.execute(db.text("SELECT 1")).fetchone()
        print(f"   Database connection: OK")
        
        # Test Role query
        print("\n2. Testing Role query...")
        roles = Role.query.all()
        print(f"   Found {len(roles)} roles: {[r.name for r in roles]}")
        
        # Test User query
        print("\n3. Testing User query...")
        users = User.query.all()
        print(f"   Found {len(users)} users")
        
        for user in users:
            print(f"   - {user.email} (role_id: {user.role_id}, role: {user.role.name if user.role else 'None'})")
        
        # Test password verification
        print("\n4. Testing password verification...")
        admin = User.query.filter_by(email='admin@bank.com').first()
        if admin:
            result = admin.check_password('Password@123')
            print(f"   Password check for admin@bank.com: {'PASS' if result else 'FAIL'}")
        else:
            print("   Admin user not found!")
            
    except Exception as e:
        print(f"\n   ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
