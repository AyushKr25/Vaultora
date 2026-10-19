import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiMagnifyingGlass, HiUserPlus, HiUserMinus } from 'react-icons/hi2';
import { adminAPI } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Input, { Select } from '../../components/Input';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage] = useState(1);

    const [actionModal, setActionModal] = useState({ show: false, type: '', user: null });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [page, roleFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await adminAPI.getUsers({
                page,
                perPage: 15,
                search,
                role: roleFilter
            });
            setUsers(response.data.users);
            setPagination(response.data.pagination);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        setProcessing(true);
        try {
            if (actionModal.type === 'deactivate') {
                await adminAPI.deactivateUser(actionModal.user.id);
                toast.success('User deactivated');
            } else if (actionModal.type === 'activate') {
                await adminAPI.activateUser(actionModal.user.id);
                toast.success('User activated');
            }
            fetchUsers();
            setActionModal({ show: false, type: '', user: null });
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
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Users</h1>
                    <p className="text-gray-500 dark:text-gray-400">View and manage all users</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            icon={HiMagnifyingGlass}
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                        />
                    </div>
                    <Select
                        value={roleFilter}
                        onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                        options={[
                            { value: '', label: 'All Roles' },
                            { value: 'admin', label: 'Admin' },
                            { value: 'customer', label: 'Customer' }
                        ]}
                    />
                    <Button onClick={() => fetchUsers()}>Search</Button>
                </div>
            </Card>

            {/* Users Table */}
            <Card padding="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
                                <th className="px-6 py-4 font-medium">User</th>
                                <th className="px-6 py-4 font-medium">Email</th>
                                <th className="px-6 py-4 font-medium">Role</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Accounts</th>
                                <th className="px-6 py-4 font-medium">Joined</th>
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
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="border-b border-gray-100 dark:border-dark-700/50 hover:bg-gray-50 dark:hover:bg-dark-700/30">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold">
                                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-white">{user.fullName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role?.name === 'admin'
                                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                }`}>
                                                {user.role?.name || 'customer'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-900 dark:text-white">
                                            {user.accountCount || 0}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.role?.name !== 'admin' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setActionModal({
                                                        show: true,
                                                        type: user.isActive ? 'deactivate' : 'activate',
                                                        user
                                                    })}
                                                >
                                                    {user.isActive ? <HiUserMinus className="w-4 h-4" /> : <HiUserPlus className="w-4 h-4" />}
                                                </Button>
                                            )}
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
                onClose={() => setActionModal({ show: false, type: '', user: null })}
                title={actionModal.type === 'deactivate' ? 'Deactivate User' : 'Activate User'}
            >
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                        Are you sure you want to {actionModal.type} user <strong>{actionModal.user?.fullName}</strong>?
                        {actionModal.type === 'deactivate' && ' They will no longer be able to access their account.'}
                    </p>
                    <div className="flex gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setActionModal({ show: false, type: '', user: null })} fullWidth>Cancel</Button>
                        <Button variant={actionModal.type === 'deactivate' ? 'danger' : 'primary'} onClick={handleAction} loading={processing} fullWidth>
                            {actionModal.type === 'deactivate' ? 'Deactivate' : 'Activate'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
};

export default AdminUsers;
