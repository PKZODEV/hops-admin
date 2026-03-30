'use client';

import React from 'react';
import { Wifi, Car, Coffee, Waves, Dumbbell, Wind, UtensilsCrossed, Sparkles, BellRing, WashingMachine, Users, PlaneTakeoff } from 'lucide-react';

interface AmenitieSelectorProps {
    selected: string[];
    onChange: (selected: string[]) => void;
}

export const AmenitiesSelector = ({ selected, onChange }: AmenitieSelectorProps) => {
    const amenities = [
        { id: 'wifi', label: 'Wi-Fi ฟรี', icon: Wifi },
        { id: 'breakfast', label: 'อาหารเช้า', icon: Coffee },
        { id: 'restaurant', label: 'ร้านอาหาร', icon: UtensilsCrossed },
        { id: 'gym', label: 'ฟิตแนส', icon: Dumbbell },
        { id: 'parking', label: 'ที่จอดรถ', icon: Car },
        { id: 'pool', label: 'สระว่ายน้ำ', icon: Waves },
        { id: 'spa', label: 'สปา', icon: Sparkles },
        { id: 'roomservice', label: 'บริการห้อง', icon: BellRing },
        { id: 'laundry', label: 'ซักรีด', icon: WashingMachine },
        { id: 'reception24', label: 'บริการต้อนรับ 24 ชม.', icon: Users },
        { id: 'meetingroom', label: 'ห้องประชุม', icon: Wind },
        { id: 'airporttransfer', label: 'รับส่งสนามบิน', icon: PlaneTakeoff },
    ];

    const toggleAmenity = (id: string) => {
        onChange(
            selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id]
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {amenities.map(amenity => {
                const isSelected = selected.includes(amenity.id);
                return (
                    <button
                        key={amenity.id}
                        type="button"
                        onClick={() => toggleAmenity(amenity.id)}
                        className={`
              flex items-center gap-3 p-4 rounded-lg border text-sm font-medium transition-colors text-left
              ${isSelected
                                ? 'border-primary-teal bg-teal-50 text-primary-teal'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}
            `}
                    >
                        <amenity.icon className={`w-5 h-5 ${isSelected ? 'text-primary-teal' : 'text-gray-500'}`} />
                        {amenity.label}
                    </button>
                );
            })}
        </div>
    );
};
