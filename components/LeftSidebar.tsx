
import React from 'react';
import { useProject } from '../contexts/ProjectContext';
import { getLocalizedText } from '../utils/localizationUtils';
import { useLanguage } from '../hooks/useTranslation';
import StorageMonitor from './StorageMonitor';

const LeftSidebar: React.FC = () => {
    const { activeProject, currentQuestionName, setCurrentQuestionName, addGroup } = useProject();
    const { t } = useLanguage();
    
    if (!activeProject) return null;

    const { survey, settings } = activeProject.formData;
    const defaultLang = settings.default_language || 'fr';

    const handleAddGroup = () => {
        const groupName = prompt("Entrez le nom du nouveau groupe :");
        if (groupName) {
            addGroup(groupName);
        }
    };

    const renderSurveyTree = () => {
        const elements: React.ReactNode[] = [];
        let depth = 0;

        survey.forEach(q => {
            if (q.type === 'end_group') {
                depth = Math.max(0, depth - 1);
                return; // Don't render end_group
            }

            const isGroup = q.type === 'begin_group';
            const isSelected = currentQuestionName === q.name;

            elements.push(
                <li
                    key={q.uid}
                    className={`cursor-pointer border-l-4 ${
                        isSelected
                            ? 'bg-indigo-deep-light dark:bg-indigo-deep/30 border-indigo-deep'
                            : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                    style={{ paddingLeft: `${depth * 16 + 12}px` }}
                    onClick={() => setCurrentQuestionName(q.name)}
                >
                    <div className="py-2">
                         {isGroup ? (
                             <p className="text-sm font-bold truncate flex items-center gap-2">
                                 <span>📁</span>
                                 <span>{getLocalizedText(q.label, defaultLang) || <span className="italic text-gray-400">Groupe sans nom</span>}</span>
                             </p>
                         ) : (
                             <>
                                <p className="text-sm font-medium truncate">{getLocalizedText(q.label, defaultLang) || <span className="italic text-gray-400">{t('noLabel')}</span>}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{q.name} ({q.type})</p>
                             </>
                         )}
                    </div>
                </li>
            );

            if (isGroup) {
                depth++;
            }
        });
        return elements;
    };


    return (
        <aside className="w-80 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col flex-shrink-0">
            <div className="p-4 border-b dark:border-gray-700">
                <h2 className="text-lg font-semibold">Structure du Formulaire</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                <ul>
                   {renderSurveyTree()}
                </ul>
            </div>
            
            {/* Ajout du moniteur de stockage ici */}
            <StorageMonitor />

            <div className="p-2 border-t dark:border-gray-700">
                <button 
                    onClick={handleAddGroup}
                    className="w-full text-center px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                >
                    + {t('leftSidebar_addGroup')}
                </button>
            </div>
        </aside>
    );
};

export default LeftSidebar;
