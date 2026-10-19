import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    HiCog6Tooth,
    HiBell,
    HiShieldCheck,
    HiPaintBrush,
    HiGlobeAlt,
    HiDevicePhoneMobile,
    HiEnvelope,
    HiLockClosed,
    HiFingerPrint
} from 'react-icons/hi2';
import Card from '../components/Card';
import Button from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
    const { isDark, toggleTheme } = useTheme();
    const { currency: globalCurrency, setCurrency: setGlobalCurrency } = useCurrency();
    const [activeTab, setActiveTab] = useState('notifications');

    // Settings state
    const [settings, setSettings] = useState({
        // Notification settings
        emailNotifications: true,
        pushNotifications: true,
        transactionAlerts: true,
        marketingEmails: false,
        securityAlerts: true,
        weeklyDigest: true,

        // Security settings
        twoFactorAuth: false,
        biometricLogin: false,
        loginAlerts: true,
        sessionTimeout: '30',

        // Preferences
        language: 'en',
        currency: 'USD',
        timezone: 'UTC-5'
    });

    // Fetch preferences on mount
    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const response = await usersAPI.getPreferences();
                const prefs = response.data.preferences;
                setSettings(prev => ({
                    ...prev,
                    currency: prefs.currency || 'USD',
                    language: prefs.language || 'en',
                    timezone: prefs.timezone || 'UTC-5'
                }));
            } catch (error) {
                console.error('Failed to load preferences:', error);
            }
        };
        fetchPreferences();
    }, []);

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
        toast.success('Setting updated');
    };

    const handlePreferenceChange = async (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));

        // Save preference changes to backend
        if (['currency', 'language', 'timezone'].includes(key)) {
            try {
                await usersAPI.updatePreferences({ [key]: value });

                // Update global currency context for instant app-wide update
                if (key === 'currency') {
                    setGlobalCurrency(value);
                }

                toast.success('Preference saved!');
            } catch (error) {
                toast.error('Failed to save preference');
            }
        } else {
            toast.success('Setting updated');
        }
    };

    const tabs = [
        { id: 'notifications', label: 'Notifications', icon: HiBell },
        { id: 'security', label: 'Security', icon: HiShieldCheck },
        { id: 'appearance', label: 'Appearance', icon: HiPaintBrush },
        { id: 'preferences', label: 'Preferences', icon: HiGlobeAlt }
    ];

    const ToggleSwitch = ({ enabled, onChange }) => (
        <button
            onClick={onChange}
            className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-600'
                }`}
        >
            <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
            />
        </button>
    );

    const SettingRow = ({ icon: Icon, title, description, children }) => (
        <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-dark-700 last:border-0">
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-dark-700">
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
                </div>
            </div>
            {children}
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <HiCog6Tooth className="w-7 h-7 text-primary-500" />
                    Settings
                </h1>
                <p className="text-gray-500 dark:text-gray-400">Manage your account settings and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <Card className="p-2">
                        <nav className="space-y-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === tab.id
                                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'
                                        }`}
                                >
                                    <tab.icon className="w-5 h-5" />
                                    <span className="font-medium">{tab.label}</span>
                                </button>
                            ))}
                        </nav>
                    </Card>
                </div>

                {/* Content */}
                <div className="lg:col-span-3">
                    <Card>
                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Notification Preferences
                                </h3>

                                <SettingRow
                                    icon={HiEnvelope}
                                    title="Email Notifications"
                                    description="Receive notifications via email"
                                >
                                    <ToggleSwitch
                                        enabled={settings.emailNotifications}
                                        onChange={() => handleToggle('emailNotifications')}
                                    />
                                </SettingRow>

                                <SettingRow
                                    icon={HiDevicePhoneMobile}
                                    title="Push Notifications"
                                    description="Receive push notifications on your device"
                                >
                                    <ToggleSwitch
                                        enabled={settings.pushNotifications}
                                        onChange={() => handleToggle('pushNotifications')}
                                    />
                                </SettingRow>

                                <SettingRow
                                    icon={HiBell}
                                    title="Transaction Alerts"
                                    description="Get notified for all transactions"
                                >
                                    <ToggleSwitch
                                        enabled={settings.transactionAlerts}
                                        onChange={() => handleToggle('transactionAlerts')}
                                    />
                                </SettingRow>

                                <SettingRow
                                    icon={HiShieldCheck}
                                    title="Security Alerts"
                                    description="Alerts for suspicious activity"
                                >
                                    <ToggleSwitch
                                        enabled={settings.securityAlerts}
                                        onChange={() => handleToggle('securityAlerts')}
                                    />
                                </SettingRow>

                                <SettingRow
                                    icon={HiEnvelope}
                                    title="Weekly Digest"
                                    description="Weekly summary of your account activity"
                                >
                                    <ToggleSwitch
                                        enabled={settings.weeklyDigest}
                                        onChange={() => handleToggle('weeklyDigest')}
                                    />
                                </SettingRow>

                                <SettingRow
                                    icon={HiEnvelope}
                                    title="Marketing Emails"
                                    description="Receive promotional offers and updates"
                                >
                                    <ToggleSwitch
                                        enabled={settings.marketingEmails}
                                        onChange={() => handleToggle('marketingEmails')}
                                    />
                                </SettingRow>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Security Settings
                                </h3>

                                <SettingRow
                                    icon={HiLockClosed}
                                    title="Two-Factor Authentication"
                                    description="Add an extra layer of security to your account"
                                >
                                    <ToggleSwitch
                                        enabled={settings.twoFactorAuth}
                                        onChange={() => handleToggle('twoFactorAuth')}
                                    />
                                </SettingRow>

                                <SettingRow
                                    icon={HiFingerPrint}
                                    title="Biometric Login"
                                    description="Use fingerprint or face ID to login"
                                >
                                    <ToggleSwitch
                                        enabled={settings.biometricLogin}
                                        onChange={() => handleToggle('biometricLogin')}
                                    />
                                </SettingRow>

                                <SettingRow
                                    icon={HiShieldCheck}
                                    title="Login Alerts"
                                    description="Get notified of new login activity"
                                >
                                    <ToggleSwitch
                                        enabled={settings.loginAlerts}
                                        onChange={() => handleToggle('loginAlerts')}
                                    />
                                </SettingRow>

                                <SettingRow
                                    icon={HiLockClosed}
                                    title="Session Timeout"
                                    description="Auto logout after inactivity"
                                >
                                    <select
                                        value={settings.sessionTimeout}
                                        onChange={(e) => handlePreferenceChange('sessionTimeout', e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="15">15 minutes</option>
                                        <option value="30">30 minutes</option>
                                        <option value="60">1 hour</option>
                                        <option value="never">Never</option>
                                    </select>
                                </SettingRow>

                                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-dark-700">
                                    <Button variant="secondary">
                                        Change Password
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Appearance Tab */}
                        {activeTab === 'appearance' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Appearance
                                </h3>

                                <SettingRow
                                    icon={HiPaintBrush}
                                    title="Dark Mode"
                                    description="Switch between light and dark themes"
                                >
                                    <ToggleSwitch
                                        enabled={isDark}
                                        onChange={toggleTheme}
                                    />
                                </SettingRow>

                                <div className="mt-6">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Theme Preview</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => !isDark || toggleTheme()}
                                            className={`p-4 rounded-xl border-2 transition-all ${!isDark
                                                ? 'border-primary-500 ring-2 ring-primary-500/20'
                                                : 'border-gray-200 dark:border-dark-600'
                                                }`}
                                        >
                                            <div className="bg-white border border-gray-200 rounded-lg p-3 mb-2">
                                                <div className="h-2 w-12 bg-gray-300 rounded mb-2"></div>
                                                <div className="h-2 w-8 bg-gray-200 rounded"></div>
                                            </div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Light</p>
                                        </button>
                                        <button
                                            onClick={() => isDark || toggleTheme()}
                                            className={`p-4 rounded-xl border-2 transition-all ${isDark
                                                ? 'border-primary-500 ring-2 ring-primary-500/20'
                                                : 'border-gray-200 dark:border-dark-600'
                                                }`}
                                        >
                                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-2">
                                                <div className="h-2 w-12 bg-gray-600 rounded mb-2"></div>
                                                <div className="h-2 w-8 bg-gray-700 rounded"></div>
                                            </div>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark</p>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Preferences Tab */}
                        {activeTab === 'preferences' && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Regional Preferences
                                </h3>

                                <SettingRow
                                    icon={HiGlobeAlt}
                                    title="Language"
                                    description="Select your preferred language"
                                >
                                    <select
                                        value={settings.language}
                                        onChange={(e) => handlePreferenceChange('language', e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="en">English</option>
                                        <option value="es">Español</option>
                                        <option value="fr">Français</option>
                                        <option value="de">Deutsch</option>
                                        <option value="hi">हिंदी</option>
                                    </select>
                                </SettingRow>

                                <SettingRow
                                    icon={HiGlobeAlt}
                                    title="Currency"
                                    description="Select your preferred currency"
                                >
                                    <select
                                        value={settings.currency}
                                        onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="EUR">EUR (€)</option>
                                        <option value="GBP">GBP (£)</option>
                                        <option value="INR">INR (₹)</option>
                                        <option value="JPY">JPY (¥)</option>
                                    </select>
                                </SettingRow>

                                <SettingRow
                                    icon={HiGlobeAlt}
                                    title="Timezone"
                                    description="Select your timezone"
                                >
                                    <select
                                        value={settings.timezone}
                                        onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="UTC-8">Pacific Time (UTC-8)</option>
                                        <option value="UTC-5">Eastern Time (UTC-5)</option>
                                        <option value="UTC+0">UTC</option>
                                        <option value="UTC+1">Central European (UTC+1)</option>
                                        <option value="UTC+5:30">India (UTC+5:30)</option>
                                        <option value="UTC+9">Japan (UTC+9)</option>
                                    </select>
                                </SettingRow>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </motion.div>
    );
};

export default Settings;
