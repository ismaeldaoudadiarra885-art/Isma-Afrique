
import React, { useState, useMemo } from 'react';
import QuestionEditor from './QuestionEditor';
import ChatAgent from './ChatAgent';
import FormAudit from './FormAudit';
import AiActionLog from './AiActionLog';
import VersionHistory from './VersionHistory';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../hooks/useTranslation';
import { STANDARD_INDICATORS } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import { getLocalizedText } from '../utils/localizationUtils';

const RightSidebar: React.FC = () => {
    const [activeTab, setActiveTab] = useState('ai');
    const [standardSearch, setStandardSearch] = useState('');
    const { currentQuestionName, addQuestion, activeProject } = useProject();
    const { t } = useLanguage();

    const getTabStyle = (tabId: string) => {
        const baseStyle = 'px-3 py-3 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all duration-200 flex-1 text-center';
        const inactiveStyle = 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/30';
        
        if (activeTab !== tabId) return `${baseStyle} ${inactiveStyle}`;

        switch (tabId) {
            case 'ai': return `${baseStyle} border-indigo-500 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20`;
            case 'standards': return `${baseStyle} border-green-500 text-green-600 bg-green-50/50 dark:bg-green-900/20`;
            case 'edit': return `${baseStyle} border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-900/20`;
            case 'audit': return `${baseStyle} border-red-500 text-red-600 bg-red-50/50 dark:bg-red-900/20`;
            default: return `${baseStyle} border-gray-500 text-gray-600 dark:text-gray-300`;
        }
    };

    const TabButton: React.FC<{ tabId: string, children: React.ReactNode, disabled?: boolean, icon?: string, count?: number }> = ({ tabId, children, disabled, icon, count }) => (
        <button
            onClick={() => !disabled && setActiveTab(tabId)}
            disabled={disabled}
            className={`${getTabStyle(tabId)} ${disabled ? 'opacity-30 cursor-not-allowed' : ''} flex flex-col items-center justify-center gap-1 h-14`}
            title={typeof children === 'string' ? children : ''}
        >
            <span className="text-lg">{icon}</span>
            <span className="text-[10px]">{children}</span>
        </button>
    );
    
    const isQuestionSelected = !!currentQuestionName;
    
    // Filter standards based on search
    const filteredStandards = useMemo(() => {
        if (!standardSearch.trim()) return STANDARD_INDICATORS;
        return STANDARD_INDICATORS.map(group => ({
            ...group,
            questions: group.questions.filter(q => 
                getLocalizedText(q.label, 'fr').toLowerCase().includes(standardSearch.toLowerCase()) || 
                q.name.toLowerCase().includes(standardSearch.toLowerCase())
            )
        })).filter(group => group.questions.length > 0);
    }, [standardSearch]);

    const renderStandards = () => (
        <div className="flex flex-col h-full">
            {/* Search Header */}
            <div className="p-3 bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Rechercher un indicateur..." 
                        value={standardSearch}
                        onChange={(e) => setStandardSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-transparent rounded-md focus:ring-2 focus:ring-green-500 focus:bg-white dark:focus:bg-gray-900 transition-all"
                    />
                    <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>

            <div className="p-3 space-y-3 flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
                {/* Info Box */}
                {!standardSearch && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800 flex gap-3 items-start">
                        <span className="text-xl">💡</span>
                        <div>
                            <h4 className="text-xs font-bold text-green-800 dark:text-green-300">Bibliothèque Humanitaire</h4>
                            <p className="text-[10px] text-green-700 dark:text-green-400 mt-0.5 leading-tight">
                                Modules standards validés (WASH, Santé, etc.) prêts à l'emploi.
                            </p>
                        </div>
                    </div>
                )}

                {filteredStandards.map((group, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <details className="group" open={!!standardSearch}>
                            <summary className="px-4 py-3 font-semibold text-sm cursor-pointer bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex justify-between items-center list-none select-none">
                                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                                    <span className="text-lg">{group.icon}</span> 
                                    {group.category}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">{group.questions.length}</span>
                                    <svg className="w-4 h-4 text-gray-400 transform group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </div>
                            </summary>
                            
                            <div className="border-t border-gray-100 dark:border-gray-700">
                                <div className="max-h-60 overflow-y-auto scrollbar-thin divide-y divide-gray-50 dark:divide-gray-700">
                                    {group.questions.map((q, qIdx) => (
                                        <div key={qIdx} className="p-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group/item flex justify-between items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 leading-snug mb-0.5">
                                                    {getLocalizedText(q.label, 'fr')}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-mono truncate bg-gray-100 dark:bg-gray-700/50 inline-block px-1 rounded">
                                                    {q.name} • <span className="uppercase">{q.type}</span>
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const newQ = { ...q, uid: uuidv4(), choices: q.choices?.map(c => ({...c, uid: uuidv4()})) };
                                                    addQuestion(newQ);
                                                }}
                                                className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900 dark:hover:bg-indigo-800 p-1.5 rounded shadow-sm opacity-0 group-hover/item:opacity-100 transition-opacity"
                                                title="Ajouter"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-2 bg-gray-50 dark:bg-gray-900/50 text-center border-t border-gray-100 dark:border-gray-700">
                                    <button 
                                        onClick={() => {
                                            group.questions.forEach(q => {
                                                const newQ = { ...q, uid: uuidv4(), choices: q.choices?.map(c => ({...c, uid: uuidv4()})) };
                                                addQuestion(newQ);
                                            });
                                        }}
                                        className="text-xs font-bold text-green-600 hover:text-green-700 dark:text-green-400 uppercase tracking-wide"
                                    >
                                        + Ajouter le module complet
                                    </button>
                                </div>
                            </div>
                        </details>
                    </div>
                ))}
                {filteredStandards.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        Aucun standard trouvé pour "{standardSearch}".
                    </div>
                )}
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'ai': return <ChatAgent />;
            case 'standards': return renderStandards();
            case 'edit': return isQuestionSelected ? <QuestionEditor /> : <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400"><div className="text-4xl mb-4 opacity-50">✏️</div><p className="text-sm">Sélectionnez une question à gauche pour modifier ses propriétés.</p></div>;
            case 'audit': return <FormAudit />;
            case 'history': return <VersionHistory />;
            default: return null;
        }
    }

    return (
        <aside className="w-[400px] bg-white dark:bg-gray-800 border-l dark:border-gray-700 flex flex-col flex-shrink-0 shadow-xl z-20 h-full">
            <div className="flex items-center border-b dark:border-gray-700 bg-white dark:bg-gray-800">
                <TabButton tabId="ai" icon="✨">{t('aiAssistant')}</TabButton>
                <TabButton tabId="standards" icon="📚">Standards</TabButton>
                <TabButton tabId="edit" disabled={!isQuestionSelected} icon="🛠️">{t('editTab')}</TabButton>
                <TabButton tabId="audit" icon="🛡️">{t('logicAudit')}</TabButton>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900/50 relative">
                {renderContent()}
            </div>
        </aside>
    );
};

export default RightSidebar;
