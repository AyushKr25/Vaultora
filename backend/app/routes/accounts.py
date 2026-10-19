"""
Bank Account Routes
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import User, BankAccount, AuditLog

accounts_bp = Blueprint('accounts', __name__)


def get_current_user():
    """Get current authenticated user."""
    user_id = int(get_jwt_identity())
    return User.query.get(user_id)


@accounts_bp.route('', methods=['GET'])
@jwt_required()
def get_accounts():
    """Get all accounts for current user."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    accounts = [acc.to_dict() for acc in user.bank_accounts]
    
    return jsonify({
        'accounts': accounts,
        'total': len(accounts)
    })


@accounts_bp.route('', methods=['POST'])
@jwt_required()
def create_account():
    """Create a new bank account."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    account_type = data.get('accountType', 'savings')
    
    # Validate account type
    valid_types = ['savings', 'checking', 'business']
    if account_type not in valid_types:
        return jsonify({'error': f'Invalid account type. Must be one of: {valid_types}'}), 400
    
    # Check account limit (max 5 accounts per user)
    if user.bank_accounts.count() >= 5:
        return jsonify({'error': 'Maximum account limit reached (5 accounts)'}), 400
    
    # Create account
    account = BankAccount(
        account_number=BankAccount.generate_account_number(),
        user_id=user.id,
        account_type=account_type,
        balance=0.00,
        daily_limit=data.get('dailyLimit', 10000.00)
    )
    
    try:
        db.session.add(account)
        db.session.commit()
        
        # Log account creation
        AuditLog.log(
            action='ACCOUNT_CREATED',
            user_id=user.id,
            entity_type='bank_account',
            entity_id=account.id,
            new_values={
                'account_number': account.account_number,
                'type': account_type
            },
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'message': 'Account created successfully',
            'account': account.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create account'}), 500


@accounts_bp.route('/<int:account_id>', methods=['GET'])
@jwt_required()
def get_account(account_id):
    """Get account by ID."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    account = BankAccount.query.get(account_id)
    
    if not account:
        return jsonify({'error': 'Account not found'}), 404
    
    # Check ownership (unless admin)
    if account.user_id != user.id and not user.is_admin:
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify({
        'account': account.to_dict(include_transactions=True)
    })


@accounts_bp.route('/<int:account_id>', methods=['PUT'])
@jwt_required()
def update_account(account_id):
    """Update account settings."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    account = BankAccount.query.get(account_id)
    
    if not account:
        return jsonify({'error': 'Account not found'}), 404
    
    # Check ownership
    if account.user_id != user.id and not user.is_admin:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    
    # Update allowed fields
    if 'dailyLimit' in data:
        daily_limit = float(data['dailyLimit'])
        if daily_limit < 100 or daily_limit > 100000:
            return jsonify({'error': 'Daily limit must be between 100 and 100,000'}), 400
        account.daily_limit = daily_limit
    
    try:
        db.session.commit()
        
        return jsonify({
            'message': 'Account updated successfully',
            'account': account.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update account'}), 500


@accounts_bp.route('/<int:account_id>/balance', methods=['GET'])
@jwt_required()
def get_balance(account_id):
    """Get account balance."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    account = BankAccount.query.get(account_id)
    
    if not account:
        return jsonify({'error': 'Account not found'}), 404
    
    # Check ownership
    if account.user_id != user.id and not user.is_admin:
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify({
        'accountNumber': account.account_number,
        'balance': float(account.balance),
        'currency': account.currency,
        'isFrozen': account.is_frozen
    })


@accounts_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_accounts_summary():
    """Get summary of all user accounts."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    accounts = user.bank_accounts.all()
    
    total_balance = sum(float(acc.balance) for acc in accounts)
    
    summary = {
        'totalAccounts': len(accounts),
        'totalBalance': total_balance,
        'currency': 'USD',
        'accounts': [
            {
                'id': acc.id,
                'accountNumber': acc.account_number,
                'type': acc.account_type,
                'balance': float(acc.balance),
                'isFrozen': acc.is_frozen
            }
            for acc in accounts
        ]
    }
    
    return jsonify(summary)
