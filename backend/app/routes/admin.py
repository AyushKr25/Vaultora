"""
Admin Routes
"""
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import desc, func, and_
from functools import wraps
from ..extensions import db
from ..models import User, Role, BankAccount, Transaction, AuditLog

admin_bp = Blueprint('admin', __name__)


def admin_required(fn):
    """Decorator to require admin role."""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            return jsonify({'error': 'Admin access required'}), 403
        
        return fn(*args, **kwargs)
    return wrapper


@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def dashboard():
    """Get admin dashboard data."""
    # Stats
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    total_accounts = BankAccount.query.filter_by(is_active=True).count()
    frozen_accounts = BankAccount.query.filter_by(is_frozen=True).count()
    
    # Total balance across all accounts
    total_balance = db.session.query(func.sum(BankAccount.balance)).scalar() or 0
    
    # Today's transactions
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_transactions = Transaction.query.filter(Transaction.created_at >= today_start).count()
    
    today_deposits = db.session.query(func.sum(Transaction.amount)).filter(
        and_(
            Transaction.created_at >= today_start,
            Transaction.transaction_type == 'deposit'
        )
    ).scalar() or 0
    
    today_withdrawals = db.session.query(func.sum(Transaction.amount)).filter(
        and_(
            Transaction.created_at >= today_start,
            Transaction.transaction_type == 'withdrawal'
        )
    ).scalar() or 0
    
    today_volume = float(today_deposits) + float(today_withdrawals)
    
    # Recent transactions
    recent_transactions = Transaction.query.order_by(
        desc(Transaction.created_at)
    ).limit(10).all()
    
    # Chart data - last 7 days
    chart_labels = []
    chart_deposits = []
    chart_withdrawals = []
    for i in range(6, -1, -1):
        day = datetime.utcnow() - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        chart_labels.append(day_start.strftime('%b %d'))
        
        dep = db.session.query(func.sum(Transaction.amount)).filter(
            and_(
                Transaction.created_at >= day_start,
                Transaction.created_at < day_end,
                Transaction.transaction_type == 'deposit'
            )
        ).scalar() or 0
        
        wth = db.session.query(func.sum(Transaction.amount)).filter(
            and_(
                Transaction.created_at >= day_start,
                Transaction.created_at < day_end,
                Transaction.transaction_type == 'withdrawal'
            )
        ).scalar() or 0
        
        chart_deposits.append(float(dep))
        chart_withdrawals.append(float(wth))
    
    # Account type distribution
    savings_count = BankAccount.query.filter_by(account_type='savings', is_active=True).count()
    checking_count = BankAccount.query.filter_by(account_type='checking', is_active=True).count()
    business_count = BankAccount.query.filter_by(account_type='business', is_active=True).count()
    
    # Pending email verifications
    pending_verifications = User.query.filter_by(email_verified=False, is_active=True).count()
    
    return jsonify({
        'totalUsers': total_users,
        'activeUsers': active_users,
        'totalAccounts': total_accounts,
        'frozenAccounts': frozen_accounts,
        'totalBalance': float(total_balance),
        'todayTransactions': today_transactions,
        'todayVolume': today_volume,
        'todayDeposits': float(today_deposits),
        'todayWithdrawals': float(today_withdrawals),
        'pendingVerifications': pending_verifications,
        'chartData': {
            'labels': chart_labels,
            'deposits': chart_deposits,
            'withdrawals': chart_withdrawals
        },
        'accountsByType': {
            'savings': savings_count,
            'checking': checking_count,
            'business': business_count
        },
        'recentTransactions': [t.to_dict() for t in recent_transactions]
    })


