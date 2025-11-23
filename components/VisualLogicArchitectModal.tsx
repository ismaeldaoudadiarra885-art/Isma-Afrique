import React, { useState, useMemo } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../hooks/useTranslation';
import { useNotification } from '../contexts/NotificationContext';
import { getLocalizedText } from '../utils/localizationUtils';
import { KoboQuestion } from '../types';

interface VisualLogicArchitectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LogicNode {
    question: KoboQuestion;
    children: LogicNode[];
    depth: number;
}

const VisualLogicArchitectModal: React.FC<VisualLogicArchitectModalProps> = ({ isOpen, onClose }) => {
    const { activeProject, batchUpdateQuestions } = useProject();
    const { t } = useLanguage();
    const { addNotification } = useNotification();
    const [editedLogic, setEditedLogic] = useState<{ [questionName: string]: string }>({});

    if (!isOpen || !activeProject) return null;
    
    const defaultLang = activeProject.formData.settings.default_language || 'fr';

    const handleSave = () => {
        const updates = Object.entries(editedLogic)
            .map(([questionName, relevant]) => ({
                questionName,
                updates: { relevant: relevant as string },
            }));

        if (updates.length > 0) {
            batchUpdateQuestions(updates);
            addNotification("La logique du formulaire a été mise à jour.", "success");
        }
        onClose();
    };
    
    // Helper to get dependencies from a relevant string
    const parseDependencies = (expression: string | undefined): string[] => {
        if (!expression) return [];
        const regex = /\$\{([^}]+)\}/g;
        return (expression.match(regex) || []).map(m => m.slice(2, -1));
    };

    const questionTree = useMemo(() => {
        const survey = activeProject.formData.survey;
        const nodes: { [name: string]: LogicNode } = {};
        survey.forEach(q => {
            nodes[q.name] = { question: q, children: [], depth: 0 };
        });

        const rootNodes: LogicNode[] = [];

        survey.forEach(q => {
            const relevantLogic = editedLogic[q.name] ?? q.relevant;
            const deps = parseDependencies(relevantLogic);
            
            // For simplicity, we attach a node to the *last* dependency in its relevant clause.
            // This creates a readable, though not exhaustive, visual hierarchy.
            const parentName = deps.length > 0 ? deps[deps.length - 1] : null;

            if (parentName && nodes[parentName]) {
                nodes[parentName].children.push(nodes[q.name]);
            } else {
                rootNodes.push(nodes[q.name]);
            }
        });
        
        // Function to set depth recursively
        const setDepth = (node: LogicNode, depth: number) => {
            node.depth = depth;
            node.children.forEach(child => setDepth(child, depth + 1));
        };
        rootNodes.forEach(node => setDepth(node, 0));

        return rootNodes;
    }, [activeProject.formData.survey, editedLogic]);
    
    
    const renderNode = (node: LogicNode) => {
        const { question, children, depth } = node;
        const currentRelevant = editedLogic[question.name] ?? question.relevant ?? '';

        return (
            <div key={question.uid}>
                <div 
                    className="p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm border dark:border-gray-700"
                    style={{ marginLeft: `${depth * 24}px` }}
                >
                    <p className="font-bold text-sm">{getLocalizedText(question.label, defaultLang) || question.name}</p>
                    <p className="text-xs font-mono text-gray-500">{question.name} ({question.type})</p>
                    <div className="mt-2">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                           Condition d'affichage (relevant)
                        </label>
                        <input 
                            type="text"
                            value={currentRelevant}
                            onChange={(e) => setEditedLogic(prev => ({ ...prev, [question.name]: e.target.value }))}
                            placeholder="Ex: ${age} > 18"
                            className="w-full mt-1 text-xs font-mono p-1 border rounded-md bg-gray-50 dark:bg-gray-900 dark:border-gray-600 focus:ring-1 focus:ring-indigo-deep"
                        />
                    </div>
                </div>
                {children.length > 0 && (
                    <div className="pl-6 border-l-2 border-gray-200 dark:border-gray-600 mt-1 space-y-2">
                        {children.map(renderNode)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-semibold">{t('visualLogic_title')}</h2>
                        <p className="text-sm text-gray-500">{t('visualLogic_description')}</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                
                 <main className="flex-1 flex p-4 gap-4 overflow-hidden">
                    <div className="flex-[3] overflow-auto bg-gray-100 dark:bg-gray-900/50 rounded-lg p-4 space-y-2">
                        {questionTree.map(renderNode)}
                    </div>
                    <aside className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border dark:border-gray-700 flex flex-col">
                        <h3 className="text-lg font-semibold mb-2">Assistant Logique IA</h3>
                        <p className="text-xs text-gray-500 mb-4">Décrivez une règle complexe et l'IA proposera les modifications à appliquer sur l'ensemble du formulaire.</p>
                        <textarea 
                            placeholder={t('visualLogic_aiHelper')}
                            rows={5}
                            className="w-full text-sm p-2 border rounded-md dark:bg-gray-900 dark:border-gray-600"
                        />
                        <button className="mt-2 w-full px-4 py-2 text-sm font-medium text-white bg-indigo-deep rounded-md hover:bg-indigo-deep-dark">
                            {t('visualLogic_generateLogic')}
                        </button>
                        <div className="mt-4 text-center text-gray-400 text-xs">
                            <p>(L'assistance IA pour la logique complexe sera activée prochainement)</p>
                        </div>
                    </aside>
                </main>

                <footer className="p-4 flex justify-end gap-2 border-t dark:border-gray-700">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-600 rounded-md">
                        {t('cancel')}
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-indigo-deep rounded-md hover:bg-indigo-deep-dark">
                        {t('visualLogic_saveAndApply')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default VisualLogicArchitectModal;