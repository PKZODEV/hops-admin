import React from 'react';
import { mockSetupStatus } from '@/mockData';

interface StepperProps {
    currentStep: number;
}

export const Stepper = ({ currentStep }: StepperProps) => {
    return (
        <div className="w-72 bg-white border-r border-border-light h-screen flex flex-col overflow-hidden">
            <div className="p-8 flex-1 overflow-y-auto">
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">ตั้งค่าโรงแรม</h2>
                    <p className="text-sm text-gray-500">กรอกข้อมูลตามขั้นตอนเพื่อเริ่มต้นใช้งานระบบ</p>
                </div>

                <div className="flex flex-col gap-8 relative">
                    {/* Continuous Connecting Line Background */}
                    <div className="absolute top-4 left-5 bottom-4 w-[2px] bg-gray-100 z-0"></div>

                    {mockSetupStatus.steps.map((step, index) => {
                        const isActive = index === currentStep;
                        const isPast = index < currentStep;

                        let statusText = 'รอดำเนินการ';
                        if (isActive) statusText = 'กำลังดำเนินการ';
                        if (isPast) statusText = 'เสร็จสิ้นแล้ว';

                        let circleClass = 'bg-gray-100 text-gray-500';
                        let textClass = 'text-gray-500';

                        if (isActive) {
                            circleClass = 'bg-primary-teal text-white ring-4 ring-teal-50';
                            textClass = 'text-primary-teal';
                        } else if (isPast) {
                            circleClass = 'bg-primary-teal text-white';
                            textClass = 'text-gray-900';
                        }

                        return (
                            <div key={step.id} className="relative flex items-start gap-5 z-10 bg-white">
                                {/* Step Circle */}
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-base transition-colors ${circleClass}`}
                                >
                                    {index + 1}
                                </div>

                                {/* Step Info */}
                                <div className="flex flex-col pt-2">
                                    <span className={`text-base font-bold ${textClass}`}>
                                        {step.title}
                                    </span>
                                    <span className="text-sm text-gray-400 mt-0.5">
                                        {statusText}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Progress Bar at Bottom of Sidebar */}
            <div className="bg-white border-t border-border-light px-8 h-[72px] flex flex-col justify-center shrink-0">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-gray-500">ความคืบหน้า</span>
                    <span className="text-sm font-bold text-gray-900">{currentStep + 1} / 5</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                        className="bg-primary-teal h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / 5) * 100}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};
