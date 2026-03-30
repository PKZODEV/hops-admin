import React from 'react';
import { Card } from '@/components/ui/Card';
import { mockRoomStatusCounts } from '@/mockData';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const RoomStatus = () => {
    const { available, occupied, maintenance, total } = mockRoomStatusCounts;

    const getPercentage = (count: number) => {
        return Math.round((count / total) * 100);
    };

    return (
        <Card className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-gray-900">สถานะห้องพัก</h3>
                <Link href="/hotel-management/room-types" className="text-sm font-medium text-primary-teal flex items-center hover:underline">
                    จัดการห้อง <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
            </div>

            <div className="flex flex-col gap-6 flex-1 justify-center">
                {/* Available */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">ห้องว่าง</span>
                        <span className="font-bold text-green-600 text-lg">{available}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${getPercentage(available)}%` }}></div>
                    </div>
                </div>

                {/* Occupied */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">ห้องไม่ว่าง</span>
                        <span className="font-bold text-red-600 text-lg">{occupied}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${getPercentage(occupied)}%` }}></div>
                    </div>
                </div>

                {/* Maintenance */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">กำลังซ่อมบำรุง</span>
                        <span className="font-bold text-orange-500 text-lg">{maintenance}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-orange-400 h-2.5 rounded-full" style={{ width: `${getPercentage(maintenance)}%` }}></div>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-4 border-t border-border-light flex justify-between items-center">
                <span className="font-bold text-gray-900">ห้องทั้งหมด</span>
                <span className="font-bold text-2xl text-gray-900">{total}</span>
            </div>
        </Card>
    );
};
