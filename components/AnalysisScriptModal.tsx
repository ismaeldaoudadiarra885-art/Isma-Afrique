import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';
import { getAssistance } from '../services/geminiService';
import { useLanguage } from '../hooks/useTranslation';

interface AnalysisScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AnalysisScriptModal: React.FC<AnalysisScriptModalProps> = ({ isOpen, onClose }) => {
    const { activeProject } = useProject();
    const { addNotification } = useNotification();
    const { t } = useLanguage();
    
    const [scriptContent, setScriptContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [targetLang, setTargetLang] = useState<'R' | 'Stata'>('R');

    if (!isOpen || !activeProject) return null;

    const handleGenerate = async (lang: 'R' | 'Stata') => {
        setTargetLang(lang);
        setIsGenerating(true);
        setScriptContent('');

        const questionList = activeProject.formData.survey
            .map(q => `- ${q.name} (${q.type}): ${q.label.default}`)
            .join('\n');

        const prompt = `
            Génère un script d'analyse de données pour ${lang}.
            Le script doit effectuer les tâches suivantes :
            1. Lister les packages nécessaires (pour R) ou les commandes de setup (pour Stata).
            2. Inclure une section pour charger les données depuis un fichier CSV (avec un nom de fichier placeholder 'data.csv').
            3. Pour chaque variable/question, générer le code pour un résumé de base (ex: summary() pour R, summarize pour Stata).
            4. Pour les questions de type 'select_one' ou 'select_multiple', générer le code pour un tableau de fréquences.
            5. Ajouter des commentaires clairs pour chaque étape.

            Voici la liste des questions du formulaire :
            ${questionList}
        `;
        
        try {
            const response = await getAssistance(prompt, [], ['analyste_donnees'], activeProject);
            // Clean up markdown code block
            const cleanedText = response.text.replace(/```(r|stata)?\n/g, '').replace(/```/g, '');
            setScriptContent(cleanedText);
        } catch (error: any) {
            addNotification(`Erreur IA : ${error.message}`, 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(scriptContent).then(() => {
            addNotification('Script copié !', 'success');
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold">{t('analysisScriptModal_title')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-6 flex-1 overflow-y-auto">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{t('analysisScriptModal_description')}</p>
                    
                    {!scriptContent && (
                        <div className="flex justify-center gap-4">
                            <button onClick={() => handleGenerate('R')} disabled={isGenerating} className="px-4 py-2 text-sm font-medium text-white bg-indigo-deep rounded-md hover:bg-indigo-deep-dark disabled:opacity-50">
                                {isGenerating && targetLang === 'R' ? t('analysisScriptModal_generating') : t('analysisScriptModal_generateFor', { lang: 'R' })}
                            </button>
                             <button onClick={() => handleGenerate('Stata')} disabled={isGenerating} className="px-4 py-2 text-sm font-medium text-white bg-indigo-deep rounded-md hover:bg-indigo-deep-dark disabled:opacity-50">
                                {isGenerating && targetLang === 'Stata' ? t('analysisScriptModal_generating') : t('analysisScriptModal_generateFor', { lang: 'Stata' })}
                            </button>
                        </div>
                    )}

                    {scriptContent && (
                        <textarea
                            readOnly
                            value={scriptContent}
                            className="w-full h-full min-h-[300px] p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md font-mono text-xs"
                        />
                    )}
                </main>
                <footer className="p-4 flex justify-between border-t dark:border-gray-700">
                    <button onClick={handleCopyToClipboard} disabled={!scriptContent} className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">
                        Copier
                    </button>
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-indigo-deep rounded-md hover:bg-indigo-deep-dark">
                        Fermer
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AnalysisScriptModal;