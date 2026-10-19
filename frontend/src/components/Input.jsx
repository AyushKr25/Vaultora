import { forwardRef } from 'react';

const Input = forwardRef(({
    label,
    type = 'text',
    error,
    icon: Icon,
    className = '',
    ...props
}, ref) => {
    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        <Icon className="w-5 h-5" />
                    </div>
                )}
                <input
                    ref={ref}
                    type={type}
                    className={`
            w-full rounded-xl border bg-white dark:bg-dark-700 
            ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3
            text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
            transition-all duration-200 input-animated
            ${error
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 dark:border-dark-600 focus:border-primary-500 focus:ring-primary-500'
                        }
            focus:outline-none focus:ring-2 focus:ring-offset-0
          `}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1.5 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export const Select = forwardRef(({
    label,
    options = [],
    error,
    className = '',
    ...props
}, ref) => {
    return (
        <div className={className}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {label}
                </label>
            )}
            <select
                ref={ref}
                className={`
          w-full rounded-xl border bg-white dark:bg-dark-700 
          px-4 py-3 text-gray-900 dark:text-white
          transition-all duration-200
          ${error
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-dark-600 focus:border-primary-500 focus:ring-primary-500'
                    }
          focus:outline-none focus:ring-2 focus:ring-offset-0
        `}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <p className="mt-1.5 text-sm text-red-500">{error}</p>
            )}
        </div>
    );
});

Select.displayName = 'Select';

export default Input;
