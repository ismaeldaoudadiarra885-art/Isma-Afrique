import React, { useRef, useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';
import { importProjectFromWordFile } from '../services/wordImportService';
import { KoboProject } from '../types';
import AIGenerationModal from './AIGenerationModal';
import ImportStatusModal from './ImportStatusModal';
import { demoProject } from '../data/demoProject';
import { useLanguage } from '../hooks/useTranslation';

const WelcomeScreen: React.FC = () => {
    const { createProject, loadProject, setActiveProject } = useProject();
    const { addNotification } = useNotification();
    const { t } = useLanguage();
    const wordFileInputRef = useRef<HTMLInputElement>(null);
    const jsonFileInputRef = useRef<HTMLInputElement>(null);
    const [isAIGenModalOpen, setAIGenModalOpen] = useState(false);
    const [importMessage, setImportMessage] = useState<string>('');
    
    const handleImportWord = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        console.log('Import Word started with file:', file.name, 'size:', file.size);
        setImportMessage(t('notificationImporting'));
        try {
            const { project, warnings } = await importProjectFromWordFile(file, setImportMessage);
            console.log('Project imported successfully:', project.name, 'questions:', project.formData.survey.length);

            // Vérifier que le projet a des questions avant de continuer
            if (project.formData.survey.length === 0) {
                throw new Error('Aucune question n\'a pu être extraite du document Word. Vérifiez que le document contient du texte structuré (questions numérotées, sections, etc.).');
            }

            await loadProject(project);
            console.log('Project loaded and set as active. Survey length:', project.formData.survey.length);
            addNotification(t('notificationImportSuccess'), 'success');
            warnings.forEach(w => addNotification(w, 'info'));
            setImportMessage('');

        } catch (error: any) {
            console.error('Import Word error:', error);
            addNotification(`${t('notificationImportError')}: ${error.message}`, 'error');
            setImportMessage('');
        } finally {
            if(wordFileInputRef.current) wordFileInputRef.current.value = ""; // Reset file input
        }
    };
    
    const handleImportJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        console.log('Import JSON started with file:', file.name, 'size:', file.size);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const project = JSON.parse(e.target?.result as string) as KoboProject;
                console.log('JSON parsed successfully:', project.name, 'survey length:', project.formData?.survey?.length || 0);
                // Basic validation
                if (project.id && project.name && project.formData) {
                    if (project.formData.survey.length === 0) {
                        console.warn('Survey vide dans JSON importé');
                    }
                    await loadProject(project);
                    await setActiveProject(project.id);
                    console.log('JSON project loaded and set as active. Survey length:', project.formData.survey.length);
                    addNotification(t('notificationSovereignImportSuccess'), 'success');
                    if (project.formData.survey.length === 0) {
                        addNotification('Projet chargé mais sans questions. Ajoutez-en dans le mode concepteur.', 'warning');
                    }
                } else {
                    throw new Error("Fichier JSON invalide.");
                }
            } catch (error: any) {
                console.error('Import JSON error:', error);
                addNotification(t('notificationSovereignImportError'), 'error');
            } finally {
                 if(jsonFileInputRef.current) jsonFileInputRef.current.value = "";
            }
        };
        reader.readAsText(file);
    };
    
    const handleLoadDemo = async () => {
        const demoCopy = JSON.parse(JSON.stringify(demoProject)); // Deep copy to avoid mutation
        await loadProject(demoCopy);
        await setActiveProject(demoCopy.id);
        addNotification("Projet de démonstration chargé.", 'success');
    }

    const WelcomeCard: React.FC<{title: string, description: string, onClick: () => void}> = ({ title, description, onClick }) => (
         <div onClick={onClick} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer border dark:border-gray-700 flex flex-col items-center justify-center text-center">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{description}</p>
        </div>
    );

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <div className="flex justify-center mb-6">
                <img src="/ISMA.png" alt="ISMA Afrique Logo" className="h-20 w-auto animate-bounce-in hover:scale-110 transition-transform duration-500 drop-shadow-2xl" />
            </div>
            <p className="text-2xl font-semibold text-center text-gray-700 dark:text-gray-200 mb-10 max-w-3xl">{t('welcomeSubtitle')}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl">
                <WelcomeCard title={t('welcomeCreateAITitle')} description={t('welcomeCreateAIDesc')} onClick={() => setAIGenModalOpen(true)} />
                
                <WelcomeCard title={t('welcomeImportTitle')} description={t('welcomeImportDesc')} onClick={() => wordFileInputRef.current?.click()} />
                <input type="file" ref={wordFileInputRef} onChange={handleImportWord} accept=".docx" style={{ display: 'none' }} />

                <WelcomeCard title={t('welcomeImportSovereignTitle')} description={t('welcomeImportSovereignDesc')} onClick={() => jsonFileInputRef.current?.click()} />
                <input type="file" ref={jsonFileInputRef} onChange={handleImportJson} accept=".json" style={{ display: 'none' }} />

                 <WelcomeCard title={t('welcomeDemoTitle')} description={t('welcomeDemoDesc')} onClick={handleLoadDemo} />
            </div>

            <AIGenerationModal isOpen={isAIGenModalOpen} onClose={() => setAIGenModalOpen(false)} />
            <ImportStatusModal isOpen={!!importMessage} message={importMessage} />
        </div>
    );
};

export default WelcomeScreen;