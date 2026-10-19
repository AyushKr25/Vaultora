"""
Transaction Model
"""
from datetime import datetime
import random
import string
from ..extensions import db


class Transaction(db.Model):
    """Transaction model for tracking deposits and withdrawals."""
    
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    transaction_ref = db.Column(db.String(50), unique=True, nullable=False, index=True)
    account_id = db.Column(db.Integer, db.ForeignKey('bank_accounts.id', ondelete='CASCADE'), nullable=False)
    transaction_type = db.Column(db.Enum('deposit', 'withdrawal', 'transfer_in', 'transfer_out'), nullable=False)
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    balance_before = db.Column(db.Numeric(15, 2), nullable=False)
    balance_after = db.Column(db.Numeric(15, 2), nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.Enum('pending', 'completed', 'failed', 'reversed'), default='completed')
    related_account_id = db.Column(db.Integer, db.ForeignKey('bank_accounts.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    account = db.relationship('BankAccount', back_populates='transactions', 
                              foreign_keys=[account_id])
    related_account = db.relationship('BankAccount', foreign_keys=[related_account_id])
    
    def __repr__(self):
        return f'<Transaction {self.transaction_ref}>'
    
    @staticmethod
    def generate_reference():
        """Generate a unique transaction reference."""
        prefix = 'TXN'
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        random_part = ''.join(random.choices(string.digits, k=4))
        return f'{prefix}{timestamp}{random_part}'
    
    def to_dict(self):
        """Convert transaction to dictionary."""
        return {
            'id': self.id,
            'transactionRef': self.transaction_ref,
            'accountId': self.account_id,
            'transactionType': self.transaction_type,
            'amount': float(self.amount),
            'balanceBefore': float(self.balance_before),
            'balanceAfter': float(self.balance_after),
            'description': self.description,
            'status': self.status,
            'relatedAccountId': self.related_account_id,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def create_deposit(cls, account, amount, description=None):
        """Create a deposit transaction."""
        balance_before = float(account.balance)
        balance_after = balance_before + float(amount)
        
        transaction = cls(
            transaction_ref=cls.generate_reference(),
            account_id=account.id,
            transaction_type='deposit',
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            description=description or 'Deposit',
            status='completed'
        )
        
        account.balance = balance_after
        db.session.add(transaction)
        db.session.commit()
        
        return transaction
    
    @classmethod
    def create_withdrawal(cls, account, amount, description=None):
        """Create a withdrawal transaction."""
        balance_before = float(account.balance)
        balance_after = balance_before - float(amount)
        
        transaction = cls(
            transaction_ref=cls.generate_reference(),
            account_id=account.id,
            transaction_type='withdrawal',
            amount=amount,
            balance_before=balance_before,
            balance_after=balance_after,
            description=description or 'Withdrawal',
            status='completed'
        )
        
        account.balance = balance_after
        db.session.add(transaction)
        db.session.commit()
        
        return transaction
