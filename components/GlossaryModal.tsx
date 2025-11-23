import React, { useState, useMemo } from 'react';
// FIX: Corrected import paths
import { useProject } from '../contexts/ProjectContext';
import { GlossaryEntry } from '../types';
import { useNotification } from '../contexts/NotificationContext';
import { exportGlossaryToXlsx } from '../utils/exportUtils';

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlossaryForm: React.FC<{
  entry: Omit<GlossaryEntry, 'id'> | GlossaryEntry;
  onSave: (entry: Omit<GlossaryEntry, 'id'> | GlossaryEntry) => void;
  onCancel: () => void;
}> = ({ entry, onSave, onCancel }) => {
    const [formData, setFormData] = useState(entry);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    }
    
    const inputClass = "mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-deep focus:ring-indigo-deep dark:bg-gray-700 dark:border-gray-600";
    const labelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400";

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-gray-50 dark:bg-gray-900/50 space-y-4">
             <h3 className="text-lg font-semibold">{'id' in entry ? 'Modifier le terme' : 'Ajouter un terme'}</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="term" className={labelClass}>Terme</label>
                    <input id="term" name="term" value={formData.term} onChange={handleChange} className={inputClass} required />
                </div>
                 <div>
                    <label htmlFor="category" className={labelClass}>Catégorie</label>
                    <select id="category" name="category" value={formData.category} onChange={handleChange} className={inputClass}>
                        <option value="XLSForm">XLSForm</option>
                        <option value="Technique">Technique</option>
                        <option value="Culturel">Culturel</option>
                    </select>
                </div>
             </div>
              <div>
                <label htmlFor="definition_fr" className={labelClass}>Définition (Français)</label>
                <textarea id="definition_fr" name="definition_fr" value={formData.definition_fr} onChange={handleChange} className={inputClass} rows={2} required />
            </div>
             <div>
                <label htmlFor="explanation_bm" className={labelClass}>Explication (Bambara)</label>
                <textarea id="explanation_bm" name="explanation_bm" value={formData.explanation_bm} onChange={handleChange} className={inputClass} rows={2} required />
            </div>
             <div>
                <label htmlFor="example_local" className={labelClass}>Exemple Local</label>
                <textarea id="example_local" name="example_local" value={formData.example_local || ''} onChange={handleChange} className={inputClass} rows={2} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="level" className={labelClass}>Niveau de complexité</label>
                    <select id="level" name="level" value={formData.level} onChange={handleChange} className={inputClass}>
                        <option value="terrain">Terrain</option>
                        <option value="analyste">Analyste</option>
                        <option value="institutionnel">Institutionnel</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="user_annotation" className={labelClass}>Annotation Personnelle</label>
                    <textarea id="user_annotation" name="user_annotation" value={formData.user_annotation || ''} onChange={handleChange} className={inputClass} rows={2} />
                </div>
            </div>
             <div className="flex justify-end space-x-2">
                <button type="button" onClick={onCancel} className="px-3 py-1.5 text-sm font-medium bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">Annuler</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-deep rounded-md hover:bg-indigo-deep-dark">Sauvegarder</button>
             </div>
        </form>
    )
}


