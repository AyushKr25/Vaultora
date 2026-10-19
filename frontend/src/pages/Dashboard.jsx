import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { Line, Doughnut } from 'react-chartjs-2';
import {
    HiCreditCard,
    HiBanknotes,
    HiArrowTrendingUp,
    HiArrowTrendingDown,
    HiArrowDownTray,
    HiArrowUpTray,
    HiArrowsRightLeft,
    HiClock
} from 'react-icons/hi2';
import { accountsAPI, transactionsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import Card, { StatCard } from '../components/Card';
import Button from '../components/Button';
import toast from 'react-hot-toast';

// Register Chart.js components
ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, ArcElement, Title, Tooltip, Legend, Filler
);

const Dashboard = () => {
    const { user } = useAuth();
    const { formatCurrency, getCurrencySymbol } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [analytics, setAnalytics] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [summaryRes, historyRes, analyticsRes] = await Promise.all([
                accountsAPI.getSummary(),
                transactionsAPI.getHistory({ perPage: 5 }),
                transactionsAPI.getAnalytics({ days: 30 })
            ]);

            setSummary(summaryRes.data);
            setTransactions(historyRes.data.transactions);
            setAnalytics(analyticsRes.data);
        } catch (error) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { maxTicksLimit: 7 }
            },
            y: {
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: { callback: (v) => `${getCurrencySymbol()}${v}` }
            }
        }
    };

    const lineChartData = {
        labels: analytics?.chartData?.labels || [],
        datasets: [
            {
                label: 'Deposits',
                data: analytics?.chartData?.deposits || [],
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Withdrawals',
                data: analytics?.chartData?.withdrawals || [],
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const doughnutData = {
        labels: summary?.accounts?.map(a => a.type.charAt(0).toUpperCase() + a.type.slice(1)) || [],
        datasets: [{
            data: summary?.accounts?.map(a => a.balance) || [],
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
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={HiBanknotes}
                    label="Total Balance"
                    value={formatCurrency(summary?.totalBalance || 0)}
                    subValue={`${summary?.totalAccounts || 0} accounts`}
                    iconColor="bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
                />
                <StatCard
                    icon={HiArrowTrendingUp}
                    label="Total Deposits"
                    value={formatCurrency(analytics?.summary?.totalDeposits || 0)}
                    subValue="Last 30 days"
                    trendUp
                    trend="+12.5%"
                    iconColor="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                />
                <StatCard
                    icon={HiArrowTrendingDown}
                    label="Total Withdrawals"
                    value={formatCurrency(analytics?.summary?.totalWithdrawals || 0)}
                    subValue="Last 30 days"
                    iconColor="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                />
                <StatCard
                    icon={HiCreditCard}
                    label="Transactions"
                    value={analytics?.summary?.transactionCount || 0}
                    subValue="Last 30 days"
                    iconColor="bg-secondary-100 text-secondary-600 dark:bg-secondary-900/30 dark:text-secondary-400"
                />
            </div>

            {/* Quick Actions */}
            <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link to="/deposit">
                        <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors cursor-pointer">
                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                                <HiArrowDownTray className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">Deposit</span>
                        </div>
                    </Link>
                    <Link to="/withdraw">
                        <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer">
                            <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                                <HiArrowUpTray className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">Withdraw</span>
                        </div>
                    </Link>
                    <Link to="/transfer">
                        <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors cursor-pointer">
                            <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
                                <HiArrowsRightLeft className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">Transfer</span>
                        </div>
                    </Link>
                    <Link to="/history">
                        <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-secondary-50 dark:bg-secondary-900/20 hover:bg-secondary-100 dark:hover:bg-secondary-900/30 transition-colors cursor-pointer">
                            <div className="w-12 h-12 rounded-full bg-secondary-500 flex items-center justify-center">
                                <HiClock className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">History</span>
                        </div>
                    </Link>
                </div>
            </Card>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Line Chart */}
                <Card className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Transaction Trends
                    </h3>
                    <div className="h-64">
                        <Line data={lineChartData} options={chartOptions} />
                    </div>
                </Card>

                {/* Doughnut Chart */}
                <Card>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Balance Distribution
                    </h3>
                    <div className="h-64 flex items-center justify-center">
                        <Doughnut
                            data={doughnutData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: { padding: 20 }
                                    }
                                },
                                cutout: '65%'
                            }}
                        />
                    </div>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Recent Transactions
                    </h3>
                    <Link to="/history">
                        <Button variant="ghost" size="sm">View All</Button>
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-dark-700">
                                <th className="pb-3 font-medium">Reference</th>
                                <th className="pb-3 font-medium">Type</th>
                                <th className="pb-3 font-medium">Amount</th>
                                <th className="pb-3 font-medium">Balance</th>
                                <th className="pb-3 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                                        No transactions yet
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="border-b border-gray-100 dark:border-dark-700/50">
                                        <td className="py-4 font-mono text-gray-900 dark:text-white">
                                            {tx.transactionRef.slice(0, 15)}...
                                        </td>
                                        <td className="py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.transactionType === 'deposit' || tx.transactionType === 'transfer_in'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {tx.transactionType.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className={`py-4 font-medium ${tx.transactionType === 'deposit' || tx.transactionType === 'transfer_in'
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                            }`}>
                                            {tx.transactionType === 'deposit' || tx.transactionType === 'transfer_in' ? '+' : '-'}
                                            {formatCurrency(tx.amount)}
                                        </td>
                                        <td className="py-4 text-gray-900 dark:text-white">
                                            {formatCurrency(tx.balanceAfter)}
                                        </td>
                                        <td className="py-4 text-gray-500 dark:text-gray-400">
                                            {new Date(tx.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </motion.div>
    );
};

export default Dashboard;
