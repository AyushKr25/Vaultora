import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Customer Pages
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import Transfer from './pages/Transfer';
import History from './pages/History';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAccounts from './pages/admin/AdminAccounts';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLogs from './pages/admin/AdminLogs';

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <CurrencyProvider>
                    <Router>
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                duration: 4000,
                                style: {
                                    background: 'var(--toast-bg)',
                                    color: 'var(--toast-color)',
                                },
                            }}
                        />
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />

                            {/* Protected Customer Routes */}
                            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
                            <Route path="/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
                            <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
                            <Route path="/transfer" element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
                            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                            {/* Protected Admin Routes */}
                            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                            <Route path="/admin/accounts" element={<AdminRoute><AdminAccounts /></AdminRoute>} />
                            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                            <Route path="/admin/logs" element={<AdminRoute><AdminLogs /></AdminRoute>} />

                            {/* Catch all */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Router>
                </CurrencyProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
