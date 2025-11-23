import React from 'react';
import { useProject } from '../contexts/ProjectContext';
import { templateLibrary } from '../data/templateLibrary';
import { KoboFormData, KoboProject } from '../types';

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: () => void; // To close the parent modal as well
}

const TemplateLibraryModal: React.FC<TemplateLibraryModalProps> = ({ isOpen, onClose, onSelectTemplate }) => {
  const { createProject } = useProject();

  if (!isOpen) return null;

  const handleSelect = (template: Partial<KoboProject>) => {
    const newProjectName = window.prompt(`Entrez un nom pour votre nouveau projet basé sur le modèle "${template.name}" :`, template.name);
    if (newProjectName && newProjectName.trim() !== '') {
        createProject(newProjectName, template.formData);
        onSelectTemplate(); // Close the switcher modal
        onClose(); // Close this modal
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">Bibliothèque de Modèles</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templateLibrary.map((template, index) => (
                    <div 
                        key={index}
                        onClick={() => handleSelect(template)}
                        className="p-4 border dark:border-gray-700 rounded-lg flex flex-col items-start cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-lg transition-all"
                    >
                        <span className="text-3xl mb-2">{template.icon || '📝'}</span>
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex-grow">
                            {template.description}
                        </p>
                         <button className="mt-4 text-xs font-semibold text-indigo-deep hover:underline">
                            Utiliser ce modèle
                        </button>
                    </div>
                ))}
            </div>
        </div>
        <div className="p-4 flex justify-end border-t dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-600 rounded-md">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateLibraryModal;