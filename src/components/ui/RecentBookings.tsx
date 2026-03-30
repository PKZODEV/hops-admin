import React from 'react';
import { Card } from '@/components/ui/Card';
import { mockRecentBookings } from '@/mockData';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const RecentBookings = () => {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">ยืนยันแล้ว</span>;
            case 'CHECKED_IN': return <span className="px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">เช็คอินแล้ว</span>;
            case 'CHECKED_OUT': return <span className="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">เช็คเอาท์แล้ว</span>;
            default: return null;
        }
    };

    return (
        <Card className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-gray-900">การจองล่าสุด</h3>
                <Link href="/booking-management" className="text-sm font-medium text-primary-teal flex items-center hover:underline">
                    ดูทั้งหมด <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
            </div>

            <div className="flex flex-col gap-4">
                {mockRecentBookings.map((booking) => (
                    <div key={booking.id} className="p-4 border border-border-light rounded-lg flex justify-between items-center hover:shadow-sm transition-shadow">
                        <div>
                            <h4 className="font-bold text-sm text-gray-900">{booking.guestName}</h4>
                            <p className="text-xs text-gray-500 mt-1">{booking.roomName}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-gray-600 mb-1">{booking.checkIn}</div>
                            {getStatusBadge(booking.status)}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};
