import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
}

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    ...props
}: ButtonProps) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-primary-teal text-white hover:bg-[#208b8d]',
        secondary: 'bg-secondary-orange text-white hover:bg-[#d97706]',
        outline: 'border border-primary-teal text-primary-teal hover:bg-teal-50',
        ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3.5 text-lg w-full', // Removed fixed max-width to allow full expansion
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