@admin_bp.route('/accounts', methods=['GET'])
@admin_required
def get_all_accounts():
    """Get all bank accounts with filtering."""
    # Query parameters
    search = request.args.get('search', '')
    status = request.args.get('status')  # active, frozen, all
    account_type = request.args.get('type')
    sort_by = request.args.get('sortBy', 'created_at')
    sort_order = request.args.get('sortOrder', 'desc')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('perPage', 20, type=int)
    
    per_page = min(per_page, 100)
    
    # Build query
    query = BankAccount.query.join(User)
    
    # Search
    if search:
        search_term = f'%{search}%'
        query = query.filter(
            db.or_(
                BankAccount.account_number.ilike(search_term),
                User.email.ilike(search_term),
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term)
            )
        )
    
    # Status filter
    if status == 'frozen':
        query = query.filter(BankAccount.is_frozen == True)
    elif status == 'active':
        query = query.filter(BankAccount.is_frozen == False, BankAccount.is_active == True)
    
    # Type filter
    if account_type:
        query = query.filter(BankAccount.account_type == account_type)
    
    # Sorting
    sort_column = getattr(BankAccount, sort_by, BankAccount.created_at)
    if sort_order == 'desc':
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(sort_column)
    
    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    accounts_data = []
    for account in pagination.items:
        acc_dict = account.to_dict()
        acc_dict['user'] = {
            'id': account.user.id,
            'email': account.user.email,
            'fullName': account.user.full_name
        }
        accounts_data.append(acc_dict)
    
    return jsonify({
        'accounts': accounts_data,
        'pagination': {
            'page': page,
            'perPage': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'hasNext': pagination.has_next,
            'hasPrev': pagination.has_prev
        }
    })


@admin_bp.route('/accounts/<int:account_id>/freeze', methods=['POST'])
@admin_required
def freeze_account(account_id):
    """Freeze a bank account."""
    user_id = get_jwt_identity()
    account = BankAccount.query.get(account_id)
    
    if not account:
        return jsonify({'error': 'Account not found'}), 404
    
    data = request.get_json() or {}
    reason = data.get('reason', 'Admin action')
    
    account.is_frozen = True
    db.session.commit()
    
    AuditLog.log(
        action='ACCOUNT_FROZEN',
        user_id=user_id,
        entity_type='bank_account',
        entity_id=account_id,
        new_values={'reason': reason},
        ip_address=request.remote_addr
    )
    
    return jsonify({
        'message': 'Account frozen successfully',
        'account': account.to_dict()
    })


@admin_bp.route('/accounts/<int:account_id>/unfreeze', methods=['POST'])
@admin_required
def unfreeze_account(account_id):
    """Unfreeze a bank account."""
    user_id = get_jwt_identity()
    account = BankAccount.query.get(account_id)
    
    if not account:
        return jsonify({'error': 'Account not found'}), 404
    
    account.is_frozen = False
    db.session.commit()
    
    AuditLog.log(
        action='ACCOUNT_UNFROZEN',
        user_id=user_id,
        entity_type='bank_account',
        entity_id=account_id,
        ip_address=request.remote_addr
    )
    
    return jsonify({
        'message': 'Account unfrozen successfully',
        'account': account.to_dict()
    })


@admin_bp.route('/accounts/<int:account_id>', methods=['DELETE'])
@admin_required
def delete_account(account_id):
    """Delete a bank account."""
    user_id = get_jwt_identity()
    account = BankAccount.query.get(account_id)
    
    if not account:
        return jsonify({'error': 'Account not found'}), 404
    
    if float(account.balance) > 0:
        return jsonify({'error': 'Cannot delete account with positive balance'}), 400
    
    account_number = account.account_number
    db.session.delete(account)
    db.session.commit()
    
    AuditLog.log(
        action='ACCOUNT_DELETED',
        user_id=user_id,
        entity_type='bank_account',
        entity_id=account_id,
        old_values={'account_number': account_number},
        ip_address=request.remote_addr
    )
    
    return jsonify({'message': 'Account deleted successfully'})


@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users():
    """Get all users with filtering."""
    search = request.args.get('search', '')
    role = request.args.get('role')
    status = request.args.get('status')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('perPage', 20, type=int)
    
    per_page = min(per_page, 100)
    
    query = User.query.join(Role)
    
    if search:
        search_term = f'%{search}%'
        query = query.filter(
            db.or_(
                User.email.ilike(search_term),
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term)
            )
        )
    
    if role:
        query = query.filter(Role.name == role)
    
    if status == 'active':
        query = query.filter(User.is_active == True)
    elif status == 'inactive':
        query = query.filter(User.is_active == False)
    
    query = query.order_by(desc(User.created_at))
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'users': [u.to_dict() for u in pagination.items],
        'pagination': {
            'page': page,
            'perPage': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'hasNext': pagination.has_next,
            'hasPrev': pagination.has_prev
        }
    })


