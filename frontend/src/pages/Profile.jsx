import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiUser, HiEnvelope, HiPhone, HiMapPin, HiCalendar, HiLockClosed } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import { usersAPI, authAPI } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user, refreshUser } = useAuth();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [passwordModal, setPasswordModal] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        dateOfBirth: ''
    });

    // Initialize form data when user changes
    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
                address: user.address || '',
                dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : ''
            });
        }
    }, [user]);

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleSave = async () => {
        setSaving(true);
        try {
            await usersAPI.updateProfile(formData);
            await refreshUser();
            toast.success('Profile updated successfully');
            setEditing(false);
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setChangingPassword(true);
        try {
            await authAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Password changed successfully');
            setPasswordModal(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    const handleCancel = () => {
        // Reset form to original user data
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
                address: user.address || '',
                dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : ''
            });
        }
        setEditing(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto space-y-6"
        >
            {/* Profile Header */}
            <Card gradient>
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{user?.fullName}</h1>
                        <p className="text-white/80">{user?.email}</p>
                        <p className="text-sm text-white/60 mt-1">
                            Member since {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Profile Details */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h2>
                    {!editing ? (
                        <Button variant="ghost" onClick={() => setEditing(true)}>
                            Edit Profile
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} loading={saving}>
                                Save Changes
                            </Button>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="First Name"
                            icon={HiUser}
                            value={formData.firstName}
                            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                            disabled={!editing}
                        />
                        <Input
                            label="Last Name"
                            icon={HiUser}
                            value={formData.lastName}
                            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                            disabled={!editing}
                        />
                    </div>

                    <Input
                        label="Email Address"
                        icon={HiEnvelope}
                        value={user?.email || ''}
                        disabled
                    />

                    <Input
                        label="Phone Number"
                        icon={HiPhone}
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={!editing}
                        placeholder="Enter your phone number"
                    />

                    <Input
                        label="Address"
                        icon={HiMapPin}
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        disabled={!editing}
                        placeholder="Enter your address"
                    />

                    <Input
                        label="Date of Birth"
                        type="date"
                        icon={HiCalendar}
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        disabled={!editing}
                    />
                </div>
            </Card>

            {/* Security */}
            <Card>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security</h2>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <HiLockClosed className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Password</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Last changed: {user?.passwordChangedAt
                                    ? new Date(user.passwordChangedAt).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })
                                    : 'Never'}
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => setPasswordModal(true)}>
                        Change Password
                    </Button>
                </div>
            </Card>

            {/* Change Password Modal */}
            <Modal
                isOpen={passwordModal}
                onClose={() => setPasswordModal(false)}
                title="Change Password"
            >
                <div className="space-y-4">
                    <Input
                        label="Current Password"
                        type="password"
                        icon={HiLockClosed}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    />
                    <Input
                        label="New Password"
                        type="password"
                        icon={HiLockClosed}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    />
                    <Input
                        label="Confirm New Password"
                        type="password"
                        icon={HiLockClosed}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    />

                    <div className="flex gap-3 pt-4">
                        <Button variant="secondary" onClick={() => setPasswordModal(false)} fullWidth>
                            Cancel
                        </Button>
                        <Button onClick={handleChangePassword} loading={changingPassword} fullWidth>
                            Change Password
                        </Button>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
};

export default Profile;
