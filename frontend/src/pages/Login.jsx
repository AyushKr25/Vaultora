import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiEnvelope, HiLockClosed, HiBuildingLibrary } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Input from '../components/Input';
import Button from '../components/Button';

const Login = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();
    const { isDark } = useTheme();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});

    // Redirect if already authenticated
    if (isAuthenticated) {
        navigate('/');
        return null;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        const result = await login(formData.email, formData.password);
        setLoading(false);

        if (result.success) {
            navigate(result.user.role?.name === 'admin' ? '/admin' : '/');
        }
    };

    return (
        <div className={`min-h-screen flex ${isDark ? 'dark' : ''}`}>
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                                <HiBuildingLibrary className="w-10 h-10" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold">SecureBank</h1>
                                <p className="text-white/80">Modern Banking Experience</p>
                            </div>
                        </div>
                        <h2 className="text-3xl font-semibold mb-4">
                            Welcome Back
                        </h2>
                        <p className="text-lg text-white/80 max-w-md">
                            Access your accounts, manage transactions, and track your financial goals with our secure banking platform.
                        </p>
                    </motion.div>

                    {/* Decorative elements */}
                    <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
                </div>
            </div>

            {/* Right side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-dark-900">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                                <HiBuildingLibrary className="w-7 h-7 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">SecureBank</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-dark-700">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sign In</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                Enter your credentials to access your account
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <Input
                                label="Email Address"
                                name="email"
                                type="email"
                                icon={HiEnvelope}
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                error={errors.email}
                            />

                            <Input
                                label="Password"
                                name="password"
                                type="password"
                                icon={HiLockClosed}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                error={errors.password}
                            />

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                    Remember me
                                </label>
                                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                                    Forgot password?
                                </a>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                loading={loading}
                            >
                                Sign In
                            </Button>
                        </form>

                        <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                                Create Account
                            </Link>
                        </p>
                    </div>

                    {/* Demo credentials */}
                    <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
                        <p className="text-sm font-medium text-primary-800 dark:text-primary-200 mb-2">Demo Credentials:</p>
                        <p className="text-xs text-primary-700 dark:text-primary-300">
                            <strong>Admin:</strong> admin@bank.com / Password@123<br />
                            <strong>Customer:</strong> john.doe@email.com / Password@123
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
