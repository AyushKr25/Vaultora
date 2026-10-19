import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiMagnifyingGlass, HiFunnel } from 'react-icons/hi2';
import { adminAPI } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input, { Select } from '../../components/Input';
import toast from 'react-hot-toast';

const AdminLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [filters, setFilters] = useState({
        action: '',
        startDate: '',
        endDate: '',
        page: 1
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = {
                page: filters.page,
                perPage: 20,
                ...(filters.action && { action: filters.action }),
                ...(filters.startDate && { startDate: filters.startDate }),
                ...(filters.endDate && { endDate: filters.endDate })
            };

            const response = await adminAPI.getLogs(params);
            setLogs(response.data.logs);
            setPagination(response.data.pagination);
        } catch (error) {
            toast.error('Failed to load logs');
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action) => {
        if (action.includes('login') || action.includes('create')) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
        if (action.includes('delete') || action.includes('freeze')) return 'text-red-600 bg-red-100 dark:bg-red-900/30';
        if (action.includes('update') || action.includes('change')) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
                    <p className="text-gray-500 dark:text-gray-400">View system activity and audit trail</p>
                </div>
                <Button variant="ghost" onClick={() => setShowFilters(!showFilters)}>
                    <HiFunnel className="w-5 h-5" />
                    Filters
                </Button>
            </div>

            {/* Filters */}
            {showFilters && (
                <Card>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Select
                            label="Action Type"
                            value={filters.action}
                            onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value, page: 1 }))}
                            options={[
                                { value: '', label: 'All Actions' },
                                { value: 'login', label: 'Login' },
                                { value: 'transaction', label: 'Transactions' },
                                { value: 'account', label: 'Account Changes' },
                                { value: 'user', label: 'User Changes' }
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
                        <div className="flex items-end">
                            <Button onClick={() => setFilters({ action: '', startDate: '', endDate: '', page: 1 })} variant="secondary" fullWidth>
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Logs Table */}
            <Card padding="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
                                <th className="px-6 py-4 font-medium">Timestamp</th>
                                <th className="px-6 py-4 font-medium">Action</th>
                                <th className="px-6 py-4 font-medium">User</th>
                                <th className="px-6 py-4 font-medium">Details</th>
                                <th className="px-6 py-4 font-medium">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                [...Array(10)].map((_, i) => (
                                    <tr key={i} className="border-b border-gray-100 dark:border-dark-700/50">
                                        {[...Array(5)].map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded shimmer"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No logs found
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="border-b border-gray-100 dark:border-dark-700/50 hover:bg-gray-50 dark:hover:bg-dark-700/30">
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 dark:text-white">
                                            {log.user?.fullName || 'System'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-md truncate">
                                            {log.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-gray-500 dark:text-gray-400">
                                            {log.ipAddress || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {pagination.pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-dark-700">
                        <p className="text-sm text-gray-500">
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

export default AdminLogs;
