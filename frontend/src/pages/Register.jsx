import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiEnvelope, HiLockClosed, HiUser, HiPhone, HiBuildingLibrary } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Input from '../components/Input';
import Button from '../components/Button';

const Register = () => {
    const navigate = useNavigate();
    const { register, isAuthenticated } = useAuth();
    const { isDark } = useTheme();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});

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

        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])/.test(formData.password)) {
            newErrors.password = 'Password must include uppercase, lowercase, number, and special character';
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        const result = await register({
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password
        });
        setLoading(false);

        if (result.success) {
            navigate('/');
        }
    };

    return (
        <div className={`min-h-screen flex ${isDark ? 'dark' : ''}`}>
            {/* Left side - Form */}
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
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">
                                Start your banking journey today
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="First Name"
                                    name="firstName"
                                    icon={HiUser}
                                    placeholder="John"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    error={errors.firstName}
                                />
                                <Input
                                    label="Last Name"
                                    name="lastName"
                                    icon={HiUser}
                                    placeholder="Doe"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    error={errors.lastName}
                                />
                            </div>

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
                                label="Phone Number"
                                name="phone"
                                type="tel"
                                icon={HiPhone}
                                placeholder="+1 (555) 000-0000"
                                value={formData.phone}
                                onChange={handleChange}
                                error={errors.phone}
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

                            <Input
                                label="Confirm Password"
                                name="confirmPassword"
                                type="password"
                                icon={HiLockClosed}
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                error={errors.confirmPassword}
                            />

                            <div className="flex items-start gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    required
                                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-gray-600 dark:text-gray-400">
                                    I agree to the{' '}
                                    <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>
                                    {' '}and{' '}
                                    <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a>
                                </span>
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                loading={loading}
                            >
                                Create Account
                            </Button>
                        </form>

                        <p className="text-center text-gray-600 dark:text-gray-400 mt-6">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Right side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 gradient-secondary relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
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
                            Join Our Banking Family
                        </h2>
                        <p className="text-lg text-white/80 max-w-md">
                            Open an account in minutes and enjoy secure, fast, and convenient banking services from anywhere.
                        </p>

                        <div className="mt-8 space-y-4">
                            {[
                                'Free account maintenance',
                                'Instant money transfers',
                                '24/7 customer support',
                                'Advanced security features'
                            ].map((feature, i) => (
                                <motion.div
                                    key={feature}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                        <span className="text-sm">✓</span>
                                    </div>
                                    <span>{feature}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
                </div>
            </div>
        </div>
    );
};

export default Register;
