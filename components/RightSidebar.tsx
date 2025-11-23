
import React, { useState } from 'react';
import QuestionEditor from './QuestionEditor';
import ChatAgent from './ChatAgent';
import FormAudit from './FormAudit';
import DataAnalysisPanel from './DataAnalysisPanel';

import VersionHistory from './VersionHistory';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../hooks/useTranslation';

const RightSidebar: React.FC = () => {
    const [activeTab, setActiveTab] = useState('ai');
    const { currentQuestionName } = useProject();
    const { t } = useLanguage();

    const getTabStyle = (tabId: string) => {
        const baseStyle = 'px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap';
        const inactiveStyle = 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300';
        
        if (activeTab !== tabId) return `${baseStyle} ${inactiveStyle}`;

        switch (tabId) {
            case 'ai': return `${baseStyle} border-blue-light-ai text-blue-light-ai`;
            case 'edit': return `${baseStyle} border-indigo-deep text-indigo-deep`;
            case 'audit': return `${baseStyle} border-red-earth text-red-earth`;
            default: return `${baseStyle} border-gray-500 text-gray-600 dark:text-gray-300`;
        }
    };


    
    const isQuestionSelected = !!currentQuestionName;

    const renderContent = () => {
        switch (activeTab) {
            case 'ai':
                return <ChatAgent />;
            case 'edit':
                if (isQuestionSelected && currentQuestionName) {
                    return <QuestionEditor />;
                } else {
                    return <div className="p-4 text-sm text-center text-gray-500">{t('selectQuestionToEdit')}</div>;
                }
            case 'audit':
                return <FormAudit />;

            case 'analyse':
                return <DataAnalysisPanel />;

            case 'history':
                return <VersionHistory />;
            default:
                return <div className="p-4 text-sm text-center text-gray-500">Sélectionnez un onglet</div>;
        }
    }

    return (
        <aside className="w-[400px] bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-l dark:border-gray-700 flex flex-col flex-shrink-0 animate-slide-in-right shadow-xl">
            <div className="flex items-center border-b dark:border-gray-700 overflow-x-auto">
                <button
                    onClick={() => {
                        console.log('Manual AI tab click');
                        setActiveTab('ai');
                    }}
                    className={`${getTabStyle('ai')} z-10`}
                >
                    {t('aiAssistant')}
                </button>
                <button
                    onClick={() => {
                        console.log('Manual Edit tab click');
                        if (isQuestionSelected) setActiveTab('edit');
                    }}
                    className={`${getTabStyle('edit')} z-10 ${!isQuestionSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={!isQuestionSelected}
                >
                    {t('editTab')}
                </button>
                <button
                    onClick={() => {
                        console.log('Manual Audit tab click');
                        setActiveTab('audit');
                    }}
                    className={`${getTabStyle('audit')} z-10`}
                >
                    {t('logicAudit')}
                </button>

                <button
                    onClick={() => {
                        console.log('Manual History tab click');
                        setActiveTab('history');
                    }}
                    className={`${getTabStyle('history')} z-10`}
                >
                    {t('history')}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {renderContent()}
            </div>

        </aside>
    );
};

export default RightSidebar;