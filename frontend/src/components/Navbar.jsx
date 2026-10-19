import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiBars3,
    HiMoon,
    HiSun,
    HiBell,
    HiArrowRightOnRectangle,
    HiUser,
    HiCog6Tooth
} from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ onMenuClick }) => {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-dark-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-dark-700">
            <div className="flex items-center justify-between px-4 lg:px-6 h-16">
                {/* Left side */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                    >
                        <HiBars3 className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>

                    <div className="hidden sm:block">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Welcome back, {user?.firstName}!
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date().toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2">
                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                        aria-label="Toggle theme"
                    >
                        <motion.div
                            initial={false}
                            animate={{ rotate: isDark ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {isDark ? (
                                <HiSun className="w-5 h-5 text-yellow-500" />
                            ) : (
                                <HiMoon className="w-5 h-5 text-gray-600" />
                            )}
                        </motion.div>
                    </button>

                    {/* Notifications */}
                    <button
                        onClick={() => navigate('/notifications')}
                        className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                    >
                        <HiBell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* User dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </div>
                            <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200">
                                {user?.firstName}
                            </span>
                        </button>

                        <AnimatePresence>
                            {dropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-dark-800 rounded-xl shadow-lg border border-gray-200 dark:border-dark-700 py-2 overflow-hidden"
                                >
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-dark-700">
                                        <p className="font-medium text-gray-900 dark:text-white">{user?.fullName}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                                    </div>

                                    <div className="py-2">
                                        <button
                                            onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                                        >
                                            <HiUser className="w-5 h-5" />
                                            <span>My Profile</span>
                                        </button>
                                        <button
                                            onClick={() => { navigate('/settings'); setDropdownOpen(false); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                                        >
                                            <HiCog6Tooth className="w-5 h-5" />
                                            <span>Settings</span>
                                        </button>
                                    </div>

                                    <div className="border-t border-gray-100 dark:border-dark-700 pt-2">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            <HiArrowRightOnRectangle className="w-5 h-5" />
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
