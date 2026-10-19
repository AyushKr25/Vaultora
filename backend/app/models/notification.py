"""
Notification Model
"""
from datetime import datetime
from ..extensions import db


class Notification(db.Model):
    """Notification model for user alerts and updates."""
    
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    type = db.Column(db.Enum('info', 'success', 'warning', 'error'), default='info')
    title = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('notifications', lazy='dynamic'))
    
    def __repr__(self):
        return f'<Notification {self.id}: {self.title}>'
    
    def to_dict(self):
        """Convert notification to dictionary."""
        return {
            'id': self.id,
            'type': self.type,
            'title': self.title,
            'message': self.message,
            'read': self.is_read,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def create(cls, user_id, title, message, notification_type='info'):
        """Create a new notification."""
        notification = cls(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message
        )
        db.session.add(notification)
        db.session.commit()
        return notification
    
    @classmethod
    def create_transaction_notification(cls, user_id, transaction_type, amount, account_number):
        """Create notification for a transaction."""
        type_labels = {
            'deposit': ('Deposit Received', 'success'),
            'withdrawal': ('Withdrawal Completed', 'info'),
            'transfer_in': ('Transfer Received', 'success'),
            'transfer_out': ('Transfer Sent', 'info')
        }
        
        title, notif_type = type_labels.get(transaction_type, ('Transaction', 'info'))
        
        if transaction_type == 'deposit':
            message = f"${amount:,.2f} has been deposited to your account ending in {account_number[-4:]}."
        elif transaction_type == 'withdrawal':
            message = f"${amount:,.2f} has been withdrawn from your account ending in {account_number[-4:]}."
        elif transaction_type == 'transfer_in':
            message = f"You received ${amount:,.2f} in your account ending in {account_number[-4:]}."
        elif transaction_type == 'transfer_out':
            message = f"${amount:,.2f} was transferred from your account ending in {account_number[-4:]}."
        else:
            message = f"Transaction of ${amount:,.2f} on account ending in {account_number[-4:]}."
        
        return cls.create(user_id, title, message, notif_type)
    
    @classmethod
    def create_account_notification(cls, user_id, account_type, account_number):
        """Create notification for new account creation."""
        return cls.create(
            user_id,
            'New Account Created',
            f"Your new {account_type} account ({account_number}) has been created successfully.",
            'success'
        )
    
    @classmethod
    def create_security_notification(cls, user_id, action):
        """Create security-related notification."""
        messages = {
            'login': 'New login detected on your account.',
            'password_change': 'Your password was successfully changed.',
            'profile_update': 'Your profile information has been updated.'
        }
        return cls.create(
            user_id,
            'Security Alert',
            messages.get(action, 'Security event on your account.'),
            'warning'
        )
