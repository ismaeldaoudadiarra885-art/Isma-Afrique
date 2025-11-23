import React, { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../hooks/useTranslation';

interface ProjectConstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProjectConstitutionModal: React.FC<ProjectConstitutionModalProps> = ({ isOpen, onClose }) => {
    const { activeProject, updateProjectConstitution } = useProject();
    const { addNotification } = useNotification();
    const { t } = useLanguage();
    
    const [constitution, setConstitution] = useState('');

    useEffect(() => {
        if (isOpen && activeProject) {
            setConstitution(activeProject.projectConstitution || '');
        }
    }, [isOpen, activeProject]);

    if (!isOpen || !activeProject) return null;

    const handleSave = () => {
        updateProjectConstitution(constitution);
        addNotification("La constitution du projet a été sauvegardée.", "success");
        onClose();
    };

    const placeholderText = t('constitution_placeholder');

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold">{t('constitution_title')}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-6 flex-1 overflow-y-auto">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {t('constitution_description')}
                    </p>
                    <textarea
                        value={constitution}
                        onChange={(e) => setConstitution(e.target.value)}
                        placeholder={placeholderText}
                        className="w-full h-full min-h-[300px] p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md font-mono text-xs"
                    />
                </main>
                <footer className="p-4 flex justify-end gap-2 border-t dark:border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-600 rounded-md">
                        {t('cancel')}
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-indigo-deep rounded-md hover:bg-indigo-deep-dark">
                        {t('save')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ProjectConstitutionModal;