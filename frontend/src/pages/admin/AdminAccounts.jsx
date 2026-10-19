import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiMagnifyingGlass, HiLockClosed, HiLockOpen, HiTrash } from 'react-icons/hi2';
import { adminAPI } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input, { Select } from '../../components/Input';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

const AdminAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);

    const [actionModal, setActionModal] = useState({ show: false, type: '', account: null });
    const [freezeReason, setFreezeReason] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchAccounts();
    }, [page, statusFilter]);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getAccounts({
                page,
                perPage: 15,
                search,
                status: statusFilter
            });
            setAccounts(response.data.accounts);
            setPagination(response.data.pagination);
        } catch (error) {
            toast.error('Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        setProcessing(true);
        try {
            if (actionModal.type === 'freeze') {
                await adminAPI.freezeAccount(actionModal.account.id, { reason: freezeReason });
                toast.success('Account frozen');
            } else if (actionModal.type === 'unfreeze') {
                await adminAPI.unfreezeAccount(actionModal.account.id);
                toast.success('Account unfrozen');
            } else if (actionModal.type === 'delete') {
                await adminAPI.deleteAccount(actionModal.account.id);
                toast.success('Account deleted');
            }
            fetchAccounts();
            setActionModal({ show: false, type: '', account: null });
            setFreezeReason('');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Action failed');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Accounts</h1>
                    <p className="text-gray-500 dark:text-gray-400">View and manage all bank accounts</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            icon={HiMagnifyingGlass}
                            placeholder="Search by account number or user..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchAccounts()}
                        />
                    </div>
                    <Select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        options={[
                            { value: '', label: 'All Status' },
                            { value: 'active', label: 'Active' },
                            { value: 'frozen', label: 'Frozen' },
                            { value: 'inactive', label: 'Inactive' }
                        ]}
                    />
                    <Button onClick={() => fetchAccounts()}>Search</Button>
                </div>
            </Card>

            {/* Accounts Table */}
            <Card padding="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
                                <th className="px-6 py-4 font-medium">Account Number</th>
                                <th className="px-6 py-4 font-medium">Owner</th>
                                <th className="px-6 py-4 font-medium">Type</th>
                                <th className="px-6 py-4 font-medium">Balance</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Created</th>
                                <th className="px-6 py-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="border-b border-gray-100 dark:border-dark-700/50">
                                        {[...Array(7)].map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded shimmer"></div>
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : accounts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No accounts found
                                    </td>
                                </tr>
                            ) : (
                                accounts.map((account) => (
                                    <tr key={account.id} className="border-b border-gray-100 dark:border-dark-700/50 hover:bg-gray-50 dark:hover:bg-dark-700/30">
                                        <td className="px-6 py-4 font-mono text-gray-900 dark:text-white">
                                            {account.accountNumber}
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 dark:text-white">
                                            {account.user?.fullName || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 capitalize">{account.accountType}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${account.isFrozen
                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                    : account.isActive
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                {account.isFrozen ? 'Frozen' : account.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {new Date(account.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                {account.isFrozen ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setActionModal({ show: true, type: 'unfreeze', account })}
                                                    >
                                                        <HiLockOpen className="w-4 h-4" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setActionModal({ show: true, type: 'freeze', account })}
                                                    >
                                                        <HiLockClosed className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setActionModal({ show: true, type: 'delete', account })}
                                                >
                                                    <HiTrash className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
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
                            Page {pagination.page} of {pagination.pages}
                        </p>
                        <div className="flex gap-2">
                            <Button variant="secondary" size="sm" disabled={!pagination.hasPrev} onClick={() => setPage(p => p - 1)}>Previous</Button>
                            <Button variant="secondary" size="sm" disabled={!pagination.hasNext} onClick={() => setPage(p => p + 1)}>Next</Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Action Modal */}
            <Modal
                isOpen={actionModal.show}
                onClose={() => setActionModal({ show: false, type: '', account: null })}
                title={actionModal.type === 'freeze' ? 'Freeze Account' : actionModal.type === 'unfreeze' ? 'Unfreeze Account' : 'Delete Account'}
            >
                <div className="space-y-4">
                    {actionModal.type === 'freeze' && (
                        <>
                            <p className="text-gray-600 dark:text-gray-400">
                                Are you sure you want to freeze account <strong>{actionModal.account?.accountNumber}</strong>?
                            </p>
                            <Input
                                label="Reason"
                                placeholder="Enter reason for freezing..."
                                value={freezeReason}
                                onChange={(e) => setFreezeReason(e.target.value)}
                            />
                        </>
                    )}
                    {actionModal.type === 'unfreeze' && (
                        <p className="text-gray-600 dark:text-gray-400">
                            Are you sure you want to unfreeze account <strong>{actionModal.account?.accountNumber}</strong>?
                        </p>
                    )}
                    {actionModal.type === 'delete' && (
                        <p className="text-red-600">
                            <strong>Warning:</strong> This will permanently delete account <strong>{actionModal.account?.accountNumber}</strong> and all associated data. This action cannot be undone.
                        </p>
                    )}
                    <div className="flex gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setActionModal({ show: false, type: '', account: null })} fullWidth>Cancel</Button>
                        <Button variant={actionModal.type === 'delete' ? 'danger' : 'primary'} onClick={handleAction} loading={processing} fullWidth>
                            {actionModal.type === 'freeze' ? 'Freeze' : actionModal.type === 'unfreeze' ? 'Unfreeze' : 'Delete'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
};

export default AdminAccounts;
