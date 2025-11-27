
import React, { useRef, useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';
import { importProjectFromWordFile } from '../services/wordImportService';
import { KoboProject } from '../types';
import AIGenerationModal from './AIGenerationModal';
import ImportStatusModal from './ImportStatusModal';
import { demoProject } from '../data/demoProject';
import { useLanguage } from '../hooks/useTranslation';
import IsmaLogo from './IsmaLogo';

const WelcomeScreen: React.FC = () => {
    const { createProject, loadProject } = useProject();
    const { addNotification } = useNotification();
    const { t } = useLanguage();
    const wordFileInputRef = useRef<HTMLInputElement>(null);
    const jsonFileInputRef = useRef<HTMLInputElement>(null);
    const [isAIGenModalOpen, setAIGenModalOpen] = useState(false);
    const [importMessage, setImportMessage] = useState<string>('');
    
    const handleImportWord = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImportMessage(t('notificationImporting'));
        try {
            const { project, warnings } = await importProjectFromWordFile(file, setImportMessage);
            loadProject(project);
            addNotification(t('notificationImportSuccess'), 'success');
            warnings.forEach(w => addNotification(w, 'info'));
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
                    addNotification(t('notificationSovereignImportSuccess'), 'success');
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
    }

    const WelcomeCard: React.FC<{title: string, description: string, onClick: () => void, icon: string, color: string}> = ({ title, description, onClick, icon, color }) => (
         <div 
            onClick={onClick} 
            className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center group h-full"
        >
            <div className={`text-4xl mb-4 p-4 rounded-full ${color} text-white shadow-md group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{description}</p>
        </div>
    );

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-6 overflow-x-hidden relative">
            
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>

            <div className="relative z-10 text-center mb-12 flex flex-col items-center">
                <IsmaLogo className="h-24 w-auto mb-6" variant="color" />
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
                    Bienvenue sur <span className="text-indigo-600">ISMA Afrique</span>
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    {t('welcomeSubtitle')}
                </p>
                <div className="mt-4 flex gap-2">
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full border border-green-200">v2.5 Stable</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full border border-blue-200">PWA Ready</span>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full relative z-10">
                <WelcomeCard 
                    title={t('welcomeCreateAITitle')} 
                    description={t('welcomeCreateAIDesc')} 
                    onClick={() => setAIGenModalOpen(true)} 
                    icon="✨"
                    color="bg-gradient-to-br from-purple-500 to-indigo-600"
                />
                
                <WelcomeCard 
                    title={t('welcomeImportTitle')} 
                    description={t('welcomeImportDesc')} 
                    onClick={() => wordFileInputRef.current?.click()} 
                    icon="📝"
                    color="bg-blue-500"
                />
                <input type="file" ref={wordFileInputRef} onChange={handleImportWord} accept=".docx" style={{ display: 'none' }} />

                <WelcomeCard 
                    title={t('welcomeImportSovereignTitle')} 
                    description={t('welcomeImportSovereignDesc')} 
                    onClick={() => jsonFileInputRef.current?.click()} 
                    icon="💾"
                    color="bg-orange-500"
                />
                <input type="file" ref={jsonFileInputRef} onChange={handleImportJson} accept=".json" style={{ display: 'none' }} />

                 <WelcomeCard 
                    title={t('welcomeDemoTitle')} 
                    description={t('welcomeDemoDesc')} 
                    onClick={handleLoadDemo} 
                    icon="🚀"
                    color="bg-teal-500"
                />
            </div>

            <div className="mt-16 text-center border-t border-gray-200 dark:border-gray-800 pt-8 w-full max-w-2xl">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Conception & Développement
                </p>
                <p className="text-base font-bold text-gray-700 dark:text-gray-200 mt-2">
                    Ismaël Daouda DIARRA
                </p>
                <div className="flex justify-center items-center gap-4 mt-2 text-xs font-mono text-gray-400">
                    <span className="flex items-center gap-1">📞 83-62-98-31</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="flex items-center gap-1">📞 62-76-02-24</span>
                </div>
            </div>

            <AIGenerationModal isOpen={isAIGenModalOpen} onClose={() => setAIGenModalOpen(false)} />
            <ImportStatusModal isOpen={!!importMessage} message={importMessage} />
        </div>
    );
};

export default WelcomeScreen;
