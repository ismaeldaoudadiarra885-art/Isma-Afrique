import React, { useState, useMemo } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { GlossaryEntry } from '../types';
import GlossaryModal from './GlossaryModal';

const GlossaryTab: React.FC = () => {
  const { activeProject } = useProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [isGlossaryModalOpen, setGlossaryModalOpen] = useState(false);

  if (!activeProject) return null;

  const { glossary } = activeProject;

  const filteredData = useMemo(() => glossary.filter(entry => 
    entry.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.definition_fr.toLowerCase().includes(searchTerm.toLowerCase())
  ), [glossary, searchTerm]);
  
  const categoryColors: Record<GlossaryEntry['category'], string> = {
    'XLSForm': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'Technique': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    'Culturel': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  }

  return (
    <>
        <div className="p-4 flex flex-col h-full">
            <div className="mb-4">
                <input 
                    type="text"
                    placeholder="Rechercher un terme..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 text-sm border border-gray-300 rounded-md dark:bg-gray-900 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-isma-blue"
                />
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {filteredData.map(entry => (
                    <div key={entry.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="flex justify-between items-start">
                            <h3 className="text-sm font-bold text-isma-blue">{entry.term}</h3>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${categoryColors[entry.category]}`}>
                                {entry.category}
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">{entry.definition_fr}</p>
                    </div>
                ))}
                {filteredData.length === 0 && <p className="text-center text-xs text-gray-500">Aucun terme trouvé.</p>}
            </div>
            <div className="mt-4">
                <button 
                    onClick={() => setGlossaryModalOpen(true)}
                    className="w-full py-2 text-sm font-medium bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                    Gérer le Glossaire
                </button>
            </div>
        </div>
        <GlossaryModal isOpen={isGlossaryModalOpen} onClose={() => setGlossaryModalOpen(false)} />
    </>
  );
};

export default GlossaryTab;
