import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
    HiUsers,
    HiCreditCard,
    HiBanknotes,
    HiArrowTrendingUp,
    HiClock,
    HiExclamationTriangle
} from 'react-icons/hi2';
import { adminAPI } from '../../services/api';
import Card, { StatCard } from '../../components/Card';
import toast from 'react-hot-toast';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const response = await adminAPI.getDashboard();
            setData(response.data);
        } catch (error) {
            toast.error('Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const transactionChartData = {
        labels: data?.chartData?.labels || [],
        datasets: [
            {
                label: 'Deposits',
                data: data?.chartData?.deposits || [],
                backgroundColor: 'rgba(34, 197, 94, 0.8)'
            },
            {
                label: 'Withdrawals',
                data: data?.chartData?.withdrawals || [],
                backgroundColor: 'rgba(239, 68, 68, 0.8)'
            }
        ]
    };

    const accountTypesData = {
        labels: ['Savings', 'Checking', 'Business'],
        datasets: [{
            data: [
                data?.accountsByType?.savings || 0,
                data?.accountsByType?.checking || 0,
                data?.accountsByType?.business || 0
            ],
            backgroundColor: ['#6366f1', '#14b8a6', '#f59e0b'],
            borderWidth: 0
        }]
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-200 dark:bg-dark-700 rounded-2xl shimmer"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400">System overview and analytics</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={HiUsers}
                    label="Total Users"
                    value={data?.totalUsers || 0}
                    subValue={`${data?.activeUsers || 0} active`}
                    iconColor="bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                />
                <StatCard
                    icon={HiCreditCard}
                    label="Total Accounts"
                    value={data?.totalAccounts || 0}
                    subValue={`${data?.frozenAccounts || 0} frozen`}
                    iconColor="bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400"
                />
                <StatCard
                    icon={HiBanknotes}
                    label="Total Balance"
                    value={`$${(data?.totalBalance || 0).toLocaleString()}`}
                    subValue="All accounts"
                    iconColor="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                />
                <StatCard
                    icon={HiArrowTrendingUp}
                    label="Today's Transactions"
                    value={data?.todayTransactions || 0}
                    subValue={`$${(data?.todayVolume || 0).toLocaleString()}`}
                    iconColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart */}
                <Card className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Transaction Volume (Last 7 Days)
                    </h3>
                    <div className="h-64">
                        <Bar
                            data={transactionChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'top' } },
                                scales: {
                                    y: { ticks: { callback: (v) => `$${v}` } }
                                }
                            }}
                        />
                    </div>
                </Card>

                {/* Doughnut Chart */}
                <Card>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Account Types
                    </h3>
                    <div className="h-64 flex items-center justify-center">
                        <Doughnut
                            data={accountTypesData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'bottom' } },
                                cutout: '65%'
                            }}
                        />
                    </div>
                </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Transactions */}
                <Card>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Recent Transactions
                    </h3>
                    <div className="space-y-3">
                        {data?.recentTransactions?.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No recent transactions</p>
                        ) : (
                            data?.recentTransactions?.slice(0, 5).map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-xl">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                                            {tx.transactionType.replace('_', ' ')}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(tx.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <span className={`font-semibold ${tx.transactionType === 'deposit' || tx.transactionType === 'transfer_in'
                                        ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        ${tx.amount.toLocaleString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* System Alerts */}
                <Card>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        System Alerts
                    </h3>
                    <div className="space-y-3">
                        {data?.frozenAccounts > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                                <HiExclamationTriangle className="w-5 h-5 text-yellow-600" />
                                <span className="text-sm text-yellow-800 dark:text-yellow-200">
                                    {data.frozenAccounts} account(s) are currently frozen
                                </span>
                            </div>
                        )}
                        {data?.pendingVerifications > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                <HiClock className="w-5 h-5 text-blue-600" />
                                <span className="text-sm text-blue-800 dark:text-blue-200">
                                    {data.pendingVerifications} user(s) pending verification
                                </span>
                            </div>
                        )}
                        {!data?.frozenAccounts && !data?.pendingVerifications && (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                No active alerts
                            </p>
                        )}
                    </div>
                </Card>
            </div>
        </motion.div>
    );
};

export default AdminDashboard;
