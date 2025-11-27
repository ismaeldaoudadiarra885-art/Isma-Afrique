
import React from 'react';

const DeviceFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="w-[375px] h-[750px] bg-gray-800 dark:bg-gray-900 rounded-[40px] shadow-2xl p-4 border-4 border-gray-600 dark:border-gray-700">
            <div className="w-full h-full bg-white dark:bg-gray-800 rounded-[26px] overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 dark:bg-gray-900 rounded-b-xl z-10"></div>
                {children}
            </div>
        </div>
    );
};

export default DeviceFrame;
