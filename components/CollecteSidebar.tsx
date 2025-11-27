
import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { v4 as uuidv4 } from 'uuid';
import SimulationModal from './SimulationModal';
import { useLanguage } from '../hooks/useTranslation';
import { useNotification } from '../contexts/NotificationContext';

const CollecteSidebar: React.FC = () => {
    const { activeProject, activeSubmissionId, setActiveSubmissionId, addSubmission, syncSubmissions } = useProject();
    const [isSimModalOpen, setSimModalOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const { t } = useLanguage();
    const { addNotification } = useNotification();

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
    
    const handleSync = async () => {
        if (!activeProject.koboAssetUid) {
            addNotification("Ce projet n'est pas connecté à KoboToolbox. Veuillez le configurer dans 'Déploiement'.", "warning");
            return;
        }

        setIsSyncing(true);
        addNotification(t('notification_sync_started'), 'info');
        try {
            await syncSubmissions();
            addNotification(t('notification_sync_success'), 'success');
        } catch (error: any) {
            console.error("Sync error:", error);
            addNotification(`${t('notification_sync_error')} : ${error.message}`, 'error');
        } finally {
            setIsSyncing(false);
        }
    }

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
            <aside className="w-80 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col flex-shrink-0 z-10">
                <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 space-y-3">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Actions</h3>
                    <button onClick={handleNewEntry} className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-deep rounded-md shadow-sm hover:bg-indigo-deep-dark transition-colors flex items-center justify-center gap-2">
                       <span>+</span> {t('collecte_newEntry')}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setSimModalOpen(true)} className="px-3 py-2 text-xs font-medium bg-white border border-gray-300 dark:bg-gray-700 dark:border-gray-600 rounded-md hover:bg-gray-50 shadow-sm">
                            {t('collecte_simulation')}
                        </button>
                        <button 
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="px-3 py-2 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-md hover:bg-green-100 disabled:opacity-50 flex items-center justify-center gap-1 shadow-sm" 
                            title={t('collecte_sync_tooltip')}
                        >
                            {isSyncing ? (
                                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M4 4l16 16" /></svg>
                            )}
                            {isSyncing ? '...' : 'Sync Kobo'}
                        </button>
                    </div>
                </div>
                
                <div className="p-3 bg-gray-100 dark:bg-gray-900 border-b dark:border-gray-700 flex justify-between items-center text-xs text-gray-500">
                    <span>{submissions.length} soumission(s)</span>
                    <span>Trier par date ↓</span>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {submissions.length === 0 ? (
                         <div className="flex flex-col items-center justify-center h-48 text-gray-400 p-4 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            <p className="text-sm">{t('collecte_noSubmissions')}</p>
                            <p className="text-xs mt-1">Créez une entrée ou synchronisez avec Kobo.</p>
                         </div>
                    ) : (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                            {submissions.slice().reverse().map(sub => (
                                <li key={sub.id} onClick={() => setActiveSubmissionId(sub.id)}
                                    className={`p-3 cursor-pointer transition-colors border-l-4 ${activeSubmissionId === sub.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-deep' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded text-white ${getStatusColor(sub.status)}`}>
                                            {sub.status === 'synced' ? 'KOBO' : (sub.status === 'draft' ? 'BROUILLON' : sub.status)}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-mono">{sub.id.substring(0, 6)}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {new Date(sub.timestamp).toLocaleString()}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </aside>
            <SimulationModal isOpen={isSimModalOpen} onClose={() => setSimModalOpen(false)} />
        </>
    );
};

export default CollecteSidebar;
