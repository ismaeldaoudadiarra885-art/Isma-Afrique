
import React, { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { KoboSettings } from '../types';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({ isOpen, onClose }) => {
    const { activeProject, updateProjectSettings } = useProject();
    const [settings, setSettings] = useState<KoboSettings | null>(null);

    useEffect(() => {
        if (isOpen && activeProject) {
            setSettings(activeProject.formData.settings);
        }
    }, [isOpen, activeProject]);

    if (!isOpen || !activeProject || !settings) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleSave = () => {
        if (settings) {
            updateProjectSettings(settings);
            onClose();
        }
    };
    
    const inputClass = "mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-deep focus:ring-indigo-deep dark:bg-gray-700 dark:border-gray-600";
    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
                <header className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold">Paramètres du Formulaire</h2>
                     <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-6 space-y-4">
                    <div>
                        <label htmlFor="form_title" className={labelClass}>Titre du Formulaire</label>
                        <input type="text" id="form_title" name="form_title" value={settings.form_title} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="form_id" className={labelClass}>ID du Formulaire (form_id)</label>
                        <input type="text" id="form_id" name="form_id" value={settings.form_id} onChange={handleChange} className={`${inputClass} font-mono`} />
                    </div>
                     <div>
                        <label htmlFor="version" className={labelClass}>Version</label>
                        <input type="text" id="version" name="version" value={settings.version} onChange={handleChange} className={`${inputClass} font-mono`} />
                    </div>
                     <div>
                        <label htmlFor="default_language" className={labelClass}>Langue par Défaut</label>
                        <input type="text" id="default_language" name="default_language" value={settings.default_language} onChange={handleChange} className={inputClass} />
                    </div>
                </main>
                 <footer className="p-4 flex justify-end gap-2 border-t dark:border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-600 rounded-md">Annuler</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-indigo-deep rounded-md hover:bg-indigo-deep-dark">Enregistrer</button>
                </footer>
            </div>
        </div>
    );
};

export default ProjectSettingsModal;