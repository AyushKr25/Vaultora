"""
Transaction Routes
"""
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import desc, and_
from ..extensions import db
from ..models import User, BankAccount, Transaction, AuditLog, Notification
from io import BytesIO

transactions_bp = Blueprint('transactions', __name__)


def get_current_user():
    """Get current authenticated user."""
    user_id = int(get_jwt_identity())
    return User.query.get(user_id)


@transactions_bp.route('/deposit', methods=['POST'])
@jwt_required()
def deposit():
    """Deposit money into an account."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    account_id = data.get('accountId')
    amount = data.get('amount')
    description = data.get('description', 'Deposit')
    
    # Validate input
    if not account_id:
        return jsonify({'error': 'Account ID is required'}), 400
    
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid amount'}), 400
    
    if amount <= 0:
        return jsonify({'error': 'Amount must be greater than 0'}), 400
    
    if amount > 1000000:
        return jsonify({'error': 'Maximum deposit amount is $1,000,000'}), 400
    
    # Get account
    account = BankAccount.query.get(account_id)
    if not account:
        return jsonify({'error': 'Account not found'}), 404
    
    # Check ownership
    if account.user_id != user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Check if deposit is allowed
    can_deposit, message = account.can_deposit()
    if not can_deposit:
        return jsonify({'error': message}), 400
    
    try:
        # Create transaction
        transaction = Transaction.create_deposit(account, amount, description)
        
        # Log transaction
        AuditLog.log_transaction(user.id, transaction, request.remote_addr)
        
        # Create notification
        Notification.create_transaction_notification(
            user.id, 'deposit', amount, account.account_number
        )
        
        return jsonify({
            'message': f'Successfully deposited ${amount:.2f}',
            'transaction': transaction.to_dict(),
            'newBalance': float(account.balance)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Deposit failed'}), 500


@transactions_bp.route('/withdraw', methods=['POST'])
@jwt_required()
def withdraw():
    """Withdraw money from an account."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    account_id = data.get('accountId')
    amount = data.get('amount')
    description = data.get('description', 'Withdrawal')
    
    # Validate input
    if not account_id:
        return jsonify({'error': 'Account ID is required'}), 400
    
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid amount'}), 400
    
    if amount <= 0:
        return jsonify({'error': 'Amount must be greater than 0'}), 400
    
    # Get account
    account = BankAccount.query.get(account_id)
    if not account:
        return jsonify({'error': 'Account not found'}), 404
    
    # Check ownership
    if account.user_id != user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Check if withdrawal is allowed
    can_withdraw, message = account.can_withdraw(amount)
    if not can_withdraw:
        return jsonify({'error': message}), 400
    
    # Check daily limit
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_withdrawn = db.session.query(db.func.sum(Transaction.amount)).filter(
        and_(
            Transaction.account_id == account_id,
            Transaction.transaction_type.in_(['withdrawal', 'transfer_out']),
            Transaction.created_at >= today_start
        )
    ).scalar() or 0
    
    if float(today_withdrawn) + amount > float(account.daily_limit):
        remaining = float(account.daily_limit) - float(today_withdrawn)
        return jsonify({
            'error': f'Daily limit exceeded. Remaining today: ${remaining:.2f}'
        }), 400
    
    try:
        # Create transaction
        transaction = Transaction.create_withdrawal(account, amount, description)
        
        # Log transaction
        AuditLog.log_transaction(user.id, transaction, request.remote_addr)
        
        # Create notification
        Notification.create_transaction_notification(
            user.id, 'withdrawal', amount, account.account_number
        )
        
        return jsonify({
            'message': f'Successfully withdrew ${amount:.2f}',
            'transaction': transaction.to_dict(),
            'newBalance': float(account.balance)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Withdrawal failed'}), 500


@transactions_bp.route('/transfer', methods=['POST'])
@jwt_required()
def transfer():
    """Transfer money between accounts."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    from_account_id = data.get('fromAccountId')
    to_account_number = data.get('toAccountNumber')
    amount = data.get('amount')
    description = data.get('description', 'Transfer')
    
    # Validate input
    if not from_account_id or not to_account_number:
        return jsonify({'error': 'Source and destination accounts are required'}), 400
    
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid amount'}), 400
    
    if amount <= 0:
        return jsonify({'error': 'Amount must be greater than 0'}), 400
    
    # Get source account
    from_account = BankAccount.query.get(from_account_id)
    if not from_account:
        return jsonify({'error': 'Source account not found'}), 404
    
    # Check ownership
    if from_account.user_id != user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get destination account
    to_account = BankAccount.query.filter_by(account_number=to_account_number).first()
    if not to_account:
        return jsonify({'error': 'Destination account not found'}), 404
    
    if from_account.id == to_account.id:
        return jsonify({'error': 'Cannot transfer to the same account'}), 400
    
    # Check if transfer is allowed
    can_withdraw, message = from_account.can_withdraw(amount)
    if not can_withdraw:
        return jsonify({'error': message}), 400
    
    can_deposit, message = to_account.can_deposit()
    if not can_deposit:
        return jsonify({'error': f'Destination account: {message}'}), 400
    
    try:
        # Create outgoing transaction
        ref = Transaction.generate_reference()
        
        from_balance_before = float(from_account.balance)
        to_balance_before = float(to_account.balance)
        
        from_account.balance = from_balance_before - amount
        to_account.balance = to_balance_before + amount
        
        # Outgoing transaction
        outgoing = Transaction(
            transaction_ref=ref,
            account_id=from_account.id,
            transaction_type='transfer_out',
            amount=amount,
            balance_before=from_balance_before,
            balance_after=float(from_account.balance),
            description=description,
            status='completed',
            related_account_id=to_account.id
        )
        
        # Incoming transaction
        incoming = Transaction(
            transaction_ref=f'{ref}-R',
            account_id=to_account.id,
            transaction_type='transfer_in',
            amount=amount,
            balance_before=to_balance_before,
            balance_after=float(to_account.balance),
            description=f'Transfer from {from_account.account_number}',
            status='completed',
            related_account_id=from_account.id
        )
        
        db.session.add(outgoing)
        db.session.add(incoming)
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully transferred ${amount:.2f}',
            'transaction': outgoing.to_dict(),
            'newBalance': float(from_account.balance)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Transfer failed'}), 500


@transactions_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    """Get transaction history."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Query parameters
    account_id = request.args.get('accountId', type=int)
    transaction_type = request.args.get('type')
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('perPage', 20, type=int)
    
    # Limit per_page
    per_page = min(per_page, 100)
    
    # Build query - explicitly specify join on account_id (not related_account_id)
    query = Transaction.query.join(
        BankAccount, Transaction.account_id == BankAccount.id
    ).filter(BankAccount.user_id == user.id)
    
    if account_id:
        # Verify account ownership
        account = BankAccount.query.get(account_id)
        if account and account.user_id == user.id:
            query = query.filter(Transaction.account_id == account_id)
    
    if transaction_type:
        query = query.filter(Transaction.transaction_type == transaction_type)
    
    if start_date:
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(Transaction.created_at >= start)
        except ValueError:
            pass
    
    if end_date:
        try:
            end = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
            query = query.filter(Transaction.created_at < end)
        except ValueError:
            pass
    
    # Order and paginate
    query = query.order_by(desc(Transaction.created_at))
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'transactions': [t.to_dict() for t in pagination.items],
        'pagination': {
            'page': page,
            'perPage': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'hasNext': pagination.has_next,
            'hasPrev': pagination.has_prev
        }
    })


