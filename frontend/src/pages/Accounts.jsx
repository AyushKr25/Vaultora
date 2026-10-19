import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiPlus, HiCreditCard, HiEye, HiEyeSlash } from 'react-icons/hi2';
import { accountsAPI } from '../services/api';
import { useCurrency } from '../context/CurrencyContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { Select } from '../components/Input';
import toast from 'react-hot-toast';

const Accounts = () => {
    const { formatCurrency } = useCurrency();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBalances, setShowBalances] = useState(true);
    const [createModal, setCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newAccountType, setNewAccountType] = useState('savings');

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await accountsAPI.getAll();
            setAccounts(response.data.accounts);
        } catch (error) {
            toast.error('Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAccount = async () => {
        setCreating(true);
        try {
            const response = await accountsAPI.create({ accountType: newAccountType });
            setAccounts([...accounts, response.data.account]);
            toast.success('Account created successfully!');
            setCreateModal(false);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create account');
        } finally {
            setCreating(false);
        }
    };

    const accountTypeColors = {
        savings: 'from-primary-500 to-primary-700',
        checking: 'from-secondary-500 to-secondary-700',
        business: 'from-amber-500 to-amber-700'
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-48 bg-gray-200 dark:bg-dark-700 rounded-2xl shimmer"></div>
                ))}
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Accounts</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your bank accounts</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => setShowBalances(!showBalances)}
                    >
                        {showBalances ? <HiEyeSlash className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
                        {showBalances ? 'Hide' : 'Show'} Balances
                    </Button>
                    <Button onClick={() => setCreateModal(true)}>
                        <HiPlus className="w-5 h-5" />
                        New Account
                    </Button>
                </div>
            </div>

            {/* Accounts Grid */}
            {accounts.length === 0 ? (
                <Card className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-dark-700 flex items-center justify-center">
                        <HiCreditCard className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No accounts yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Create your first bank account to get started
                    </p>
                    <Button onClick={() => setCreateModal(true)}>
                        <HiPlus className="w-5 h-5" />
                        Create Account
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accounts.map((account, index) => (
                        <motion.div
                            key={account.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${accountTypeColors[account.accountType]} p-6 text-white shadow-lg card-hover`}>
                                {/* Background decoration */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-6 -translate-x-6"></div>

                                <div className="relative z-10">
                                    {/* Card header */}
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <p className="text-sm text-white/80 uppercase tracking-wide">
                                                {account.accountType} Account
                                            </p>
                                            <p className="font-mono text-lg mt-1">
                                                {account.accountNumber}
                                            </p>
                                        </div>
                                        {account.isFrozen && (
                                            <span className="px-2 py-1 bg-red-500 rounded text-xs font-medium">
                                                FROZEN
                                            </span>
                                        )}
                                    </div>

                                    {/* Balance */}
                                    <div className="mb-6">
                                        <p className="text-sm text-white/80">Available Balance</p>
                                        <p className="text-3xl font-bold">
                                            {showBalances
                                                ? formatCurrency(account.balance)
                                                : '••••••'
                                            }
                                        </p>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs text-white/60">Daily Limit</p>
                                            <p className="text-sm font-medium">
                                                {formatCurrency(account.dailyLimit)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-white/20"></div>
                                            <div className="w-8 h-8 rounded-full bg-white/20 -ml-3"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Account Modal */}
            <Modal
                isOpen={createModal}
                onClose={() => setCreateModal(false)}
                title="Create New Account"
            >
                <div className="space-y-4">
                    <Select
                        label="Account Type"
                        value={newAccountType}
                        onChange={(e) => setNewAccountType(e.target.value)}
                        options={[
                            { value: 'savings', label: 'Savings Account' },
                            { value: 'checking', label: 'Checking Account' },
                            { value: 'business', label: 'Business Account' }
                        ]}
                    />

                    <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Account Features</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {newAccountType === 'savings' && (
                                <>
                                    <li>• 2.5% annual interest rate</li>
                                    <li>• No minimum balance required</li>
                                    <li>• Free online banking</li>
                                </>
                            )}
                            {newAccountType === 'checking' && (
                                <>
                                    <li>• Unlimited transactions</li>
                                    <li>• Free debit card</li>
                                    <li>• Overdraft protection available</li>
                                </>
                            )}
                            {newAccountType === 'business' && (
                                <>
                                    <li>• Higher transaction limits</li>
                                    <li>• Multi-user access</li>
                                    <li>• Detailed reporting</li>
                                </>
                            )}
                        </ul>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setCreateModal(false)} fullWidth>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateAccount} loading={creating} fullWidth>
                            Create Account
                        </Button>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
};

export default Accounts;
