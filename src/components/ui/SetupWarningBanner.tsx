import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const SetupWarningBanner = () => {
    return (
        <div className="bg-[#FFF8E6] border border-[#FDE68A] rounded-lg p-4 flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FEF3C7] flex items-center justify-center text-secondary-orange">
                    <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-bold text-[#b45309]">การตั้งค่าโรงแรมของคุณยังไม่สมบูรณ์</h4>
                    <p className="text-sm text-[#b45309]">ฟีเจอร์บางอย่างอาจใช้งานไม่ได้จนกว่าจะตั้งค่าเสร็จสิ้น (0% เสร็จสิ้น)</p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Button variant="secondary" className="!bg-[#d97706] hover:!bg-[#b45309]">
                    ดำเนินการตั้งค่าต่อ
                </Button>
                <button className="text-[#b45309] hover:text-[#92400e]">
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
