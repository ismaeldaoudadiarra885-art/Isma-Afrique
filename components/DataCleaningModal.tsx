import React, { useState, useEffect } from 'react';
import { DataCleaningSuggestion } from '../types';

interface DataCleaningModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: DataCleaningSuggestion[];
  onApply: (acceptedSuggestions: DataCleaningSuggestion[]) => void;
}

const DataCleaningModal: React.FC<DataCleaningModalProps> = ({ isOpen, onClose, suggestions, onApply }) => {
  const [localSuggestions, setLocalSuggestions] = useState<DataCleaningSuggestion[]>([]);

  useEffect(() => {
    setLocalSuggestions(suggestions);
  }, [suggestions]);

  if (!isOpen) return null;

  const handleStatusChange = (id: string, status: 'accepted' | 'rejected') => {
    setLocalSuggestions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const handleApply = () => {
    const accepted = localSuggestions.filter(s => s.status === 'accepted');
    onApply(accepted);
  };
  
  const getStatusBgColor = (status: DataCleaningSuggestion['status']) => {
      switch(status) {
          case 'accepted': return 'bg-green-100 dark:bg-green-900/50';
          case 'rejected': return 'bg-red-100 dark:bg-red-900/50';
          default: return 'bg-white dark:bg-gray-800';
      }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <header className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">Suggestions de Nettoyage par IA</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        
        <main className="flex-1 p-4 overflow-y-auto">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                L'IA a analysé vos données et propose les corrections suivantes. Veuillez les vérifier avant de les appliquer.
            </p>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-2 text-left">Question</th>
                            <th className="px-4 py-2 text-left">Valeur Originale</th>
                            <th className="px-4 py-2 text-left">Suggestion</th>
                            <th className="px-4 py-2 text-left">Raison</th>
                            <th className="px-4 py-2 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {localSuggestions.map(s => (
                            <tr key={s.id} className={getStatusBgColor(s.status)}>
                                <td className="px-4 py-2 font-mono">{s.questionName}</td>
                                <td className="px-4 py-2 text-red-600 dark:text-red-400 italic">"{String(s.originalValue)}"</td>
                                <td className="px-4 py-2 text-green-600 dark:text-green-400 font-semibold">"{String(s.suggestedValue)}"</td>
                                <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{s.reason}</td>
                                <td className="px-4 py-2 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => handleStatusChange(s.id, 'accepted')} className={`px-2 py-1 text-xs rounded-md ${s.status === 'accepted' ? 'bg-green-500 text-white' : 'bg-green-200 text-green-800'}`}>Accepter</button>
                                        <button onClick={() => handleStatusChange(s.id, 'rejected')} className={`px-2 py-1 text-xs rounded-md ${s.status === 'rejected' ? 'bg-red-500 text-white' : 'bg-red-200 text-red-800'}`}>Rejeter</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>

        <footer className="p-4 border-t dark:border-gray-700 flex justify-between items-center">
          <p className="text-sm text-gray-500">
            {localSuggestions.filter(s => s.status === 'accepted').length} modification(s) sera appliquée.
          </p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-600 rounded-md">Annuler</button>
            <button onClick={handleApply} className="px-4 py-2 text-sm font-medium text-white bg-isma-blue rounded-md hover:bg-isma-blue-dark">
                Appliquer les Changements
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DataCleaningModal;