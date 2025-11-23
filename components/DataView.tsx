
import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import SubmissionsTable from './SubmissionsTable';
import SubmissionEditorModal from './SubmissionEditorModal';
import { Submission } from '../types';
import Dashboard from './Dashboard';
import DataAnalysisChat from './DataAnalysisChat';
import AnalysisScriptModal from './AnalysisScriptModal';
import { useLanguage } from '../hooks/useTranslation';

const DataView: React.FC = () => {
    const { updateSubmission } = useProject();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'table' | 'dashboard' | 'chat'>('table');
    const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
    const [isScriptModalOpen, setScriptModalOpen] = useState(false);

    const handleSaveSubmission = (submission: Submission) => {
        updateSubmission(submission);
    };

    const TabButton: React.FC<{ tabId: string, children: React.ReactNode }> = ({ tabId, children }) => (
        <button
            onClick={() => setActiveTab(tabId as any)}
            className={`px-3 py-2 text-sm font-medium border-b-2 ${
                activeTab === tabId ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div className="h-full flex flex-col">
            <header className="flex justify-between items-center p-2 border-b dark:border-gray-700">
                <nav className="flex items-center">
                    <TabButton tabId="table">Données</TabButton>
                    <TabButton tabId="dashboard">Tableau de Bord</TabButton>
                    <TabButton tabId="chat">Analyse IA</TabButton>
                </nav>
                 <button onClick={() => setScriptModalOpen(true)} className="px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
                    {t('dataView_exportScripts')}
                </button>
            </header>
            <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                {activeTab === 'table' && <SubmissionsTable onEdit={setEditingSubmission} />}
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'chat' && <DataAnalysisChat />}
            </main>
            {editingSubmission && (
                <SubmissionEditorModal
                    isOpen={!!editingSubmission}
                    onClose={() => setEditingSubmission(null)}
                    submission={editingSubmission}
                    onSave={handleSaveSubmission}
                />
            )}
             <AnalysisScriptModal isOpen={isScriptModalOpen} onClose={() => setScriptModalOpen(false)} />
        </div>
    );
};

export default DataView;
