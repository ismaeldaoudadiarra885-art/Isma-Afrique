
import React, { useState, useMemo } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../hooks/useTranslation';
import { v4 as uuidv4 } from 'uuid';
import { useNotification } from '../contexts/NotificationContext';
import SecureTransferModal from './SecureTransferModal';

const EnumeratorDashboard: React.FC = () => {
    const { 
        activeProject, 
        addSubmission, 
        setActiveSubmissionId, 
        syncSubmissions, 
        uploadSubmissions,
        currentUserName,
        currentUserCode,
        deleteSubmission,
        updateSubmission
    } = useProject();
    const { t } = useLanguage();
    const { addNotification } = useNotification();
    const [isSyncing, setIsSyncing] = useState(false);
    const [activeView, setActiveView] = useState<'menu' | 'drafts' | 'ready' | 'sent' | 'delete'>('menu');
    const [isTransferModalOpen, setTransferModalOpen] = useState(false);
    
    // Search & Pagination State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    if (!activeProject) return null;

    const drafts = activeProject.submissions.filter(s => s.status === 'draft' || s.status === 'modified');
    const readyToSend = activeProject.submissions.filter(s => s.status === 'finalized');
    const synced = activeProject.submissions.filter(s => s.status === 'synced');
    
    const isSovereignMode = !activeProject.koboAssetUid;

    // --- Actions ---

    const handleNewEntry = () => {
        const newSubmission = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            data: {},
            status: 'draft' as const,
        };
        addSubmission(newSubmission);
        setActiveSubmissionId(newSubmission.id);
        addNotification("Nouveau formulaire créé", "success");
    };

    const handleSync = async () => {
        if (isSovereignMode) {
            if (readyToSend.length === 0) {
                addNotification("Aucun formulaire scellé à transférer.", "info");
                return;
            }
            setTransferModalOpen(true);
            return;
        }

        if (readyToSend.length === 0) {
            addNotification("Synchronisation des données (Téléchargement)...", "info");
        } else {
            addNotification(`Envoi de ${readyToSend.length} formulaire(s) vers Kobo...`, "info");
        }

        setIsSyncing(true);
        
        try {
            if (readyToSend.length > 0) {
                await uploadSubmissions(readyToSend);
                addNotification("Envoi réussi.", "success");
            }
            await syncSubmissions();
            addNotification("Données synchronisées.", "success");

        } catch (e: any) {
            console.error(e);
            addNotification(`Erreur Sync: ${e.message}`, "error");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleTransferComplete = () => {
        readyToSend.forEach(sub => {
            updateSubmission({ ...sub, status: 'synced' });
        });
        addNotification("Transfert enregistré.", "success");
        setTransferModalOpen(false);
    }

    const handleDelete = (id: string) => {
        if(window.confirm("Confirmer la suppression ?")) {
            deleteSubmission(id);
            addNotification("Formulaire supprimé.", "info");
        }
    }

    const handleUpdateForm = () => {
        setIsSyncing(true);
        setTimeout(() => {
            setIsSyncing(false);
            addNotification("Structure du formulaire mise à jour.", "success");
        }, 1000);
    }

    const MenuButton: React.FC<{ 
        icon: React.ReactNode, 
        label: string, 
        subLabel?: string, 
        onClick: () => void, 
        colorClass?: string, 
        count?: number,
        disabled?: boolean,
        fullWidth?: boolean
    }> = ({ icon, label, subLabel, onClick, colorClass = "bg-indigo-600", count, disabled, fullWidth }) => (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={`relative flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md active:scale-[0.98] transition-all text-center group ${fullWidth ? 'w-full' : 'w-full h-32'} ${disabled ? 'opacity-60 grayscale cursor-not-allowed' : 'hover:border-indigo-300'}`}
        >
            <div className={`p-3 rounded-full text-white mb-3 shadow-md ${colorClass} transition-transform group-hover:scale-110`}>
                {icon}
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight">
                {label}
            </h3>
            {subLabel && <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{subLabel}</p>}
            
            {count !== undefined && count > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border border-white dark:border-gray-800 animate-pulse">
                    {count}
                </span>
            )}
        </button>
    );

    const ListView = ({ items, title, type }: { items: typeof drafts, title: string, type: 'edit' | 'view' | 'delete' }) => {
        // Filter Logic
        const filteredItems = useMemo(() => {
            if (!searchTerm) return items;
            const lowerSearch = searchTerm.toLowerCase();
            return items.filter(i => 
                i.id.toLowerCase().includes(lowerSearch) || 
                (i.metadata?.agentCode && i.metadata.agentCode.toLowerCase().includes(lowerSearch)) ||
                JSON.stringify(i.data).toLowerCase().includes(lowerSearch)
            );
        }, [items, searchTerm]);

        // Pagination Logic
        const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
        const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

        return (
            <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 animate-fadeIn">
                <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 border-b dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => { setActiveView('menu'); setSearchTerm(''); }} 
                            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                        </button>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h2>
                            <p className="text-xs text-gray-500">{items.length} élément(s)</p>
                        </div>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Rechercher..." 
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 border-none"
                    />
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {paginatedItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <div className="text-5xl mb-3 opacity-20">📂</div>
                            <p className="text-sm font-medium">Aucun formulaire trouvé.</p>
                        </div>
                    ) : (
                        paginatedItems.map(item => (
                            <div key={item.id} className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center active:scale-[0.99] transition-transform">
                                <div onClick={() => (type === 'edit' || type === 'view') && setActiveSubmissionId(item.id)} className="flex-1 cursor-pointer">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${item.status === 'finalized' ? 'bg-green-100 text-green-800' : (item.status === 'synced' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800')}`}>
                                            {item.status === 'synced' ? 'Envoyé' : (item.status === 'finalized' ? 'Scellé' : 'Brouillon')}
                                        </span>
                                        <p className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate w-32">
                                            {item.id.substring(0, 8)}...
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                                        <span className="flex items-center gap-1"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> {new Date(item.timestamp).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="pl-4">
                                    {(type === 'edit' || type === 'view') && (
                                        <button onClick={() => setActiveSubmissionId(item.id)} className="p-3 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors">
                                            {type === 'edit' ? '✏️' : '👁️'}
                                        </button>
                                    )}
                                    {type === 'delete' && (
                                        <button onClick={() => handleDelete(item.id)} className="p-3 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors">
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination Footer */}
                {totalPages > 1 && (
                    <div className="p-4 border-t dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
                        <button 
                            disabled={currentPage === 1} 
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50 text-sm"
                        >
                            Précédent
                        </button>
                        <span className="text-xs text-gray-500">Page {currentPage} / {totalPages}</span>
                        <button 
                            disabled={currentPage === totalPages} 
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50 text-sm"
                        >
                            Suivant
                        </button>
                    </div>
                )}
            </div>
        );
    };

    if (activeView === 'drafts') return <ListView items={drafts} title="Brouillons" type="edit" />;
    if (activeView === 'ready') return <ListView items={readyToSend} title="Scellés & Prêts" type="view" />;
    if (activeView === 'sent') return <ListView items={synced} title="Historique Envoyés" type="view" />;
    if (activeView === 'delete') return <ListView items={[...drafts, ...readyToSend, ...synced]} title="Gestion Stockage" type="delete" />;

    return (
        <div className="h-full bg-gray-100 dark:bg-gray-900 p-4 overflow-y-auto animate-fadeIn">
            <div className="max-w-md mx-auto space-y-6">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center text-white font-bold text-xl">
                                {(currentUserName || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-lg font-bold leading-none">
                                    {currentUserName || 'Agent Terrain'}
                                </h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="bg-black/30 px-2 py-0.5 rounded text-xs font-mono border border-white/20">
                                        {currentUserCode || 'NO-ID'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs font-mono text-indigo-100">
                        <div className="bg-black/20 px-2 py-1 rounded">v{activeProject.formData.settings.version}</div>
                        <div>{readyToSend.length} prêt(s) à envoyer</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <MenuButton 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>}
                            label="Nouvelle Enquête"
                            subLabel="Commencer la saisie"
                            onClick={handleNewEntry}
                            colorClass="bg-indigo-600"
                            fullWidth={true}
                        />
                    </div>

                    <MenuButton 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                        label="Brouillons"
                        subLabel="En cours"
                        onClick={() => setActiveView('drafts')}
                        colorClass="bg-orange-500"
                        count={drafts.length}
                    />

                    <MenuButton 
                        icon={isSyncing ? <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : (isSovereignMode ? <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.2-2.858.578-4.18M7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>)}
                        label={isSovereignMode ? "Transfert Sécurisé" : "Envoyer / Sync"}
                        subLabel={isSovereignMode ? "QR / Fichier" : "Cloud Kobo"}
                        onClick={handleSync}
                        colorClass={readyToSend.length > 0 ? (isSovereignMode ? "bg-purple-600" : "bg-green-600") : "bg-gray-400"}
                        count={readyToSend.length}
                        disabled={isSyncing}
                    />

                    <MenuButton 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
                        label="Historique"
                        subLabel="Déjà transférés"
                        onClick={() => setActiveView('sent')}
                        colorClass="bg-blue-500"
                        count={synced.length}
                    />

                    <MenuButton 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                        label="Mettre à jour"
                        subLabel="Formulaire"
                        onClick={handleUpdateForm}
                        colorClass="bg-teal-600"
                    />
                </div>
                
                <div className="pt-4">
                    <button 
                        onClick={() => setActiveView('delete')}
                        className="w-full text-center text-xs text-red-400 hover:text-red-600 underline"
                    >
                        Gérer le stockage local
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs border ${isSovereignMode ? 'border-purple-200' : 'border-green-200'}`}>
                        {activeProject.koboAssetUid ? (
                            <>
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Mode Cloud (Connecté)
                            </>
                        ) : (
                            <>
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                Mode Souverain (Local)
                            </>
                        )}
                    </div>
                </div>
            </div>
            <SecureTransferModal 
                isOpen={isTransferModalOpen} 
                onClose={() => setTransferModalOpen(false)} 
                submissions={readyToSend}
                onTransferComplete={handleTransferComplete}
                mode="sender"
            />
        </div>
    );
};

export default EnumeratorDashboard;
