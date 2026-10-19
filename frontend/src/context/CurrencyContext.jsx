import { createContext, useContext, useState, useEffect } from 'react';
import { usersAPI } from '../services/api';

const CurrencyContext = createContext();

const currencyData = {
    USD: { symbol: '$', code: 'USD', locale: 'en-US', name: 'US Dollar' },
    EUR: { symbol: '€', code: 'EUR', locale: 'de-DE', name: 'Euro' },
    GBP: { symbol: '£', code: 'GBP', locale: 'en-GB', name: 'British Pound' },
    INR: { symbol: '₹', code: 'INR', locale: 'en-IN', name: 'Indian Rupee' },
    JPY: { symbol: '¥', code: 'JPY', locale: 'ja-JP', name: 'Japanese Yen' }
};

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrency] = useState('USD');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCurrency = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    const response = await usersAPI.getPreferences();
                    if (response.data?.preferences?.currency) {
                        setCurrency(response.data.preferences.currency);
                    }
                }
            } catch (error) {
                console.error('Failed to load currency preference:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCurrency();
    }, []);

    const updateCurrency = async (newCurrency) => {
        setCurrency(newCurrency);
        try {
            await usersAPI.updatePreferences({ currency: newCurrency });
        } catch (error) {
            console.error('Failed to save currency preference:', error);
        }
    };

    const formatCurrency = (amount, options = {}) => {
        const currInfo = currencyData[currency] || currencyData.USD;
        const { showSymbol = true, decimals = 2 } = options;

        const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

        if (isNaN(numericAmount)) return `${currInfo.symbol}0.00`;

        try {
            const formatted = new Intl.NumberFormat(currInfo.locale, {
                style: 'currency',
                currency: currInfo.code,
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(numericAmount);

            return showSymbol ? formatted : numericAmount.toLocaleString(currInfo.locale, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
        } catch (e) {
            return `${currInfo.symbol}${numericAmount.toFixed(decimals)}`;
        }
    };

    const getCurrencySymbol = () => {
        return currencyData[currency]?.symbol || '$';
    };

    const getCurrencyInfo = () => {
        return currencyData[currency] || currencyData.USD;
    };

    return (
        <CurrencyContext.Provider value={{
            currency,
            setCurrency: updateCurrency,
            formatCurrency,
            getCurrencySymbol,
            getCurrencyInfo,
            currencyData,
            loading
        }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};

export default CurrencyContext;
