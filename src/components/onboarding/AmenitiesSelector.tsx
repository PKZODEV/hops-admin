'use client';

import React, { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { Sparkles, LucideIcon } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

interface AmenitiesSelectorProps {
    selected: string[];
    onChange: (selected: string[]) => void;
    type?: 'HOTEL' | 'ROOM';
    columns?: number;
}

interface Amenity {
    id: string;
    name: string;
    icon?: string | null;
    type: 'HOTEL' | 'ROOM';
}

function renderIcon(name?: string | null, className = 'w-5 h-5') {
    if (!name) return <Sparkles className={className} />;
    const Comp = (Icons as unknown as Record<string, LucideIcon>)[name];
    return Comp ? <Comp className={className} /> : <Sparkles className={className} />;
}

export const AmenitiesSelector = ({ selected, onChange, type = 'HOTEL', columns = 3 }: AmenitiesSelectorProps) => {
    const [amenities, setAmenities] = useState<Amenity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`${API}/amenities?type=${type}`, { credentials: 'include' })
            .then(r => r.json())
            .then((data: Amenity[]) => setAmenities(Array.isArray(data) ? data : []))
            .catch(() => setAmenities([]))
            .finally(() => setLoading(false));
    }, [type]);

    const toggleAmenity = (name: string) => {
        onChange(selected.includes(name) ? selected.filter(i => i !== name) : [...selected, name]);
    };

    if (loading) {
        return <div className="text-sm text-gray-400 py-6 animate-pulse">กำลังโหลดสิ่งอำนวยความสะดวก...</div>;
    }

    if (amenities.length === 0) {
        return <div className="text-sm text-gray-400 py-6">ยังไม่มีรายการสิ่งอำนวยความสะดวก</div>;
    }

    const gridCls = columns === 2
        ? 'grid grid-cols-1 md:grid-cols-2 gap-3'
        : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3';

    return (
        <div className={gridCls}>
            {amenities.map(a => {
                const isSelected = selected.includes(a.name);
                return (
                    <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAmenity(a.name)}
                        className={`flex items-center gap-3 p-4 rounded-lg border text-sm font-medium transition-colors text-left ${
                            isSelected
                                ? 'border-primary-teal bg-teal-50 text-primary-teal'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <span className={isSelected ? 'text-primary-teal' : 'text-gray-500'}>
                            {renderIcon(a.icon, 'w-5 h-5')}
                        </span>
                        {a.name}
                    </button>
                );
            })}
        </div>
    );
};
