import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { performInstitutionalAudit } from '../services/institutionalAuditService';
import { useNotification } from '../contexts/NotificationContext';

interface InstitutionalAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstitutionalAuditModal: React.FC<InstitutionalAuditModalProps> = ({ isOpen, onClose }) => {
  const { activeProject } = useProject();
  const { addNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[] | null>(null);

  if (!isOpen) return null;

  const handleRunAudit = async () => {
    if (!activeProject) return;
    setIsLoading(true);
    setResults(null);
    try {
      const violations = await performInstitutionalAudit(activeProject);
      setResults(violations);
      addNotification("Audit institutionnel terminé.", "success");
    } catch (error) {
      addNotification("Erreur lors de l'audit.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">Audit Institutionnel</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Cette fonctionnalité vérifie la conformité de votre formulaire par rapport à des standards prédéfinis (ex: préfixes de nom, types de questions autorisés).
          </p>
          <button onClick={handleRunAudit} disabled={isLoading} className="w-full px-4 py-2 text-sm font-medium text-white bg-isma-blue rounded-md hover:bg-isma-blue-dark disabled:opacity-50">
            {isLoading ? 'Analyse en cours...' : 'Lancer l\'Audit'}
          </button>

          {results && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg max-h-64 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-sm text-green-600 dark:text-green-300">✅ Aucune violation des standards institutionnels détectée.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {results.map((violation, index) => (
                    <li key={index} className="text-red-700 dark:text-red-300">❌ {violation}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="p-4 flex justify-end border-t dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-isma-blue rounded-md">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstitutionalAuditModal;