

import React, { useMemo } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { getLocalizedText } from '../utils/localizationUtils';
import { useLanguage } from '../hooks/useTranslation';
import { KoboQuestion } from '../types';

interface NestedKoboQuestion extends KoboQuestion {
    children?: NestedKoboQuestion[];
}

interface FilteredNestedKoboQuestion extends NestedKoboQuestion {
    matches: boolean;
}

// Helper to transform flat survey list into a nested structure for rendering
const nestSurvey = (survey: KoboQuestion[]): NestedKoboQuestion[] => {
    const nested: NestedKoboQuestion[] = [];
    const stack: NestedKoboQuestion[] = [];

    survey.forEach(q => {
        const questionNode: NestedKoboQuestion = { ...q, children: [] };

        if (q.type === 'begin_group') {
            if (stack.length > 0) {
                stack[stack.length - 1].children!.push(questionNode);
            } else {
                nested.push(questionNode);
            }
            stack.push(questionNode);
        } else if (q.type === 'end_group') {
            stack.pop();
        } else {
            if (stack.length > 0) {
                stack[stack.length - 1].children!.push(questionNode);
            } else {
                nested.push(questionNode);
            }
        }
    });
    return nested;
};

const filterNestedSurvey = (questions: NestedKoboQuestion[], term: string, defaultLang: string): FilteredNestedKoboQuestion[] => {
    if (!term.trim()) {
        return questions.map(q => ({ ...q, matches: false })) as FilteredNestedKoboQuestion[];
    }

    const lowerTerm = term.toLowerCase();

    return questions
        .map(q => {
            const labelText = getLocalizedText(q.label, defaultLang) || '';
            const matches = labelText.toLowerCase().includes(lowerTerm) || q.name.toLowerCase().includes(lowerTerm);

            if (q.type === 'begin_group' && q.children) {
                const filteredChildren = filterNestedSurvey(q.children, term, defaultLang);
                if (matches || filteredChildren.length > 0) {
                    return { ...q, children: filteredChildren, matches } as FilteredNestedKoboQuestion;
                }
                return null;
            }

            if (matches) {
                return { ...q, matches } as FilteredNestedKoboQuestion;
            }

            return null;
        })
        .filter((q): q is FilteredNestedKoboQuestion => q !== null);
};

// Recursive component to render sidebar tree
const TreeRenderer: React.FC<{
    questions: FilteredNestedKoboQuestion[];
    defaultLang: string;
    currentQuestionName: string;
    setCurrentQuestionName: (name: string) => void;
    depth?: number;
    searchTerm: string;
}> = ({ questions, defaultLang, currentQuestionName, setCurrentQuestionName, depth = 0, searchTerm }) => {
    return (
        <>
            {questions.map(question => {
                const labelText = getLocalizedText(question.label, defaultLang) || '';
                const isMatch = question.matches;
                const isSelected = currentQuestionName === question.name;

                if (question.type === 'begin_group') {
                    return (
                        <li key={question.uid} style={{ paddingLeft: `${depth * 16}px` }}>
                            <div className="py-2 pl-4">
                                <p className={`text-sm font-bold truncate flex items-center gap-2 ${isMatch ? 'bg-yellow-100 dark:bg-yellow-900/30 rounded px-1' : ''}`}>
                                    <span>📁</span>
                                    <span>{labelText || <span className="italic text-gray-400">Groupe sans nom</span>}</span>
                                </p>
                            </div>
                            {question.children && question.children.length > 0 && (
                                <ul>
                                    <TreeRenderer
                                        questions={question.children as FilteredNestedKoboQuestion[]}
                                        defaultLang={defaultLang}
                                        currentQuestionName={currentQuestionName}
                                        setCurrentQuestionName={setCurrentQuestionName}
                                        depth={depth + 1}
                                        searchTerm={searchTerm}
                                    />
                                </ul>
                            )}
                        </li>
                    );
                }

                return (
                    <li
                        key={question.uid}
                        className={`cursor-pointer border-l-4 ${
                            isSelected
                                ? 'bg-indigo-deep-light dark:bg-indigo-deep/30 border-indigo-deep'
                                : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        } ${isMatch ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}`}
                        style={{ paddingLeft: `${depth * 16 + 12}px` }}
                        onClick={() => setCurrentQuestionName(question.name)}
                    >
                        <div className="py-2">
                            <p className={`text-sm font-medium truncate ${isMatch ? 'bg-yellow-100 dark:bg-yellow-900/30 rounded px-1' : ''}`}>
                                {labelText || <span className="italic text-gray-400">Sans nom</span>}
                            </p>
                            <p className={`text-xs text-gray-500 dark:text-gray-400 font-mono ${isMatch ? 'bg-yellow-100 dark:bg-yellow-900/30 rounded px-1' : ''}`}>
                                {question.name} ({question.type})
                            </p>
                        </div>
                    </li>
                );
            })}
        </>
    );
};

const LeftSidebar: React.FC = () => {
    const { activeProject, currentQuestionName, setCurrentQuestionName, addGroup, searchTerm } = useProject();
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

    const nestedSurvey = useMemo(() => nestSurvey(survey), [survey]);

    const filteredSurvey = useMemo(() => filterNestedSurvey(nestedSurvey, searchTerm, defaultLang), [nestedSurvey, searchTerm, defaultLang]);

    const renderSurveyTree = () => {
        if (filteredSurvey.length === 0 && searchTerm.trim()) {
            return (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Aucune question trouvée pour "{searchTerm}"
                </div>
            );
        }
        return (
            <ul>
                <TreeRenderer
                    questions={filteredSurvey}
                    defaultLang={defaultLang}
                    currentQuestionName={currentQuestionName}
                    setCurrentQuestionName={setCurrentQuestionName}
                    searchTerm={searchTerm}
                />
            </ul>
        );
    };


    return (
        <aside className="w-80 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-r dark:border-gray-700 flex flex-col flex-shrink-0 animate-slide-in-left shadow-xl">
            <div className="p-4 border-b dark:border-gray-700">
                <h2 className="text-lg font-semibold">Structure du Formulaire</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                <ul>
                   {renderSurveyTree()}
                </ul>
            </div>
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
