import React, { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../hooks/useTranslation';

const ConstitutionTab: React.FC = () => {
    const { activeProject, updateProjectConstitution } = useProject();
    const { addNotification } = useNotification();
    const { t } = useLanguage();
    
    const [constitution, setConstitution] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        if (activeProject) {
            const initialValue = activeProject.projectConstitution || '';
            setConstitution(initialValue);
            setIsDirty(false);
        }
    }, [activeProject]);

    if (!activeProject) return null;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setConstitution(e.target.value);
        setIsDirty(e.target.value !== (activeProject.projectConstitution || ''));
    };

    const handleSave = () => {
        updateProjectConstitution(constitution);
        addNotification("La constitution du projet a été sauvegardée.", "success");
        setIsDirty(false);
    };

    const placeholderText = t('constitution_placeholder');

    return (
        <div className="p-4 flex flex-col h-full">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {t('constitution_description')}
            </p>
            <textarea
                value={constitution}
                onChange={handleChange}
                placeholder={placeholderText}
                className="flex-1 w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md font-mono text-xs"
            />
            <button 
                onClick={handleSave}
                disabled={!isDirty}
                className="mt-4 w-full py-2 text-sm font-medium text-white bg-isma-blue rounded-md hover:bg-isma-blue-dark disabled:opacity-50"
            >
                {t('save')}
            </button>
        </div>
    );
};

export default ConstitutionTab;
