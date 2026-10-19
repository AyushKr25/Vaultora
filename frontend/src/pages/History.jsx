import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiMagnifyingGlass, HiArrowDownTray, HiFunnel } from 'react-icons/hi2';
import { accountsAPI, transactionsAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Input, { Select } from '../components/Input';
import toast from 'react-hot-toast';

const History = () => {
    const { formatCurrency } = useCurrency();
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [filters, setFilters] = useState({
        accountId: '',
        type: '',
        startDate: '',
        endDate: '',
        page: 1
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchAccounts();
    }, []);

    useEffect(() => {
        fetchTransactions();
    }, [filters]);

    const fetchAccounts = async () => {
        try {
            const response = await accountsAPI.getAll();
            setAccounts(response.data.accounts);
        } catch (error) {
            console.error('Failed to load accounts');
        }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = {
                page: filters.page,
                perPage: 15,
                ...(filters.accountId && { accountId: filters.accountId }),
                ...(filters.type && { type: filters.type }),
                ...(filters.startDate && { startDate: filters.startDate }),
                ...(filters.endDate && { endDate: filters.endDate })
            };

            const response = await transactionsAPI.getHistory(params);
            setTransactions(response.data.transactions);
            setPagination(response.data.pagination);
        } catch (error) {
            toast.error('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const downloadStatement = async () => {
        if (!filters.accountId) {
            toast.error('Please select an account');
            return;
        }

        try {
            const response = await transactionsAPI.getStatement({
                accountId: filters.accountId,
                startDate: filters.startDate,
                endDate: filters.endDate
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'statement.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Statement downloaded');
        } catch (error) {
            toast.error('Failed to download statement');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transaction History</h1>
                    <p className="text-gray-500 dark:text-gray-400">View all your transactions</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => setShowFilters(!showFilters)}>
                        <HiFunnel className="w-5 h-5" />
                        Filters
                    </Button>
                    <Button variant="secondary" onClick={downloadStatement}>
                        <HiArrowDownTray className="w-5 h-5" />
                        Download PDF
                    </Button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <Card>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Select
                            label="Account"
                            value={filters.accountId}
                            onChange={(e) => setFilters(prev => ({ ...prev, accountId: e.target.value, page: 1 }))}
                            options={[
                                { value: '', label: 'All Accounts' },
                                ...accounts.map(acc => ({
                                    value: acc.id.toString(),
                                    label: acc.accountNumber
                                }))
                            ]}
                        />
                        <Select
                            label="Type"
                            value={filters.type}
                            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
                            options={[
                                { value: '', label: 'All Types' },
                                { value: 'deposit', label: 'Deposit' },
                                { value: 'withdrawal', label: 'Withdrawal' },
                                { value: 'transfer_in', label: 'Transfer In' },
                                { value: 'transfer_out', label: 'Transfer Out' }
                            ]}
                        />
                        <Input
                            label="Start Date"
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value, page: 1 }))}
                        />
                        <Input
                            label="End Date"
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value, page: 1 }))}
                        />
                    </div>
                </Card>
            )}

            {/* Transactions Table */}
            <Card padding="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
                                <th className="px-6 py-4 font-medium">Reference</th>
                                <th className="px-6 py-4 font-medium">Type</th>
                                <th className="px-6 py-4 font-medium">Amount</th>
                                <th className="px-6 py-4 font-medium">Balance</th>
                                <th className="px-6 py-4 font-medium">Description</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="border-b border-gray-100 dark:border-dark-700/50">
                                        {[...Array(6)].map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded shimmer"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No transactions found
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="border-b border-gray-100 dark:border-dark-700/50 hover:bg-gray-50 dark:hover:bg-dark-700/30">
                                        <td className="px-6 py-4 font-mono text-gray-900 dark:text-white">
                                            {tx.transactionRef}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.transactionType === 'deposit' || tx.transactionType === 'transfer_in'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {tx.transactionType.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 font-medium ${tx.transactionType === 'deposit' || tx.transactionType === 'transfer_in'
                                            ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {tx.transactionType === 'deposit' || tx.transactionType === 'transfer_in' ? '+' : '-'}
                                            {formatCurrency(tx.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 dark:text-white">
                                            {formatCurrency(tx.balanceAfter)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                            {tx.description}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {new Date(tx.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-dark-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Showing {((pagination.page - 1) * pagination.perPage) + 1} to {Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={!pagination.hasPrev}
                                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={!pagination.hasNext}
                                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </motion.div>
    );
};

export default History;
