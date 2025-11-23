
import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { v4 as uuidv4 } from 'uuid';
import SimulationModal from './SimulationModal';
import DataView from './DataView';
import { useLanguage } from '../hooks/useTranslation';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const CollecteSidebar: React.FC = () => {
    const { activeProject, activeSubmissionId, setActiveSubmissionId, addSubmission, userRole } = useProject();
    const [isSimModalOpen, setSimModalOpen] = useState(false);
    const [isDataViewOpen, setIsDataViewOpen] = useState(false);
    const { t } = useLanguage();
    const { isOnline } = useOnlineStatus();

    if (!activeProject) return null;

    const { submissions } = activeProject;

    const handleNewEntry = () => {
        const newSubmission = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            data: {},
            status: 'draft' as const,
        };
        addSubmission(newSubmission);
        setActiveSubmissionId(newSubmission.id);
    };

    const getStatusColor = (status: 'draft' | 'synced' | 'modified' | 'error') => {
        switch (status) {
            case 'synced': return 'bg-green-tamani';
            case 'modified': return 'bg-ocre-gold';
            case 'error': return 'bg-red-earth';
            default: return 'bg-gray-400';
        }
    };
    
    return (
        <>
            <aside className="w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-r border-white/20 dark:border-gray-700/50 flex flex-col flex-shrink-0 shadow-xl">
                <div className="p-4 border-b dark:border-gray-700 space-y-2">
                    <button onClick={handleNewEntry} className="w-full px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-lg transition-all duration-300 hover:scale-105">
                       {t('collecte_newEntry')}
                    </button>
                    <button onClick={() => setSimModalOpen(true)} className="w-full px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 rounded-md">
                        {t('collecte_simulation')}
                    </button>
                    {userRole === 'admin' || userRole === 'project_manager' ? (
                        <button onClick={() => setIsDataViewOpen(true)} className="w-full px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-md">
                            Voir les données
                        </button>
                    ) : null}
                    <button disabled={!isOnline} className={`w-full px-4 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 ${!isOnline ? 'bg-gray-200 dark:bg-gray-700 opacity-50' : 'bg-blue-500 hover:bg-blue-600 text-white'}`} title={!isOnline ? t('collecte_sync_tooltip') : 'Synchroniser les données'}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h5M20 20v-5h-5M4 4l16 16" /></svg>
                        {t('collecte_synchronize')}
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {submissions.length === 0 ? (
                         <p className="p-4 text-center text-sm text-gray-500">{t('collecte_noSubmissions')}</p>
                    ) : (
                        <ul className="space-y-2 p-2">
                            {submissions.slice().reverse().map(sub => (
                                <li key={sub.id} onClick={() => setActiveSubmissionId(sub.id)}
                                    className={`p-4 cursor-pointer border-l-4 rounded-r-lg transition-all duration-200 hover:scale-102 ${activeSubmissionId === sub.id ? 'bg-gradient-to-r from-indigo-deep-light to-indigo-deep/20 dark:from-indigo-deep/30 dark:to-indigo-deep/10 border-indigo-deep shadow-lg' : 'border-transparent hover:bg-white/50 dark:hover:bg-gray-700/30 hover:shadow-md'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm font-mono truncate font-semibold text-gray-800 dark:text-gray-200">ID: {sub.id.substring(0, 8)}</p>
                                        <span className={`w-3 h-3 rounded-full ${getStatusColor(sub.status)} shadow-sm`} title={`Statut: ${sub.status}`}></span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{new Date(sub.timestamp).toLocaleString()}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </aside>
            <SimulationModal isOpen={isSimModalOpen} onClose={() => setSimModalOpen(false)} />
            {isDataViewOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-11/12 h-5/6 max-w-6xl overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                            <h2 className="text-lg font-semibold">Données du projet</h2>
                            <button onClick={() => setIsDataViewOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                ✕
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <DataView />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CollecteSidebar;