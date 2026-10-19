"""
Audit Log Model
"""
from datetime import datetime
import json
from ..extensions import db


class AuditLog(db.Model):
    """Audit log model for tracking system activities."""
    
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'))
    action = db.Column(db.String(100), nullable=False, index=True)
    entity_type = db.Column(db.String(50), index=True)
    entity_id = db.Column(db.Integer)
    old_values = db.Column(db.JSON)
    new_values = db.Column(db.JSON)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = db.relationship('User', back_populates='audit_logs')
    
    def __repr__(self):
        return f'<AuditLog {self.action} by User {self.user_id}>'
    
    def to_dict(self):
        """Convert audit log to dictionary."""
        return {
            'id': self.id,
            'userId': self.user_id,
            'userName': self.user.full_name if self.user else 'System',
            'action': self.action,
            'entityType': self.entity_type,
            'entityId': self.entity_id,
            'oldValues': self.old_values,
            'newValues': self.new_values,
            'ipAddress': self.ip_address,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def log(cls, action, user_id=None, entity_type=None, entity_id=None,
            old_values=None, new_values=None, ip_address=None, user_agent=None):
        """Create an audit log entry."""
        log_entry = cls(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent
        )
        db.session.add(log_entry)
        db.session.commit()
        return log_entry
    
    @classmethod
    def log_login(cls, user_id, ip_address=None, success=True):
        """Log user login attempt."""
        return cls.log(
            action='USER_LOGIN' if success else 'USER_LOGIN_FAILED',
            user_id=user_id,
            entity_type='user',
            entity_id=user_id,
            new_values={'success': success},
            ip_address=ip_address
        )
    
    @classmethod
    def log_transaction(cls, user_id, transaction, ip_address=None):
        """Log a transaction."""
        return cls.log(
            action=f'TRANSACTION_{transaction.transaction_type.upper()}',
            user_id=user_id,
            entity_type='transaction',
            entity_id=transaction.id,
            new_values={
                'amount': float(transaction.amount),
                'account_id': transaction.account_id,
                'reference': transaction.transaction_ref
            },
            ip_address=ip_address
        )
