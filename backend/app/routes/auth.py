"""
Authentication Routes
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity, get_jwt
)
from ..extensions import db, limiter
from ..models import User, Role, AuditLog
import re

auth_bp = Blueprint('auth', __name__)


def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password):
    """Validate password strength."""
    if len(password) < 8:
        return False, 'Password must be at least 8 characters long'
    if not re.search(r'[A-Z]', password):
        return False, 'Password must contain at least one uppercase letter'
    if not re.search(r'[a-z]', password):
        return False, 'Password must contain at least one lowercase letter'
    if not re.search(r'\d', password):
        return False, 'Password must contain at least one digit'
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False, 'Password must contain at least one special character'
    return True, 'Valid'


@auth_bp.route('/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    """Register a new user."""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['email', 'password', 'firstName', 'lastName']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    email = data['email'].lower().strip()
    password = data['password']
    first_name = data['firstName'].strip()
    last_name = data['lastName'].strip()
    
    # Validate email format
    if not validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Validate password strength
    is_valid, message = validate_password(password)
    if not is_valid:
        return jsonify({'error': message}), 400
    
    # Check if email already exists
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409
    
    # Get customer role
    customer_role = Role.get_customer_role()
    if not customer_role:
        return jsonify({'error': 'System configuration error'}), 500
    
    # Create user
    user = User(
        email=email,
        first_name=first_name,
        last_name=last_name,
        phone=data.get('phone'),
        address=data.get('address'),
        role_id=customer_role.id
    )
    user.set_password(password)
    
    # Parse date of birth if provided
    if data.get('dateOfBirth'):
        try:
            user.date_of_birth = datetime.strptime(data['dateOfBirth'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
    
    try:
        db.session.add(user)
        db.session.commit()
        
        # Log registration
        AuditLog.log(
            action='USER_REGISTERED',
            user_id=user.id,
            entity_type='user',
            entity_id=user.id,
            new_values={'email': email},
            ip_address=request.remote_addr
        )
        
        # Generate tokens (identity must be string for Flask-JWT-Extended)
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Registration successful',
            'user': user.to_dict(),
            'accessToken': access_token,
            'refreshToken': refresh_token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Registration failed'}), 500


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    """Authenticate user and return tokens."""
    data = request.get_json()
    
    email = data.get('email', '').lower().strip()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(password):
        # Log failed attempt
        if user:
            AuditLog.log_login(user.id, request.remote_addr, success=False)
        return jsonify({'error': 'Invalid email or password'}), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403
    
    # Update last login
    user.update_last_login()
    
    # Log successful login
    AuditLog.log_login(user.id, request.remote_addr, success=True)
    
    # Generate tokens (identity must be string for Flask-JWT-Extended)
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(include_accounts=True),
        'accessToken': access_token,
        'refreshToken': refresh_token
    })


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current authenticated user."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user': user.to_dict(include_accounts=True)
    })


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user or not user.is_active:
        return jsonify({'error': 'Invalid user'}), 401
    
    access_token = create_access_token(identity=str(user_id))
    
    return jsonify({
        'accessToken': access_token
    })


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client should discard tokens)."""
    user_id = int(get_jwt_identity())
    
    AuditLog.log(
        action='USER_LOGOUT',
        user_id=user_id,
        entity_type='user',
        entity_id=user_id,
        ip_address=request.remote_addr
    )
    
    return jsonify({'message': 'Logged out successfully'})


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password."""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    current_password = data.get('currentPassword', '')
    new_password = data.get('newPassword', '')
    
    if not current_password or not new_password:
        return jsonify({'error': 'Current and new passwords are required'}), 400
    
    if not user.check_password(current_password):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    # Validate new password
    is_valid, message = validate_password(new_password)
    if not is_valid:
        return jsonify({'error': message}), 400
    
    user.set_password(new_password)
    db.session.commit()
    
    AuditLog.log(
        action='PASSWORD_CHANGED',
        user_id=user_id,
        entity_type='user',
        entity_id=user_id,
        ip_address=request.remote_addr
    )
    
    return jsonify({'message': 'Password changed successfully'})