@admin_bp.route('/users/<int:user_id>/deactivate', methods=['POST'])
@admin_required
def deactivate_user(user_id):
    """Deactivate a user account."""
    admin_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.is_admin:
        return jsonify({'error': 'Cannot deactivate admin user'}), 400
    
    user.is_active = False
    db.session.commit()
    
    AuditLog.log(
        action='USER_DEACTIVATED',
        user_id=admin_id,
        entity_type='user',
        entity_id=user_id,
        ip_address=request.remote_addr
    )
    
    return jsonify({'message': 'User deactivated successfully'})


@admin_bp.route('/users/<int:user_id>/activate', methods=['POST'])
@admin_required
def activate_user(user_id):
    """Activate a user account."""
    admin_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.is_active = True
    db.session.commit()
    
    AuditLog.log(
        action='USER_ACTIVATED',
        user_id=admin_id,
        entity_type='user',
        entity_id=user_id,
        ip_address=request.remote_addr
    )
    
    return jsonify({'message': 'User activated successfully'})


@admin_bp.route('/logs', methods=['GET'])
@admin_required
def get_audit_logs():
    """Get audit logs."""
    action = request.args.get('action')
    entity_type = request.args.get('entityType')
    user_id = request.args.get('userId', type=int)
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('perPage', 50, type=int)
    
    per_page = min(per_page, 100)
    
    query = AuditLog.query
    
    if action:
        query = query.filter(AuditLog.action.ilike(f'%{action}%'))
    
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    
    if start_date:
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(AuditLog.created_at >= start)
        except ValueError:
            pass
    
    if end_date:
        try:
            end = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
            query = query.filter(AuditLog.created_at < end)
        except ValueError:
            pass
    
    query = query.order_by(desc(AuditLog.created_at))
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'logs': [log.to_dict() for log in pagination.items],
        'pagination': {
            'page': page,
            'perPage': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'hasNext': pagination.has_next,
            'hasPrev': pagination.has_prev
        }
    })


@admin_bp.route('/analytics', methods=['GET'])
@admin_required
def get_analytics():
    """Get system-wide analytics."""
    days = request.args.get('days', 30, type=int)
    days = min(days, 365)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Daily transaction data
    transactions = Transaction.query.filter(Transaction.created_at >= start_date).all()
    
    daily_data = {}
    for t in transactions:
        date_key = t.created_at.strftime('%Y-%m-%d')
        if date_key not in daily_data:
            daily_data[date_key] = {'deposits': 0, 'withdrawals': 0, 'count': 0}
        
        daily_data[date_key]['count'] += 1
        if t.transaction_type in ['deposit', 'transfer_in']:
            daily_data[date_key]['deposits'] += float(t.amount)
        else:
            daily_data[date_key]['withdrawals'] += float(t.amount)
    
    sorted_dates = sorted(daily_data.keys())
    
    # Account type distribution
    account_types = db.session.query(
        BankAccount.account_type,
        func.count(BankAccount.id)
    ).group_by(BankAccount.account_type).all()
    
    # New registrations per day
    new_users = db.session.query(
        func.date(User.created_at).label('date'),
        func.count(User.id).label('count')
    ).filter(User.created_at >= start_date).group_by(
        func.date(User.created_at)
    ).all()
    
    return jsonify({
        'transactionTrends': {
            'labels': sorted_dates,
            'deposits': [daily_data[d]['deposits'] for d in sorted_dates],
            'withdrawals': [daily_data[d]['withdrawals'] for d in sorted_dates],
            'counts': [daily_data[d]['count'] for d in sorted_dates]
        },
        'accountTypeDistribution': {
            'labels': [t[0] for t in account_types],
            'data': [t[1] for t in account_types]
        },
        'userRegistrations': {
            'labels': [str(u.date) for u in new_users],
            'data': [u.count for u in new_users]
        }
    })
