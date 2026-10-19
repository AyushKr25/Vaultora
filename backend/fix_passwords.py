"""
Script to fix user passwords in the database
"""
import sys
sys.path.insert(0, '.')

from app import create_app
from app.extensions import db
from app.models import User

app = create_app()

with app.app_context():
    # Get all users
    users = User.query.all()
    
    print(f"Found {len(users)} users")
    
    for user in users:
        print(f"Updating password for: {user.email}")
        user.set_password('Password@123')
    
    db.session.commit()
    print("All passwords updated to: Password@123")
    
    # Verify
    admin = User.query.filter_by(email='admin@bank.com').first()
    if admin:
        if admin.check_password('Password@123'):
            print("✓ Password verification successful!")
        else:
            print("✗ Password verification failed!")
    else:
        print("Admin user not found")
