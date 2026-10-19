"""
Role Model
"""
from datetime import datetime
from ..extensions import db


class Role(db.Model):
    """Role model for user permissions."""
    
    __tablename__ = 'roles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    users = db.relationship('User', back_populates='role', lazy='dynamic')
    
    def __repr__(self):
        return f'<Role {self.name}>'
    
    def to_dict(self):
        """Convert role to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description
        }
    
    @staticmethod
    def get_admin_role():
        """Get admin role."""
        return Role.query.filter_by(name='admin').first()
    
    @staticmethod
    def get_customer_role():
        """Get customer role."""
        return Role.query.filter_by(name='customer').first()
