
import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../hooks/useTranslation';
import TemplateLibraryModal from './TemplateLibraryModal';

interface ProjectSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProjectSwitcherModal: React.FC<ProjectSwitcherModalProps> = ({ isOpen, onClose }) => {
    const { projects, activeProjectId, setActiveProject, createProject, deleteProject } = useProject();
    const { t } = useLanguage();
    const [newProjectName, setNewProjectName] = useState('');
    const [isTemplateModalOpen, setTemplateModalOpen] = useState(false);

    if (!isOpen) return null;

    const handleCreate = () => {
        if (newProjectName.trim()) {
            createProject(newProjectName.trim());
            setNewProjectName('');
            onClose();
        }
    };
    
    const handleDelete = (e: React.MouseEvent, projectId: string, projectName: string) => {
        e.stopPropagation();
        if (window.confirm(t('confirmDeleteProject', { projectName }))) {
            deleteProject(projectId);
        }
    };

    const handleSelect = (projectId: string) => {
        setActiveProject(projectId);
        onClose();
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                    <header className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                        <h2 className="text-xl font-semibold">{t('projectManager')}</h2>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </header>
                    <div className="p-4 border-b dark:border-gray-700">
                        <h3 className="text-lg font-medium mb-2">{t('createNewProject')}</h3>
                        <div className="flex gap-2">
                             <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder={t('newProjectNamePlaceholder')}
                                className="flex-grow block text-sm rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600"
                            />
                            <button onClick={handleCreate} className="px-4 py-2 text-sm font-medium text-white bg-indigo-deep rounded-md">{t('create')}</button>
                        </div>
                         <button onClick={() => setTemplateModalOpen(true)} className="mt-2 text-sm text-indigo-deep hover:underline">
                            ...ou choisir depuis un modèle
                        </button>
                    </div>
                    <main className="flex-1 overflow-y-auto p-4 space-y-3">
                        <h3 className="text-lg font-medium mb-2">{t('existingProjects')}</h3>
                        {projects.length > 0 ? (
                            projects.map(p => (
                                <div key={p.id} onClick={() => handleSelect(p.id)} className={`p-3 rounded-lg flex justify-between items-center cursor-pointer ${p.id === activeProjectId ? 'bg-indigo-deep-light dark:bg-indigo-deep/30' : 'bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                                    <div>
                                        <p className="font-semibold text-anthracite-gray dark:text-gray-200">{p.name}</p>
                                        <p className="text-xs text-gray-500">Modifié le: {new Date(p.updatedAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {p.id === activeProjectId ? 
                                            <span className="text-xs font-semibold text-green-tamani">{t('active')}</span> : 
                                            <button onClick={() => handleSelect(p.id)} className="px-3 py-1 text-xs bg-white dark:bg-gray-600 rounded-md">{t('activate')}</button>
                                        }
                                        <button onClick={(e) => handleDelete(e, p.id, p.name)} className="text-red-earth hover:text-red-earth/80 p-1 text-xs">
                                            {t('delete')}
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-6">{t('noProjects')}</p>
                        )}
                    </main>
                </div>
            </div>
            <TemplateLibraryModal isOpen={isTemplateModalOpen} onClose={() => setTemplateModalOpen(false)} onSelectTemplate={onClose} />
        </>
    );
};

export default ProjectSwitcherModal;