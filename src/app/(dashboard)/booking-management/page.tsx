import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Filter, CalendarDays, List as ListIcon } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export default function BookingManagementPage() {
    return (
        <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
                    <p className="text-gray-500 text-sm mt-1">ปฏิทินและรายการการจองทั้งหมด</p>
                </div>
                <Button className="gap-2">
                    เพิ่มการจองใหม่
                </Button>
            </div>

            <Card padding="lg" className="flex-1 flex flex-col gap-6">
                {/* Toolbar */}
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border border-border-light">
                    <div className="flex gap-2">
                        <div className="w-64">
                            <Input
                                placeholder="ค้นหาชื่อผู้จอง, หมายเลขการจอง..."
                                icon={<Search className="w-5 h-5" />}
                                className="bg-white"
                            />
                        </div>
                        <Button variant="outline" className="bg-white gap-2 border-gray-300 text-gray-700">
                            <Filter className="w-4 h-4" /> ตัวกรอง
                        </Button>
                    </div>

                    <div className="flex items-center gap-1 border border-border-light rounded-lg p-1 bg-white">
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-100 shadow-sm text-gray-900 text-sm font-medium">
                            <CalendarDays className="w-4 h-4" /> ปฏิทิน
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded text-gray-500 hover:text-gray-900 text-sm font-medium">
                            <ListIcon className="w-4 h-4" /> รายการ
                        </button>
                    </div>
                </div>

                {/* Mock Calendar View */}
                <div className="flex-1 border border-dashed border-gray-300 rounded-xl bg-gray-50/50 flex flex-col items-center justify-center text-gray-400">
                    <CalendarDays className="w-16 h-16 mb-4 text-gray-300" />
                    <p className="text-lg font-bold text-gray-500">มุมมองปฏิทิน</p>
                    <p className="text-sm mt-2">พื้นที่สำหรับแสดงปฏิทินการจองแบบ Interactive</p>
                </div>
            </Card>
        </div>
    );
}
