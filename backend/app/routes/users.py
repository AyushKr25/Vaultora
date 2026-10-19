"""
User Routes
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User, AuditLog

users_bp = Blueprint('users', __name__)


@users_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user': user.to_dict(include_accounts=True)
    })


@users_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Update allowed fields
    if 'firstName' in data:
        first_name = data['firstName'].strip()
        if len(first_name) < 2:
            return jsonify({'error': 'First name must be at least 2 characters'}), 400
        user.first_name = first_name
    
    if 'lastName' in data:
        last_name = data['lastName'].strip()
        if len(last_name) < 2:
            return jsonify({'error': 'Last name must be at least 2 characters'}), 400
        user.last_name = last_name
    
    if 'phone' in data:
        user.phone = data['phone'] if data['phone'] else None
    
    if 'address' in data:
        user.address = data['address'] if data['address'] else None
    
    if 'dateOfBirth' in data:
        if data['dateOfBirth']:
            try:
                user.date_of_birth = datetime.strptime(data['dateOfBirth'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        else:
            user.date_of_birth = None
    
    try:
        db.session.commit()
        
        AuditLog.log(
            action='PROFILE_UPDATED',
            user_id=user_id,
            entity_type='user',
            entity_id=user_id,
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile'}), 500


@users_bp.route('/preferences', methods=['GET', 'PUT'])
@jwt_required()
def user_preferences():
    """Get or update user preferences."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if request.method == 'GET':
        return jsonify({
            'preferences': {
                'currency': user.preferred_currency or 'USD',
                'language': user.preferred_language or 'en',
                'timezone': user.preferred_timezone or 'UTC-5'
            }
        })
    
    # PUT - update preferences
    data = request.get_json()
    
    if 'currency' in data:
        user.preferred_currency = data['currency']
    if 'language' in data:
        user.preferred_language = data['language']
    if 'timezone' in data:
        user.preferred_timezone = data['timezone']
    
    try:
        db.session.commit()
        return jsonify({
            'message': 'Preferences updated successfully',
            'preferences': {
                'currency': user.preferred_currency,
                'language': user.preferred_language,
                'timezone': user.preferred_timezone
            }
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update preferences'}), 500