@transactions_bp.route('/statement', methods=['GET'])
@jwt_required()
def download_statement():
    """Download transaction statement as PDF."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    account_id = request.args.get('accountId', type=int)
    start_date = request.args.get('startDate')
    end_date = request.args.get('endDate')
    
    if not account_id:
        return jsonify({'error': 'Account ID is required'}), 400
    
    # Verify account ownership
    account = BankAccount.query.get(account_id)
    if not account or account.user_id != user.id:
        return jsonify({'error': 'Account not found'}), 404
    
    # Build query
    query = Transaction.query.filter(Transaction.account_id == account_id)
    
    if start_date:
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(Transaction.created_at >= start)
        except ValueError:
            pass
    
    if end_date:
        try:
            end = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
            query = query.filter(Transaction.created_at < end)
        except ValueError:
            pass
    
    transactions = query.order_by(desc(Transaction.created_at)).all()
    
    # Generate PDF
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Header
        elements.append(Paragraph(f"Account Statement", styles['Heading1']))
        elements.append(Paragraph(f"Account: {account.account_number}", styles['Normal']))
        elements.append(Paragraph(f"Name: {user.full_name}", styles['Normal']))
        elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles['Normal']))
        elements.append(Spacer(1, 0.5 * inch))
        
        # Table data
        data = [['Date', 'Reference', 'Type', 'Amount', 'Balance']]
        for t in transactions:
            amount_str = f"+${t.amount:.2f}" if t.transaction_type in ['deposit', 'transfer_in'] else f"-${t.amount:.2f}"
            data.append([
                t.created_at.strftime('%Y-%m-%d'),
                t.transaction_ref[:15],
                t.transaction_type.replace('_', ' ').title(),
                amount_str,
                f"${t.balance_after:.2f}"
            ])
        
        # Create table
        table = Table(data, colWidths=[1.2*inch, 1.5*inch, 1.2*inch, 1*inch, 1*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a365d')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f7fafc')])
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 0.5 * inch))
        elements.append(Paragraph(f"Current Balance: ${account.balance:.2f}", styles['Heading2']))
        
        doc.build(elements)
        
        buffer.seek(0)
        response = make_response(buffer.getvalue())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=statement_{account.account_number}.pdf'
        
        return response
        
    except Exception as e:
        return jsonify({'error': 'Failed to generate statement'}), 500


@transactions_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    """Get transaction analytics for user."""
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    account_id = request.args.get('accountId', type=int)
    days = request.args.get('days', 30, type=int)
    
    # Limit days range
    days = min(days, 365)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Build base query - explicitly specify join on account_id
    query = Transaction.query.join(
        BankAccount, Transaction.account_id == BankAccount.id
    ).filter(
        BankAccount.user_id == user.id,
        Transaction.created_at >= start_date
    )
    
    if account_id:
        account = BankAccount.query.get(account_id)
        if account and account.user_id == user.id:
            query = query.filter(Transaction.account_id == account_id)
    
    transactions = query.all()
    
    # Calculate analytics
    total_deposits = sum(float(t.amount) for t in transactions if t.transaction_type in ['deposit', 'transfer_in'])
    total_withdrawals = sum(float(t.amount) for t in transactions if t.transaction_type in ['withdrawal', 'transfer_out'])
    
    # Group by date
    daily_data = {}
    for t in transactions:
        date_key = t.created_at.strftime('%Y-%m-%d')
        if date_key not in daily_data:
            daily_data[date_key] = {'deposits': 0, 'withdrawals': 0}
        
        if t.transaction_type in ['deposit', 'transfer_in']:
            daily_data[date_key]['deposits'] += float(t.amount)
        else:
            daily_data[date_key]['withdrawals'] += float(t.amount)
    
    # Sort by date
    sorted_dates = sorted(daily_data.keys())
    chart_data = {
        'labels': sorted_dates,
        'deposits': [daily_data[d]['deposits'] for d in sorted_dates],
        'withdrawals': [daily_data[d]['withdrawals'] for d in sorted_dates]
    }
    
    return jsonify({
        'summary': {
            'totalDeposits': total_deposits,
            'totalWithdrawals': total_withdrawals,
            'netFlow': total_deposits - total_withdrawals,
            'transactionCount': len(transactions)
        },
        'chartData': chart_data
    })
