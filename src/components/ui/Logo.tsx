import React from 'react';

// Using standard Next.js Head or just a simple icon component since this is a UI prototype
export const HopsLogo = ({ className = "" }: { className?: string }) => (
    <div className={`flex items-center justify-center bg-primary-teal text-white font-bold rounded-lg w-12 h-12 ${className}`}>
        HOPS
    </div>
);

export const HopsLogoText = ({ className = "" }: { className?: string }) => (
    <div className={`flex items-center gap-2 ${className}`}>
        <HopsLogo className="text-xs" />
        <span className="font-bold text-xl text-gray-900">Hops</span>
    </div>
);
