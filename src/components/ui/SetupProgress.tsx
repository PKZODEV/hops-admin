import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { mockSetupStatus } from '@/mockData';

export const SetupProgress = () => {
    const percentage = (mockSetupStatus.completedSteps / mockSetupStatus.totalSteps) * 100;

    return (
        <Card className="flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center mb-4">
                        <div className="w-5 h-5 border-2 border-primary-teal rounded-sm" /> {/* Placeholder icon */}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">ตั้งค่าโรงแรมให้สมบูรณ์</h3>
                    <p className="text-sm text-gray-500">{mockSetupStatus.completedSteps} จาก {mockSetupStatus.totalSteps} ขั้นตอนเสร็จสมบูรณ์</p>
                </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div className="bg-gray-300 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
            <div className="text-right text-xs font-medium text-gray-500 mb-6">{percentage}%</div>

            <h4 className="font-bold text-gray-900 mb-4">ขั้นตอนที่เหลือ:</h4>

            <div className="flex flex-col gap-3">
                {mockSetupStatus.steps.map((step) => (
                    <div
                        key={step.id}
                        className={`border rounded-lg p-4 flex gap-3 transition-colors ${step.isCompleted ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-border-light hover:border-primary-teal cursor-pointer'
                            }`}
                    >
                        <div className="mt-0.5">
                            {step.isCompleted ? (
                                <CheckCircle2 className="w-5 h-5 text-primary-teal" />
                            ) : (
                                <Circle className="w-5 h-5 text-gray-300" />
                            )}
                        </div>
                        <div>
                            <h5 className="font-bold text-sm text-gray-900">{step.title}</h5>
                            <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                            {step.isRequired && !step.isCompleted && (
                                <span className="inline-block mt-2 px-2 py-0.5 bg-orange-100 text-[#d97706] text-[10px] font-bold rounded">
                                    จำเปน
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};