const GlossaryModal: React.FC<GlossaryModalProps> = ({ isOpen, onClose }) => {
  const { activeProject, addGlossaryEntry, updateGlossaryEntry, deleteGlossaryEntry } = useProject();
  const { addNotification } = useNotification();

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ category: 'all', level: 'all' });
  const [editingEntry, setEditingEntry] = useState<GlossaryEntry | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen || !activeProject) return null;

  const { glossary } = activeProject;

  const handleSave = (entryData: Omit<GlossaryEntry, 'id'> | GlossaryEntry) => {
    if ('id' in entryData) {
      updateGlossaryEntry(entryData.id, entryData);
    } else {
      addGlossaryEntry(entryData);
    }
    setEditingEntry(null);
    setIsAdding(false);
  };

  const handleDelete = (entryId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce terme ?")) {
      deleteGlossaryEntry(entryId);
    }
  };

  const handleExport = () => {
    exportGlossaryToXlsx(glossary, activeProject.formData.settings.form_id);
    addNotification("Glossaire exporté avec succès.", 'success');
  }

  const filteredData = useMemo(() => glossary.filter(entry => 
    (entry.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.definition_fr.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filters.category === 'all' || entry.category === filters.category) &&
    (filters.level === 'all' || entry.level === filters.level)
  ), [glossary, searchTerm, filters]);
  
  const categoryColors: Record<GlossaryEntry['category'], string> = {
    'XLSForm': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'Technique': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    'Culturel': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  }

  const levelColors: Record<GlossaryEntry['level'], string> = {
    'terrain': 'border-green-500',
    'analyste': 'border-yellow-500',
    'institutionnel': 'border-red-500'
  }
  
  const renderContent = () => {
    if (editingEntry) {
        return <GlossaryForm entry={editingEntry} onSave={handleSave} onCancel={() => setEditingEntry(null)} />;
    }
    if (isAdding) {
        return <GlossaryForm 
            entry={{ term: '', definition_fr: '', explanation_bm: '', category: 'Technique', level: 'terrain' }} 
            onSave={handleSave} 
            onCancel={() => setIsAdding(false)} 
        />;
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {filteredData.map(entry => (
                <div key={entry.id} className={`p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-l-4 ${levelColors[entry.level]}`}>
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold text-indigo-deep">{String(entry.term)}</h3>
                        <div className="flex items-center gap-2">
                           <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${categoryColors[entry.category]}`}>
                                {String(entry.category)}
                            </span>
                            <button onClick={() => setEditingEntry(entry)} className="text-gray-400 hover:text-indigo-deep">✏️</button>
                            <button onClick={() => handleDelete(entry.id)} className="text-gray-400 hover:text-red-earth">🗑️</button>
                        </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{String(entry.definition_fr)}</p>
                    {entry.example_local && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ex: {String(entry.example_local)}</p>}
                    {entry.user_annotation && <p className="mt-2 text-xs p-2 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-md">Note: {String(entry.user_annotation)}</p>}
                    <div className="mt-3 pt-3 border-t border-dashed dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Explication en Bambara :</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">{String(entry.explanation_bm)}</p>
                    </div>
                </div>
            ))}
             {filteredData.length === 0 && <p className="text-center text-gray-500">Aucun terme ne correspond à votre recherche.</p>}
        </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        <header className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">Glossaire du Projet</h2>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Exporter XLS</button>
            <button onClick={() => setIsAdding(true)} className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-deep rounded-md hover:bg-indigo-deep-dark">Ajouter un terme</button>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </header>

        <div className="p-4 border-b dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input 
            type="text"
            placeholder="Rechercher un terme..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 text-sm border border-gray-300 rounded-md dark:bg-gray-900 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-deep"
          />
           <select value={filters.category} onChange={(e) => setFilters(f => ({...f, category: e.target.value}))} className="w-full p-2 text-sm border border-gray-300 rounded-md dark:bg-gray-900 dark:border-gray-600">
                <option value="all">Toutes les catégories</option>
                <option value="XLSForm">XLSForm</option>
                <option value="Technique">Technique</option>
                <option value="Culturel">Culturel</option>
            </select>
            <select value={filters.level} onChange={(e) => setFilters(f => ({...f, level: e.target.value}))} className="w-full p-2 text-sm border border-gray-300 rounded-md dark:bg-gray-900 dark:border-gray-600">
                <option value="all">Tous les niveaux</option>
                <option value="terrain">Terrain</option>
                <option value="analyste">Analyste</option>
                <option value="institutionnel">Institutionnel</option>
            </select>
        </div>
        
        {renderContent()}

      </div>
    </div>
  );
};

export default GlossaryModal;