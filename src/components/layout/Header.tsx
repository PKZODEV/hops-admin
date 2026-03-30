'use client';
import React, { useState, useEffect } from 'react';
import { HelpCircle, Menu } from 'lucide-react';

interface HeaderProps {
    onMenuToggle?: () => void;
}

export const Header = ({ onMenuToggle }: HeaderProps) => {
    const [userName, setUserName] = useState('Admin User');
    const [userInitials, setUserInitials] = useState('AU');

    useEffect(() => {
        try {
            const stored = localStorage.getItem('hops_user');
            if (stored) {
                const user = JSON.parse(stored);
                const name = user.name || user.email || 'Admin';
                setUserName(name);
                setUserInitials(
                    name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
                );
            }
        } catch {
            // keep defaults
        }
    }, []);

    return (
        <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 md:px-6 z-10 w-full relative drop-shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
            {/* Mobile hamburger + Left side */}
            <div className="flex items-center gap-3">
                {onMenuToggle && (
                    <button
                        onClick={onMenuToggle}
                        className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Right Side Tools & Profile */}
            <div className="flex items-center gap-4">
                <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
                    <HelpCircle className="w-5 h-5" />
                </button>

                <div className="w-px h-8 bg-gray-200 mx-2"></div>

                {/* Profile Widget */}
                <div className="flex items-center gap-3">
                    <div className="flex flex-col text-right">
                        <span className="text-sm font-bold text-gray-900">{userName}</span>
                        <span className="text-xs text-gray-500">Hotel Owner</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
                        {userInitials}
                    </div>
                </div>
            </div>
        </header>
    );
};
