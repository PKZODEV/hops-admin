import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({ children, className = '', padding = 'md', ...props }: CardProps) => {
    const paddingMap = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div
            className={`bg-white rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.06)] border border-border-light ${paddingMap[padding]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};
