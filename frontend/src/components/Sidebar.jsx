import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HiHome,
    HiCreditCard,
    HiArrowDownTray,
    HiArrowUpTray,
    HiArrowsRightLeft,
    HiClock,
    HiUser,
    HiChartBar,
    HiUsers,
    HiDocumentText,
    HiXMark,
    HiBuildingLibrary
} from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose, isAdmin = false }) => {
    const { user } = useAuth();

    const customerLinks = [
        { to: '/', icon: HiHome, label: 'Dashboard' },
        { to: '/accounts', icon: HiCreditCard, label: 'Accounts' },
        { to: '/deposit', icon: HiArrowDownTray, label: 'Deposit' },
        { to: '/withdraw', icon: HiArrowUpTray, label: 'Withdraw' },
        { to: '/transfer', icon: HiArrowsRightLeft, label: 'Transfer' },
        { to: '/history', icon: HiClock, label: 'History' },
        { to: '/profile', icon: HiUser, label: 'Profile' },
    ];

    const adminLinks = [
        { to: '/admin', icon: HiChartBar, label: 'Dashboard' },
        { to: '/admin/accounts', icon: HiCreditCard, label: 'Accounts' },
        { to: '/admin/users', icon: HiUsers, label: 'Users' },
        { to: '/admin/logs', icon: HiDocumentText, label: 'Audit Logs' },
    ];

    const links = isAdmin ? adminLinks : customerLinks;

    const sidebarContent = (
        <>
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-dark-700">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <HiBuildingLibrary className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-lg text-gray-900 dark:text-white">SecureBank</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isAdmin ? 'Admin Portal' : 'Banking'}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="ml-auto lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                    <HiXMark className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* User info */}
            <div className="px-4 py-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-100 dark:bg-dark-700">
                    <div className="w-10 h-10 rounded-full gradient-secondary flex items-center justify-center text-white font-semibold">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {user?.fullName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user?.email}
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
                {links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        end={link.to === '/' || link.to === '/admin'}
                        onClick={onClose}
                        className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${isActive
                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700'
                            }
            `}
                    >
                        <link.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-medium">{link.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Switch portal link */}
            {user?.role?.name === 'admin' && (
                <div className="px-4 py-4 border-t border-gray-200 dark:border-dark-700">
                    <NavLink
                        to={isAdmin ? '/' : '/admin'}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 transition-all"
                    >
                        {isAdmin ? <HiHome className="w-5 h-5" /> : <HiChartBar className="w-5 h-5" />}
                        <span className="font-medium">{isAdmin ? 'Customer View' : 'Admin Portal'}</span>
                    </NavLink>
                </div>
            )}
        </>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 w-64 h-full bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 z-30">
                {sidebarContent}
            </aside>

            {/* Mobile sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="lg:hidden fixed left-0 top-0 w-64 h-full bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 z-50 flex flex-col"
                    >
                        {sidebarContent}
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;
