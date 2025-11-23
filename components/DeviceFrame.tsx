
import React from 'react';

const DeviceFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="w-[375px] h-[750px] bg-gray-800 dark:bg-gray-900 rounded-[40px] shadow-2xl p-4 border-4 border-gray-600 dark:border-gray-700 flex flex-col">
            <div className="w-full flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-[26px] overflow-y-auto scroll-smooth relative scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 dark:bg-gray-900 rounded-b-xl z-10"></div>
                {children}
            </div>
        </div>
    );
};

export default DeviceFrame;
