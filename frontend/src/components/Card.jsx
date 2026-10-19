import { motion } from 'framer-motion';

const Card = ({
    children,
    className = '',
    hover = false,
    gradient = false,
    glass = false,
    padding = 'p-6'
}) => {
    const baseClasses = `rounded-2xl ${padding} transition-all duration-300`;

    const variantClasses = glass
        ? 'glass'
        : gradient
            ? 'gradient-primary text-white'
            : 'bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700';

    const hoverClasses = hover ? 'card-hover cursor-pointer' : '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`${baseClasses} ${variantClasses} ${hoverClasses} ${className}`}
        >
            {children}
        </motion.div>
    );
};

export const StatCard = ({
    icon: Icon,
    label,
    value,
    subValue,
    trend,
    trendUp,
    iconColor = 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
}) => {
    return (
        <Card hover className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${iconColor}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                {subValue && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subValue}</p>
                )}
                {trend && (
                    <div className={`flex items-center gap-1 mt-2 text-sm ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
                        <span>{trendUp ? '↑' : '↓'}</span>
                        <span>{trend}</span>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default Card;
