"""
Notifications API Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Notification, User

notifications_bp = Blueprint('notifications', __name__)


def get_current_user():
    """Get current authenticated user."""
    user_id = int(get_jwt_identity())
    return User.query.get(user_id)


@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get all notifications for the current user."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Query parameters
    unread_only = request.args.get('unread', 'false').lower() == 'true'
    limit = request.args.get('limit', 50, type=int)
    
    query = Notification.query.filter_by(user_id=user.id).order_by(Notification.created_at.desc())
    
    if unread_only:
        query = query.filter_by(is_read=False)
    
    notifications = query.limit(limit).all()
    unread_count = Notification.query.filter_by(user_id=user.id, is_read=False).count()
    
    return jsonify({
        'notifications': [n.to_dict() for n in notifications],
        'unreadCount': unread_count,
        'total': len(notifications)
    })


@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get count of unread notifications."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    count = Notification.query.filter_by(user_id=user.id, is_read=False).count()
    return jsonify({'unreadCount': count})


@notifications_bp.route('/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_as_read(notification_id):
    """Mark a notification as read."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    notification = Notification.query.get(notification_id)
    if not notification or notification.user_id != user.id:
        return jsonify({'error': 'Notification not found'}), 404
    
    notification.is_read = True
    db.session.commit()
    
    return jsonify({'message': 'Marked as read', 'notification': notification.to_dict()})


@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_as_read():
    """Mark all notifications as read."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    Notification.query.filter_by(user_id=user.id, is_read=False).update({'is_read': True})
    db.session.commit()
    
    return jsonify({'message': 'All notifications marked as read'})


@notifications_bp.route('/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    notification = Notification.query.get(notification_id)
    if not notification or notification.user_id != user.id:
        return jsonify({'error': 'Notification not found'}), 404
    
    db.session.delete(notification)
    db.session.commit()
    
    return jsonify({'message': 'Notification deleted'})


@notifications_bp.route('/clear', methods=['DELETE'])
@jwt_required()
def clear_all():
    """Delete all notifications for the current user."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    Notification.query.filter_by(user_id=user.id).delete()
    db.session.commit()
    
    return jsonify({'message': 'All notifications cleared'})
