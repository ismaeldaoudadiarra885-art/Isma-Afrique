
import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../hooks/useTranslation';
import { v4 as uuidv4 } from 'uuid';
import SimulationProfileSelector from './SimulationProfileSelector';
import { SimulationProfile } from '../types';
import { simulateAiResponse } from '../services/geminiService';
import { useNotification } from '../contexts/NotificationContext';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SimulationModal: React.FC<SimulationModalProps> = ({ isOpen, onClose }) => {
    const { activeProject, setFormValues, addSubmission, setActiveSubmissionId } = useProject();
    const { addNotification } = useNotification();
    const { t } = useLanguage();
    
    const [isSimulating, setIsSimulating] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState<SimulationProfile | null>(null);

    if (!isOpen || !activeProject) return null;

    const handleRunSimulation = async () => {
        if (!selectedProfile) {
            addNotification("Veuillez sélectionner un profil de simulation.", "warning");
            return;
        }
        setIsSimulating(true);
        let currentValues = {};
        const { survey } = activeProject.formData;
        
        for (const question of survey) {
            // A simple simulation: skip groups and notes
            if (['begin_group', 'end_group', 'note'].includes(question.type)) continue;

            try {
                const { answer } = await simulateAiResponse(activeProject, selectedProfile, currentValues, question);
                currentValues = { ...currentValues, [question.name]: answer };
            } catch (error) {
                console.error(`Erreur de simulation pour la question ${question.name}:`, error);
                addNotification(`Simulation arrêtée à la question ${question.name}.`, 'error');
                break; // Stop simulation on error
            }
        }
        
        setFormValues(currentValues);
        setIsSimulating(false);
        addNotification("Simulation terminée. Les réponses ont été pré-remplies.", "success");
    };
    
    const handleFinalize = () => {
        const newSubmission = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            data: activeProject.formValues,
            status: 'draft' as const,
        };
        addSubmission(newSubmission);
        setActiveSubmissionId(newSubmission.id);
        addNotification("Soumission de simulation sauvegardée comme brouillon.", "success");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
                <header className="p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold">{t('simulationModal_title')}</h2>
                </header>
                <main className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">{t('simulationModal_description')}</p>
                    <SimulationProfileSelector onSelect={setSelectedProfile} />
                    <button onClick={handleRunSimulation} disabled={!selectedProfile || isSimulating} className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-deep rounded-md disabled:opacity-50">
                        {isSimulating ? "Simulation en cours..." : "Lancer la simulation IA"}
                    </button>
                </main>
                <footer className="p-4 flex justify-end gap-2 border-t dark:border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 rounded-md">Annuler</button>
                    <button onClick={handleFinalize} className="px-4 py-2 text-sm text-white bg-indigo-deep rounded-md">
                       {t('simulationModal_finalize')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SimulationModal;