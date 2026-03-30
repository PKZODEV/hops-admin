import React from 'react';
import { Card } from '@/components/ui/Card';
import { mockDashboardMetrics } from '@/mockData';
import { Calendar, Building, DollarSign, Users, TrendingUp } from 'lucide-react';

export const MetricCards = () => {
    const metrics = [
        {
            title: 'การจองทั้งหมด',
            value: mockDashboardMetrics.totalBookings,
            trend: mockDashboardMetrics.bookingsTrend,
            icon: Calendar,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
        },
        {
            title: 'อัตราการเข้าพัก',
            value: `${mockDashboardMetrics.occupancyRate}%`,
            trend: mockDashboardMetrics.occupancyTrend,
            icon: Building,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
        },
        {
            title: 'รายได้',
            value: `$${mockDashboardMetrics.revenue.toLocaleString()}`,
            trend: mockDashboardMetrics.revenueTrend,
            icon: DollarSign,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
        },
        {
            title: 'Admin ที่ใช้งาน',
            value: mockDashboardMetrics.activeAdmins,
            trend: mockDashboardMetrics.adminsTrend,
            icon: Users,
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
            trendText: 'คนใหม่เดือนนี้',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric, index) => (
                <Card key={index} className="flex flex-col relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-gray-500 text-sm font-medium">{metric.title}</h3>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${metric.iconBg} ${metric.iconColor}`}>
                            <metric.icon className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                        {metric.value}
                    </div>
                    <div className="flex items-center text-sm">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-green-500 font-medium">+{metric.trend}%</span>
                        <span className="text-gray-400 ml-1">{metric.trendText || 'จากเดือนที่แล้ว'}</span>
                    </div>
                </Card>
            ))}
        </div>
    );
};
