
import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import SubmissionsTable from './SubmissionsTable';
import SubmissionEditorModal from './SubmissionEditorModal';
import { Submission } from '../types';
import Dashboard from './Dashboard';
import DataAnalysisChat from './DataAnalysisChat';
import AnalysisScriptModal from './AnalysisScriptModal';
import GeoMap from './GeoMap';
import MediaGallery from './MediaGallery';
import CaseExplorer from './CaseExplorer';
import CodebookModal from './CodebookModal';
import CrossTabAnalysis from './CrossTabAnalysis'; // Import nouveau
import { useLanguage } from '../hooks/useTranslation';
import { useNotification } from '../contexts/NotificationContext';
import { getAssistance } from '../services/geminiService';

const DataView: React.FC = () => {
    const { activeProject, updateSubmission } = useProject();
    const { t } = useLanguage();
    const { addNotification } = useNotification();
    const [activeTab, setActiveTab] = useState<'table' | 'cases' | 'dashboard' | 'crosstab' | 'map' | 'gallery' | 'chat'>('table');
    const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
    const [isScriptModalOpen, setScriptModalOpen] = useState(false);
    const [isCodebookModalOpen, setCodebookModalOpen] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);

    const handleSaveSubmission = (submission: Submission) => {
        updateSubmission(submission);
    };

    const handleGenerateFlashReport = async () => {
        if(!activeProject) return;
        setIsGeneratingReport(true);
        addNotification("Génération du rapport narratif...", "info");
        try {
            const sample = activeProject.submissions.slice(0, 30).map(s => s.data);
            const prompt = `Rédige un rapport narratif exécutif (Flash Report) résumant les tendances principales observées dans ces 30 premières soumissions. Format Markdown. Sois professionnel et concis. Données: ${JSON.stringify(sample)}`;
            const response = await getAssistance(prompt, [], ['analyste_donnees'], activeProject);
            
            const blob = new Blob([response.text || "Erreur de génération"], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Rapport_Flash_${activeProject.name}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            addNotification("Rapport téléchargé !", "success");
        } catch(e) {
            addNotification("Erreur lors de la génération.", "error");
        } finally {
            setIsGeneratingReport(false);
        }
    }

    const TabButton: React.FC<{ tabId: string, children: React.ReactNode }> = ({ tabId, children }) => (
        <button
            onClick={() => setActiveTab(tabId as any)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tabId ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
        >
            {children}
        </button>
    );

    return (
        <div className="h-full flex flex-col">
            <header className="flex justify-between items-center p-2 border-b dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
                <nav className="flex items-center overflow-x-auto scrollbar-thin pb-1">
                    <TabButton tabId="table">Données Brutes</TabButton>
                    <TabButton tabId="cases">🗂️ Dossiers</TabButton>
                    <TabButton tabId="dashboard">Tableau de Bord</TabButton>
                    <TabButton tabId="crosstab">🔄 Analyse Croisée</TabButton>
                    <TabButton tabId="map">Carte GPS</TabButton>
                    <TabButton tabId="gallery">Galerie Média</TabButton>
                    <TabButton tabId="chat">Analyse IA</TabButton>
                </nav>
                <div className="flex gap-2 flex-shrink-0">
                     <button 
                        onClick={handleGenerateFlashReport} 
                        disabled={isGeneratingReport}
                        className="hidden md:flex px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-md hover:shadow-md transition-all disabled:opacity-50 items-center gap-1"
                    >
                        {isGeneratingReport ? 'Rédaction...' : '📄 Rapport Flash IA'}
                    </button>
                     <button onClick={() => setCodebookModalOpen(true)} className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100">
                        📘 Dictionnaire (Codebook)
                    </button>
                     <button onClick={() => setScriptModalOpen(true)} className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200">
                        {t('dataView_exportScripts')}
                    </button>
                </div>
            </header>
            <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900 relative">
                {activeTab === 'table' && <div className="h-full overflow-y-auto"><SubmissionsTable onEdit={setEditingSubmission} /></div>}
                {activeTab === 'cases' && <div className="h-full overflow-y-auto"><CaseExplorer /></div>}
                {activeTab === 'dashboard' && <div className="h-full overflow-y-auto"><Dashboard /></div>}
                {activeTab === 'crosstab' && <div className="h-full overflow-y-auto"><CrossTabAnalysis /></div>}
                {activeTab === 'map' && <div className="h-full p-4"><GeoMap /></div>}
                {activeTab === 'gallery' && <div className="h-full"><MediaGallery /></div>}
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
             <CodebookModal isOpen={isCodebookModalOpen} onClose={() => setCodebookModalOpen(false)} />
        </div>
    );
};

export default DataView;
