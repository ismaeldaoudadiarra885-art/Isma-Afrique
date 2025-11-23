import React, { useState } from 'react';
import SubmissionsTable from './SubmissionsTable';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../hooks/useTranslation';

const FullFormView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'analysis'>('dashboard');
    const { activeProject } = useProject();
    const { t } = useLanguage();

    if (!activeProject) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-gray-900">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {t('noActiveProject') || 'Aucun projet actif'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        {t('selectProjectForReview') || 'Veuillez sélectionner un projet pour accéder au tableau de bord.'}
                    </p>
                </div>
            </div>
        );
    }

    const tabs = [
        {
            id: 'dashboard' as const,
            label: t('dashboard') || 'Tableau de Bord',
            content: <SubmissionsTable />
        },
        {
            id: 'analysis' as const,
            label: t('dataAnalysis') || 'Analyse IA',
            content: (
                <div className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        {t('aiAnalysisTitle') || 'Analyse IA des données'}
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-96 flex flex-col">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {t('aiAnalysisDescription') || 'Ici, vous pouvez interagir avec l\'IA pour analyser les données de soumissions. Utilisez le chat pour poser des questions sur les tendances, les anomalies, ou générer des rapports.'}
                        </p>
                        <div className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-700">
                            <p className="text-sm text-gray-500 italic">
                                {t('aiChatPlaceholder') || 'Tapez votre question sur les données... (Fonctionnalité en développement)'}
                            </p>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900">
            {/* Tabs Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <nav className="flex space-x-8 px-6 py-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
                                activeTab === tab.id
                                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                {tabs.find(tab => tab.id === activeTab)?.content}
            </div>
        </div>
    );
};

export default FullFormView;
