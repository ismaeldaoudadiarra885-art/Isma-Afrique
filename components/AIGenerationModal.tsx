
import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';
import { generateFormFromPrompt } from '../services/geminiService';
import { useLanguage } from '../hooks/useTranslation';

interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIGenerationModal: React.FC<AIGenerationModalProps> = ({ isOpen, onClose }) => {
    const { createProject } = useProject();
    const { addNotification } = useNotification();
    const { t } = useLanguage();

    const [projectName, setProjectName] = useState('');
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [advancedMode, setAdvancedMode] = useState(false);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!projectName.trim() || !prompt.trim()) {
            addNotification("Veuillez remplir le nom du projet et la description.", 'warning');
            return;
        }
        setIsGenerating(true);
        addNotification(t('notification_aiGenerationStart'), 'info');
        try {
            const formData = await generateFormFromPrompt(prompt, projectName);
            console.log('FormData généré par IA avancée (survey length):', formData.survey.length, formData.survey);

            // Validation supplémentaire
            if (formData.survey.length < 3) {
                addNotification('Formulaire généré avec peu de questions. Vous pouvez l\'enrichir dans le mode concepteur.', 'warning');
            }

            createProject(projectName, formData);
            console.log('Projet IA avancé créé et actif set');
            addNotification(t('notification_aiGenerationSuccess'), 'success');

            // Statistiques du formulaire généré
            const questionTypes = formData.survey.reduce((acc, q) => {
                acc[q.type] = (acc[q.type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            addNotification(`Formulaire créé avec ${formData.survey.length} questions (${Object.entries(questionTypes).map(([type, count]) => `${count} ${type}`).join(', ')})`, 'info');

            onClose();
        } catch (error: any) {
            console.error('Erreur génération IA avancée:', error);
            addNotification(error.message || 'Erreur lors de la génération du formulaire', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";
    const inputClass = "mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-deep focus:ring-indigo-deep dark:bg-gray-700 dark:border-gray-600";

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
                <header className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold">{t('aiGenerationModal_title')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-6 space-y-4">
                     <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t('aiGenerationModal_description')}
                    </p>
                    <div>
                        <label htmlFor="projectName" className={labelClass}>{t('aiGenerationModal_projectNameLabel')}</label>
                        <input type="text" id="projectName" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder={t('aiGenerationModal_projectNamePlaceholder')} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="prompt" className={labelClass}>{t('aiGenerationModal_promptLabel')}</label>
                        <textarea id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} rows={5} placeholder={t('aiGenerationModal_promptPlaceholder')} className={inputClass} />
                    </div>
                </main>
                <footer className="p-4 flex justify-between items-center border-t dark:border-gray-700">
                    <div className="text-xs text-gray-500">
                        {advancedMode && (
                            <span>⚡ Mode IA avancé activé - Génération optimisée</span>
                        )}
                    </div>
                     <button onClick={handleGenerate} disabled={isGenerating} className="px-4 py-2 text-sm font-medium text-white bg-indigo-deep rounded-md hover:bg-indigo-deep-dark disabled:opacity-50">
                        {isGenerating ? t('aiGenerationModal_generatingButton') : t('aiGenerationModal_generateButton')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AIGenerationModal;