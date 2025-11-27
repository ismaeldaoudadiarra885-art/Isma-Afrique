
import React, { useState, useRef } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../hooks/useTranslation';
import { importProjectFromWordFile } from '../services/wordImportService';
import { KoboProject } from '../types';
import { demoProject } from '../data/demoProject';
import AIGenerationModal from './AIGenerationModal';
import ImportStatusModal from './ImportStatusModal';
import { useNotification } from '../contexts/NotificationContext';

interface ProjectSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProjectSwitcherModal: React.FC<ProjectSwitcherModalProps> = ({ isOpen, onClose }) => {
    const { projects, activeProjectId, setActiveProject, createProject, deleteProject, loadProject, duplicateProject } = useProject();
    const { t } = useLanguage();
    const { addNotification } = useNotification();
    
    const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
    
    // États pour la création
    const [isAIGenModalOpen, setAIGenModalOpen] = useState(false);
    const [importMessage, setImportMessage] = useState<string>('');
    const wordFileInputRef = useRef<HTMLInputElement>(null);
    const jsonFileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    // Handlers pour les "4 Boutons"
    const handleImportWord = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setImportMessage(t('notificationImporting'));
        try {
            const { project, warnings } = await importProjectFromWordFile(file, setImportMessage);
            loadProject(project);
            addNotification(t('notificationImportSuccess'), 'success');
            warnings.forEach(w => addNotification(w, 'info'));
            onClose();
        } catch (error: any) {
            addNotification(`${t('notificationImportError')}: ${error.message}`, 'error');
        } finally {
            setImportMessage('');
            if(wordFileInputRef.current) wordFileInputRef.current.value = "";
        }
    };

    const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const project = JSON.parse(e.target?.result as string) as KoboProject;
                if (project.id && project.name && project.formData) {
                    loadProject(project);
                    addNotification("Projet collaboratif chargé avec succès.", 'success');
                    onClose();
                } else {
                    throw new Error("Fichier JSON invalide.");
                }
            } catch (error) {
                addNotification(t('notificationSovereignImportError'), 'error');
            } finally {
                 if(jsonFileInputRef.current) jsonFileInputRef.current.value = "";
            }
        };
        reader.readAsText(file);
    };

    const handleLoadDemo = () => {
        loadProject(JSON.parse(JSON.stringify(demoProject)));
        addNotification("Projet de démonstration chargé.", 'success');
        onClose();
    };

    const handleDelete = (e: React.MouseEvent, projectId: string, projectName: string) => {
        e.stopPropagation();
        if (window.confirm(t('confirmDeleteProject', { projectName }))) {
            deleteProject(projectId);
        }
    };

    const handleDuplicate = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        duplicateProject(projectId);
        addNotification("Projet dupliqué avec succès. Les données ont été réinitialisées.", "success");
    };

    const handleSelect = (projectId: string) => {
        setActiveProject(projectId);
        onClose();
    };

    const CreationOption = ({ icon, title, desc, onClick, color }: any) => (
        <button 
            onClick={onClick}
            className="flex flex-col items-start p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 transition-all text-left group w-full"
        >
            <div className={`p-2 rounded-lg text-white mb-2 ${color} shadow-sm group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <h4 className="font-bold text-gray-800 dark:text-white text-sm">{title}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{desc}</p>
        </button>
    );

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
                    
                    {/* Header */}
                    <header className="flex justify-between items-center p-5 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('projectManager')}</h2>
                            <p className="text-xs text-gray-500">Gérez vos enquêtes ou démarrez-en une nouvelle</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </header>

                    {/* Tabs */}
                    <div className="flex border-b dark:border-gray-700">
                        <button 
                            onClick={() => setActiveTab('list')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'list' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                            📂 Mes Projets ({projects.length})
                        </button>
                        <button 
                            onClick={() => setActiveTab('create')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'create' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                            ✨ Créer / Importer
                        </button>
                    </div>

                    <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-900/50">
                        
                        {/* VUE LISTE */}
                        {activeTab === 'list' && (
                            <div className="space-y-3">
                                {projects.length > 0 ? (
                                    projects.map(p => (
                                        <div key={p.id} onClick={() => handleSelect(p.id)} className={`group p-4 rounded-xl flex justify-between items-center cursor-pointer border transition-all ${p.id === activeProjectId ? 'bg-white dark:bg-gray-800 border-indigo-500 shadow-md' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 hover:shadow-sm'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-xl ${p.id === activeProjectId ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                                                    {p.id === activeProjectId ? '⚡' : '📁'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 dark:text-gray-200">{p.name}</p>
                                                    <p className="text-xs text-gray-500">Modifié : {new Date(p.updatedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {p.id === activeProjectId && 
                                                    <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">ACTIF</span>
                                                }
                                                {/* Bouton Dupliquer */}
                                                <button 
                                                    onClick={(e) => handleDuplicate(e, p.id)} 
                                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Dupliquer le projet (ex: Endline)"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                </button>
                                                
                                                {/* Bouton Supprimer */}
                                                <button 
                                                    onClick={(e) => handleDelete(e, p.id, p.name)} 
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title={t('delete')}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <p className="text-gray-400 text-lg">Aucun projet.</p>
                                        <button onClick={() => setActiveTab('create')} className="mt-2 text-indigo-600 hover:underline font-medium">Créer votre premier projet</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* VUE CRÉATION (LES 4 BOUTONS) */}
                        {activeTab === 'create' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CreationOption 
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                                    title="Assistant IA"
                                    desc="Décrivez votre besoin, l'IA génère le formulaire."
                                    onClick={() => setAIGenModalOpen(true)}
                                    color="bg-gradient-to-br from-purple-500 to-indigo-600"
                                />
                                
                                <CreationOption 
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                                    title="Importer Word"
                                    desc="Convertir un questionnaire .docx existant."
                                    onClick={() => wordFileInputRef.current?.click()}
                                    color="bg-blue-600"
                                />
                                <input type="file" ref={wordFileInputRef} onChange={handleImportWord} accept=".docx" style={{ display: 'none' }} />

                                <CreationOption 
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>}
                                    title="Importer / Collaboration"
                                    desc="Charger un Fichier Maître (.json) exporté."
                                    onClick={() => jsonFileInputRef.current?.click()}
                                    color="bg-orange-500"
                                />
                                <input type="file" ref={jsonFileInputRef} onChange={handleImportJson} accept=".json" style={{ display: 'none' }} />

                                <CreationOption 
                                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                                    title="Projet Démo"
                                    desc="Explorer un exemple complet."
                                    onClick={handleLoadDemo}
                                    color="bg-teal-600"
                                />
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <AIGenerationModal isOpen={isAIGenModalOpen} onClose={() => setAIGenModalOpen(false)} />
            <ImportStatusModal isOpen={!!importMessage} message={importMessage} />
        </>
    );
};

export default ProjectSwitcherModal;
