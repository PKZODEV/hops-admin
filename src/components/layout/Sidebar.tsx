'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Hotel,
    BedDouble,
    Car,
    CalendarDays,
    Compass,
    Plane,
    CarFront,
    Users,
    Package,
    Handshake,
    Tag,
    BarChart2,
    Settings,
    User,
    LogOut,
    Menu,
} from 'lucide-react';

interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
    isMobileOpen?: boolean;
    onMobileClose?: () => void;
}

const NAV_ITEMS = [
    { href: '/', icon: LayoutDashboard, label: 'แดชบอร์ด', exact: true },
    { href: '/hotel-management', icon: Hotel, label: 'ที่พัก' },
    { href: '/rooms', icon: BedDouble, label: 'ห้องพัก' },
    { href: '/transport', icon: Car, label: 'ยานพาหนะ' },
    { href: '/reservations', icon: CalendarDays, label: 'การจอง' },
    { href: '/tours', icon: Compass, label: 'ทัวร์และกิจกรรม' },
    { href: '/flights', icon: Plane, label: 'ตั๋วเครื่องบิน' },
    { href: '/car-rental', icon: CarFront, label: 'รถเช่า' },
    { href: '/customers', icon: Users, label: 'ลูกค้า' },
    { href: '/inventory', icon: Package, label: 'คลังสินค้า' },
    { href: '/partners', icon: Handshake, label: 'พันธมิตร' },
    { href: '/promotions', icon: Tag, label: 'โปรโมชัน' },
    { href: '/report', icon: BarChart2, label: 'รายงาน' },
    { href: '/settings', icon: Settings, label: 'ตั้งค่า' },
    { href: '/profile', icon: User, label: 'โปรไฟล์' },
];

export const Sidebar = ({ isCollapsed, toggleSidebar, isMobileOpen = false, onMobileClose }: SidebarProps) => {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch(
                `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1'}/auth/logout`,
                { method: 'POST', credentials: 'include' }
            );
        } catch {
            // proceed regardless
        }
        localStorage.removeItem('hops_user');
        localStorage.removeItem('hops_property_id');
        router.push('/login');
    };

    const isActive = (href: string, exact?: boolean) =>
        exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

    return (
        <>
        {/* Mobile overlay backdrop */}
        {isMobileOpen && (
            <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onMobileClose} />
        )}
        <aside
            className={`fixed md:static inset-y-0 left-0 z-50 bg-[#F8FAFC] border-r border-[#E2E8F0] min-h-screen transition-transform md:transition-all duration-300 flex flex-col justify-between
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                ${isCollapsed ? 'md:w-[80px]' : 'w-[220px]'}`}
        >
            {/* Top Section */}
            <div className="flex-1 overflow-y-auto">
                {/* Logo */}
                <div className="flex items-center h-16 px-4 border-b border-[#E2E8F0]">
                    <div
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-teal text-white font-bold text-xs shrink-0 cursor-pointer"
                        onClick={() => window.location.href = '/'}
                    >
                        HOPS
                    </div>
                    {!isCollapsed && (
                        <span className="ml-3 font-bold text-gray-900 text-lg transition-opacity duration-300 truncate">Hops</span>
                    )}
                    <button
                        onClick={toggleSidebar}
                        className={`ml-auto p-2 rounded-md hover:bg-gray-100 text-gray-500 transition-colors ${isCollapsed ? 'mx-auto ml-0' : ''}`}
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="py-3 flex flex-col gap-0.5 px-3">
                    {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
                        const active = isActive(href, exact);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center px-3 py-2.5 rounded-md transition-colors group ${active ? 'bg-teal-50 text-primary-teal font-medium' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                            >
                                <Icon className={`w-5 h-5 shrink-0 ${active ? 'text-primary-teal' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                {!isCollapsed && <span className="ml-3 truncate text-sm">{label}</span>}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Logout */}
            <div className="p-4 border-t border-[#E2E8F0] shrink-0">
                <button
                    onClick={handleLogout}
                    className="flex items-center px-3 py-2.5 w-full rounded-md text-red-500 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    {!isCollapsed && <span className="ml-3 font-medium truncate text-sm">Log out</span>}
                </button>
            </div>
        </aside>
        </>
    );
};

