'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Sparkles, Building2, BedDouble, DollarSign, CheckCircle2 } from 'lucide-react';

export default function WelcomePage() {
    const router = useRouter();
    const steps = [
        { title: 'ตั้งค่าข้อมูลโรงแรม', desc: 'ชื่อโรงแรมและสิ่งอำนวยความสะดวก', icon: Building2 },
        { title: 'เพิ่มอาคารและชั้น', desc: 'กำหนดโครงสร้างอาคารของโรงแรม', icon: Building2 },
        { title: 'สร้างห้องพัก', desc: 'เพิ่มห้องพักและประเภทห้อง', icon: BedDouble },
        { title: 'กำหนดราคา', desc: 'ตั้งราคาสำหรับแต่ละประเภทห้อง', icon: DollarSign },
    ];

    return (
        <div className="h-screen bg-[#f1f5f9] flex items-center justify-center p-4 overflow-hidden">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-primary-teal text-white px-8 py-6 flex items-center gap-5">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">ยินดีต้อนรับสู่ระบบจัดการโรงแรม!</h1>
                        <p className="text-teal-100 text-sm mt-0.5">เริ่มต้นด้วยการตั้งค่าข้อมูลโรงแรมของคุณ หรือสำรวจระบบก่อนก็ได้</p>
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-5 flex-1">
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">คุณจะตั้งค่าอะไรบ้าง</p>
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        {steps.map((step, idx) => (
                            <div key={idx} className="border border-gray-100 rounded-xl p-3.5 flex gap-3 bg-gray-50/60">
                                <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-primary-teal shrink-0">
                                    <step.icon className="w-4.5 h-4.5 w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">{step.title}</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-1.5 mb-6 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        {[
                            'ใช้เวลาเพียง 5-10 นาที',
                            'บันทึกอัตโนมัติ — กลับมาทำต่อได้ทุกเมื่อ',
                            'ข้ามได้ — กลับมาตั้งค่าทีหลังก็ได้',
                        ].map((t, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                <CheckCircle2 className="w-4 h-4 text-primary-teal shrink-0" />
                                <span>{t}</span>
                            </div>
                        ))}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3">
                        <Link href="/setup/wizard" className="flex-1">
                            <Button size="lg" className="w-full">เริ่มการตั้งค่าโรงแรม</Button>
                        </Link>
                        <Button
                            size="lg"
                            variant="outline"
                            className="flex-1 bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                            onClick={() => {
                                localStorage.setItem('hops_setup_skipped', '1');
                                router.push('/');
                            }}
                        >
                            ข้ามไปก่อน
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
