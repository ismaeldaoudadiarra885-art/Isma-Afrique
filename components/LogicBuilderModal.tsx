
import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../hooks/useTranslation';
import { getLocalizedText } from '../utils/localizationUtils';

interface LogicBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (logic: string) => void;
  initialLogic: string;
}

const LogicBuilderModal: React.FC<LogicBuilderModalProps> = ({ isOpen, onClose, onApply, initialLogic }) => {
    const { activeProject } = useProject();
    const { t } = useLanguage();
    const [logic, setLogic] = useState(initialLogic || '');
    const [selectedQuestion, setSelectedQuestion] = useState('');
    const [operator, setOperator] = useState('=');
    const [value, setValue] = useState('');
    
    if (!isOpen || !activeProject) return null;
    
    const { survey, settings } = activeProject.formData;
    const defaultLang = settings.default_language;
    
    const availableQuestions = survey.filter(q => q.name !== activeProject.currentQuestionName && !['begin_group', 'end_group', 'note'].includes(q.type));
    
    const handleAddCondition = () => {
        if (!selectedQuestion) return;
        
        const question = survey.find(q => q.name === selectedQuestion);
        if (!question) return;

        let condition = '';
        if (operator === 'selected' || operator === 'not(selected') {
             condition = `${operator}(\${${selectedQuestion}}, '${value}'))`;
             if (operator === 'not(selected') condition = `not(selected(\${${selectedQuestion}}, '${value}'))`;
             else condition = `selected(\${${selectedQuestion}}, '${value}')`;
        } else {
             const quote = (question.type !== 'integer' && question.type !== 'decimal') ? "'" : "";
             condition = `\${${selectedQuestion}} ${operator} ${quote}${value}${quote}`;
        }

        setLogic(prev => prev ? `${prev} and ${condition}` : condition);
        setSelectedQuestion('');
        setValue('');
    };
    
    const selectedQuestionInfo = availableQuestions.find(q => q.name === selectedQuestion);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
                 <header className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold">{t('logicBuilder_title')}</h2>
                     <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">{t('logicBuilder_description')}</p>
                    <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-md font-mono text-sm">
                        <input type="text" value={logic} onChange={(e) => setLogic(e.target.value)} className="w-full bg-transparent focus:outline-none"/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end p-4 border dark:border-gray-700 rounded-md">
                        <div>
                            <label className="text-xs font-semibold text-gray-500">{t('logicBuilder_question_label')}</label>
                            <select value={selectedQuestion} onChange={e => setSelectedQuestion(e.target.value)} className="mt-1 w-full text-sm p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                <option value="">Choisir...</option>
                                {availableQuestions.map(q => <option key={q.uid} value={q.name}>{getLocalizedText(q.label, defaultLang)}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="text-xs font-semibold text-gray-500">{t('logicBuilder_operator_label')}</label>
                             <select value={operator} onChange={e => setOperator(e.target.value)} className="mt-1 w-full text-sm p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                {selectedQuestionInfo && (selectedQuestionInfo.type === 'select_one' || selectedQuestionInfo.type === 'select_multiple') ? (
                                    <>
                                        <option value="selected">est sélectionné</option>
                                        <option value="not(selected">n'est pas sélectionné</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="=">égal à</option>
                                        <option value="!=">différent de</option>
                                        <option value=">">&gt;</option>
                                        <option value="<">&lt;</option>
                                        <option value=">=">&gt;=</option>
                                        <option value="<=">&lt;=</option>
                                    </>
                                )}
                            </select>
                        </div>
                         <div>
                            <label className="text-xs font-semibold text-gray-500">{t('logicBuilder_value_label')}</label>
                            {selectedQuestionInfo && selectedQuestionInfo.choices ? (
                                <select value={value} onChange={e => setValue(e.target.value)} className="mt-1 w-full text-sm p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600">
                                    <option value="">Choisir...</option>
                                    {selectedQuestionInfo.choices.map(c => <option key={c.uid} value={c.name}>{getLocalizedText(c.label, defaultLang)}</option>)}
                                </select>
                            ) : (
                                <input type="text" value={value} onChange={e => setValue(e.target.value)} className="mt-1 w-full text-sm p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                            )}
                        </div>
                    </div>
                     <button onClick={handleAddCondition} disabled={!selectedQuestion || !value} className="w-full px-4 py-2 text-sm text-white bg-indigo-deep rounded-md disabled:opacity-50">{t('logicBuilder_add_condition')}</button>
                </main>
                 <footer className="p-4 flex justify-between items-center border-t dark:border-gray-700">
                    <button onClick={() => setLogic('')} className="text-sm text-red-earth hover:underline">Réinitialiser</button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 rounded-md">{t('cancel')}</button>
                        <button onClick={() => onApply(logic)} className="px-4 py-2 text-sm text-white bg-indigo-deep rounded-md">{t('save')}</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LogicBuilderModal;
