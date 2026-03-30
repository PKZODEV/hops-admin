import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download, Calendar, BarChart3 } from 'lucide-react';

export default function ReportPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Report & Analytics</h1>
                    <p className="text-gray-500 text-sm mt-1">ดูรายงานสถิติและผลประกอบการของโรงแรม</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="bg-white gap-2 border-gray-300 text-gray-700">
                        <Calendar className="w-4 h-4" /> เลือกช่วงเวลา
                    </Button>
                    <Button className="gap-2">
                        <Download className="w-4 h-4" /> นำออกรายงาน
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card padding="lg" className="h-96 flex flex-col object-cover">
                    <h3 className="font-bold text-lg text-gray-900 mb-6">รายได้เปรียบเทียบ</h3>
                    <div className="flex-1 border border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                        <BarChart3 className="w-12 h-12 mb-4 text-gray-300" />
                        <p>พื้นที่สำหรับแสดงกราฟ (Chart.js / Recharts)</p>
                    </div>
                </Card>

                <Card padding="lg" className="h-96 flex flex-col object-cover">
                    <h3 className="font-bold text-lg text-gray-900 mb-6">อัตราการเข้าพักแยกตามประเภทห้อง</h3>
                    <div className="flex-1 border border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                        <div className="flex gap-4 items-end h-full p-8 w-full justify-center">
                            {/* Mock simple CSS bars */}
                            <div className="w-16 bg-blue-200 rounded-t-md h-[40%] text-center text-xs text-blue-800 pt-2 relative group cursor-pointer hover:bg-blue-300 transition-colors"></div>
                            <div className="w-16 bg-primary-teal rounded-t-md h-[80%] text-center text-xs text-white pt-2 relative group cursor-pointer hover:bg-teal-600 transition-colors"></div>
                            <div className="w-16 bg-orange-300 rounded-t-md h-[60%] text-center text-xs text-orange-900 pt-2 relative group cursor-pointer hover:bg-orange-400 transition-colors"></div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
