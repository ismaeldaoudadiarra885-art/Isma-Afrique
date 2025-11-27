
import React, { useState, useEffect } from 'react';
import { useNotification } from '../contexts/NotificationContext';

const StorageMonitor: React.FC = () => {
    const [usage, setUsage] = useState<{ used: number, quota: number, percent: number } | null>(null);
    const { addNotification } = useNotification();

    useEffect(() => {
        checkStorage();
        const interval = setInterval(checkStorage, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    const checkStorage = async () => {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                if (estimate.usage !== undefined && estimate.quota !== undefined) {
                    const usedMB = estimate.usage / (1024 * 1024);
                    const quotaMB = estimate.quota / (1024 * 1024);
                    const percent = (estimate.usage / estimate.quota) * 100;
                    
                    setUsage({ used: usedMB, quota: quotaMB, percent });

                    if (percent > 80) {
                        addNotification("Attention : Espace de stockage presque saturé (>80%) !", "warning");
                    }
                }
            } catch (e) {
                console.error("Storage estimate failed", e);
            }
        }
    };

    if (!usage) return null;

    const getColor = (p: number) => {
        if (p < 50) return 'bg-green-500';
        if (p < 80) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="px-4 py-2 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Stockage Appareil</span>
                <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400">
                    {usage.used.toFixed(1)} Mo / {usage.quota.toFixed(0)} Mo
                </span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ${getColor(usage.percent)}`} 
                    style={{ width: `${usage.percent}%` }}
                ></div>
            </div>
            {usage.percent > 90 && (
                <button 
                    onClick={() => window.alert("Espace critique. Veuillez synchroniser et supprimer les formulaires envoyés.")}
                    className="mt-2 text-[10px] text-red-600 hover:underline w-full text-center"
                >
                    Libérer de l'espace
                </button>
            )}
        </div>
    );
};

export default StorageMonitor;
