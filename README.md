# 🏦 SecureBank - Banking Management System

A modern, full-featured banking management system with a beautiful user interface, real-time notifications, and comprehensive account management features.

![SecureBank](https://img.shields.io/badge/SecureBank-v1.0.0-blue)
![Python](https://img.shields.io/badge/Python-3.10+-green)
![React](https://img.shields.io/badge/React-18.2-blue)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)

## ✨ Features

### 👤 User Management
- **User Registration & Login** - Secure authentication with JWT tokens
- **Profile Management** - Update personal info (name, phone, address, date of birth)
- **Password Change** - Securely update password with validation
- **Role-based Access** - Admin and Customer roles

### 💳 Account Management
- **Multiple Account Types** - Savings, Checking, Business accounts
- **Account Creation** - Create new bank accounts instantly
- **Balance Visibility Toggle** - Show/hide balances for privacy
- **Daily Transaction Limits** - Security limits on withdrawals

### 💰 Transactions
- **Deposits** - Add funds to any account
- **Withdrawals** - Withdraw with sufficient balance check
- **Transfers** - Transfer between accounts (yours or others)
- **Transaction History** - Complete transaction log with filters

### 🔔 Real-Time Notifications
- **Instant Alerts** - Get notified for deposits, withdrawals, transfers
- **Notification Center** - View all notifications with read/unread status
- **Auto-polling** - Real-time updates every 30 seconds

### ⚙️ Settings & Preferences
- **Currency Settings** - Choose from USD, EUR, GBP, INR, JPY (app-wide)
- **Language Preferences** - Select preferred language
- **Timezone Selection** - Set your timezone
- **Theme Toggle** - Dark/Light mode support
- **Notification Preferences** - Customize notifications

### 🛡️ Admin Dashboard
- **User Management** - View, activate/deactivate users
- **Account Overview** - Monitor all bank accounts
- **Transaction Logs** - View all system transactions
- **Audit Logs** - Complete activity audit trail

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Database Setup

1. Create MySQL database:
```sql
CREATE DATABASE bank_management_system;
```

2. Run the setup script:
```bash
cd database
mysql -u root -p bank_management_system < setup_database.sql
```

### Backend Setup

1. Navigate to backend:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment:
```bash
copy .env.example .env
# Edit .env with your MySQL credentials
```

5. Run the server:
```bash
python run.py
```

Backend will run at: `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev -- --host
```

Frontend will run at: `http://localhost:5173`

## 🔐 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bank.com | Password@123 |

## 📁 Project Structure

```
bank-app/
├── backend/
│   ├── app/
│   │   ├── models/          # Database models
│   │   ├── routes/          # API endpoints
│   │   └── utils/           # Utilities
│   ├── run.py              # Server entry point
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React contexts (Auth, Theme, Currency)
│   │   ├── pages/           # Page components
│   │   └── services/        # API services
│   └── package.json
│
└── database/
    ├── setup_database.sql   # Schema setup
    ├── seed.sql             # Sample data
    └── triggers.sql         # Database triggers
```

## 🛠️ Tech Stack

### Backend
- **Flask** - Python web framework
- **Flask-JWT-Extended** - JWT authentication
- **SQLAlchemy** - ORM for database
- **Flask-CORS** - Cross-origin resource sharing
- **MySQL** - Database

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Chart.js** - Data visualization
- **React Router** - Navigation
- **React Hot Toast** - Notifications

## 📱 Screenshots

### Dashboard
The main dashboard shows account summary, recent transactions, and quick action buttons.

### Accounts Page
View all your bank accounts with beautiful card designs showing balance and account type.

### Transaction History
Complete transaction history with filtering by account, type, and date range.

### Settings
Customize your preferences including currency, language, timezone, and notification settings.

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Input validation and sanitization
- SQL injection prevention (SQLAlchemy ORM)

## 📄 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Accounts
- `GET /api/accounts` - Get all user accounts
- `POST /api/accounts` - Create new account
- `GET /api/accounts/summary` - Get account summary

### Transactions
- `POST /api/transactions/deposit` - Make a deposit
- `POST /api/transactions/withdraw` - Make a withdrawal
- `POST /api/transactions/transfer` - Transfer funds
- `GET /api/transactions/history` - Get transaction history

### Notifications
- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### Users
- `PUT /api/users/profile` - Update profile
- `GET /api/users/preferences` - Get preferences
- `PUT /api/users/preferences` - Update preferences

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Created with ❤️ for educational purposes.

---

**Note:** This application is for educational/demonstration purposes only. Do not use for actual banking operations.
