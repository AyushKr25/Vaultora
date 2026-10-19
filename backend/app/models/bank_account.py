"""
Bank Account Model
"""
from datetime import datetime
import random
import string
from ..extensions import db


class BankAccount(db.Model):
    """Bank account model for managing customer accounts."""
    
    __tablename__ = 'bank_accounts'
    
    id = db.Column(db.Integer, primary_key=True)
    account_number = db.Column(db.String(20), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    account_type = db.Column(db.Enum('savings', 'checking', 'business'), default='savings')
    balance = db.Column(db.Numeric(15, 2), default=0.00)
    currency = db.Column(db.String(3), default='USD')
    is_frozen = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    pin_hash = db.Column(db.String(255))
    daily_limit = db.Column(db.Numeric(15, 2), default=10000.00)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', back_populates='bank_accounts')
    transactions = db.relationship('Transaction', back_populates='account', 
                                   foreign_keys='Transaction.account_id',
                                   lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<BankAccount {self.account_number}>'
    
    @staticmethod
    def generate_account_number():
        """Generate a unique account number."""
        while True:
            prefix = 'ACC'
            date_part = datetime.now().strftime('%Y%m')
            random_part = ''.join(random.choices(string.digits, k=6))
            account_number = f'{prefix}{date_part}{random_part}'
            
            if not BankAccount.query.filter_by(account_number=account_number).first():
                return account_number
    
    def to_dict(self, include_transactions=False):
        """Convert account to dictionary."""
        data = {
            'id': self.id,
            'accountNumber': self.account_number,
            'userId': self.user_id,
            'accountType': self.account_type,
            'balance': float(self.balance),
            'currency': self.currency,
            'isFrozen': self.is_frozen,
            'isActive': self.is_active,
            'dailyLimit': float(self.daily_limit),
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_transactions:
            data['transactions'] = [t.to_dict() for t in self.transactions.order_by(
                db.desc('created_at')).limit(10)]
        
        return data
    
    def can_withdraw(self, amount):
        """Check if withdrawal is allowed."""
        if self.is_frozen:
            return False, 'Account is frozen'
        if not self.is_active:
            return False, 'Account is inactive'
        if float(self.balance) < float(amount):
            return False, 'Insufficient balance'
        return True, 'OK'
    
    def can_deposit(self):
        """Check if deposit is allowed."""
        if self.is_frozen:
            return False, 'Account is frozen'
        if not self.is_active:
            return False, 'Account is inactive'
        return True, 'OK'
