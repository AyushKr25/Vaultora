import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiArrowDownTray, HiBanknotes } from 'react-icons/hi2';
import { accountsAPI, transactionsAPI } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input, { Select } from '../components/Input';
import toast from 'react-hot-toast';

const Deposit = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        accountId: '',
        amount: '',
        description: ''
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await accountsAPI.getAll();
            const activeAccounts = response.data.accounts.filter(a => !a.isFrozen && a.isActive);
            setAccounts(activeAccounts);
            if (activeAccounts.length > 0) {
                setFormData(prev => ({ ...prev, accountId: activeAccounts[0].id.toString() }));
            }
        } catch (error) {
            toast.error('Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.accountId) {
            toast.error('Please select an account');
            return;
        }

        const amount = parseFloat(formData.amount);
        if (!amount || amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setSubmitting(true);
        try {
            const response = await transactionsAPI.deposit({
                accountId: parseInt(formData.accountId),
                amount: amount,
                description: formData.description || 'Deposit'
            });

            toast.success(response.data.message);
            setFormData(prev => ({ ...prev, amount: '', description: '' }));
            fetchAccounts(); // Refresh balances
        } catch (error) {
            toast.error(error.response?.data?.error || 'Deposit failed');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedAccount = accounts.find(a => a.id.toString() === formData.accountId);

    if (loading) {
        return (
            <div className="max-w-lg mx-auto">
                <div className="h-96 bg-gray-200 dark:bg-dark-700 rounded-2xl shimmer"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-lg mx-auto"
        >
            <Card>
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <HiArrowDownTray className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deposit Money</h1>
                    <p className="text-gray-500 dark:text-gray-400">Add funds to your account</p>
                </div>

                {accounts.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            You don't have any active accounts
                        </p>
                        <Button onClick={() => window.location.href = '/accounts'}>
                            Create Account
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Select
                            label="Select Account"
                            value={formData.accountId}
                            onChange={(e) => setFormData(prev => ({ ...prev, accountId: e.target.value }))}
                            options={accounts.map(acc => ({
                                value: acc.id.toString(),
                                label: `${acc.accountNumber} (${acc.accountType}) - $${acc.balance.toLocaleString()}`
                            }))}
                        />

                        {selectedAccount && (
                            <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Current Balance</span>
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                                        ${selectedAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        )}

                        <Input
                            label="Amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            icon={HiBanknotes}
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                        />

                        <Input
                            label="Description (Optional)"
                            placeholder="e.g., Salary, Gift, etc."
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />

                        <Button
                            type="submit"
                            variant="success"
                            size="lg"
                            fullWidth
                            loading={submitting}
                        >
                            <HiArrowDownTray className="w-5 h-5" />
                            Deposit Funds
                        </Button>
                    </form>
                )}
            </Card>
        </motion.div>
    );
};

export default Deposit;
