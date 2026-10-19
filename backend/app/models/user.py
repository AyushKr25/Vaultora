"""
User Model
"""
from datetime import datetime
import bcrypt
from ..extensions import db


class User(db.Model):
    """User model for authentication and profile."""
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    date_of_birth = db.Column(db.Date)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False, default=2)
    is_active = db.Column(db.Boolean, default=True)
    email_verified = db.Column(db.Boolean, default=False)
    last_login = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # User preferences
    preferred_currency = db.Column(db.String(10), default='USD')
    preferred_language = db.Column(db.String(10), default='en')
    preferred_timezone = db.Column(db.String(20), default='UTC-5')
    
    # Password tracking
    password_changed_at = db.Column(db.DateTime, nullable=True)
    
    # Plain password for demo/educational purposes (NOT for production)
    plain_password = db.Column(db.String(255), nullable=True)
    
    # Relationships
    role = db.relationship('Role', back_populates='users')
    bank_accounts = db.relationship('BankAccount', back_populates='user', lazy='dynamic', cascade='all, delete-orphan')
    audit_logs = db.relationship('AuditLog', back_populates='user', lazy='dynamic')
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def set_password(self, password):
        """Hash and set password."""
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        self.password_hash = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
        # Store plain password for demo/educational purposes (NOT for production)
        self.plain_password = password
        # Track when password was changed
        self.password_changed_at = datetime.utcnow()
    
    def check_password(self, password):
        """Verify password."""
        password_bytes = password.encode('utf-8')
        hash_bytes = self.password_hash.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hash_bytes)
    
    @property
    def full_name(self):
        """Get full name."""
        return f'{self.first_name} {self.last_name}'
    
    @property
    def is_admin(self):
        """Check if user is admin."""
        return self.role and self.role.name == 'admin'
    
    def to_dict(self, include_accounts=False):
        """Convert user to dictionary."""
        data = {
            'id': self.id,
            'email': self.email,
            'firstName': self.first_name,
            'lastName': self.last_name,
            'fullName': self.full_name,
            'phone': self.phone,
            'address': self.address,
            'dateOfBirth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'role': self.role.to_dict() if self.role else None,
            'isActive': self.is_active,
            'emailVerified': self.email_verified,
            'lastLogin': self.last_login.isoformat() if self.last_login else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'passwordChangedAt': self.password_changed_at.isoformat() if self.password_changed_at else None
        }
        
        if include_accounts:
            data['accounts'] = [acc.to_dict() for acc in self.bank_accounts]
        
        return data
    
    def update_last_login(self):
        """Update last login timestamp."""
        self.last_login = datetime.utcnow()
        db.session.commit()
