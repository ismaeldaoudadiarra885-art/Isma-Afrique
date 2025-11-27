
import React from 'react';
import { useProject } from '../contexts/ProjectContext';
import { getLocalizedText } from '../utils/localizationUtils';

interface CodebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CodebookModal: React.FC<CodebookModalProps> = ({ isOpen, onClose }) => {
  const { activeProject } = useProject();

  if (!isOpen || !activeProject) return null;

  const { survey, settings } = activeProject.formData;
  const defaultLang = settings.default_language || 'default';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 print:p-0 print:bg-white print:absolute print:inset-0">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col print:shadow-none print:w-full print:h-full print:max-w-none print:max-h-none">
        
        {/* Header (caché à l'impression) */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 print:hidden">
          <h2 className="text-xl font-semibold">📘 Dictionnaire des Variables (Codebook)</h2>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-bold flex items-center gap-2">
               <span>🖨️</span> Imprimer / PDF
            </button>
            <button onClick={onClose} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600">
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 print:overflow-visible">
            {/* En-tête Document */}
            <div className="mb-8 border-b-2 border-black pb-4">
                <h1 className="text-3xl font-bold mb-2 uppercase">{activeProject.name}</h1>
                <p className="text-gray-600 text-sm">ID Formulaire : <span className="font-mono font-bold">{settings.form_id}</span></p>
                <p className="text-gray-600 text-sm">Version : <span className="font-mono">{settings.version}</span></p>
                <p className="text-gray-600 text-sm">Généré le : {new Date().toLocaleDateString()}</p>
            </div>

            <div className="space-y-6">
                {survey.map((q, index) => (
                    <div key={q.uid} className="break-inside-avoid mb-6">
                        <div className="flex items-baseline gap-3 border-b border-gray-300 pb-1 mb-2">
                            <span className="font-mono font-bold text-lg bg-gray-100 px-2 py-0.5 rounded">{q.name}</span>
                            <span className="text-xs font-bold uppercase text-gray-500 border border-gray-300 px-1 rounded">{q.type}</span>
                            {q.required && <span className="text-red-500 text-xs font-bold">*Requis</span>}
                        </div>
                        
                        <div className="pl-4 space-y-2">
                            <p className="font-medium text-gray-800 dark:text-gray-200">
                                {getLocalizedText(q.label, defaultLang) || <span className="italic text-gray-400">Sans libellé</span>}
                            </p>
                            
                            {q.hint && (
                                <p className="text-sm text-gray-500 italic">
                                    ℹ️ {getLocalizedText(q.hint, defaultLang)}
                                </p>
                            )}

                            {/* Tableau des choix */}
                            {(q.type === 'select_one' || q.type === 'select_multiple') && q.choices && (
                                <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
                                    <table className="min-w-full text-sm divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-mono text-xs text-gray-500">Code (Valeur)</th>
                                                <th className="px-4 py-2 text-left text-xs text-gray-500">Libellé (Label)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {q.choices.map((c, i) => (
                                                <tr key={i}>
                                                    <td className="px-4 py-1.5 font-mono font-bold text-indigo-700">{c.name}</td>
                                                    <td className="px-4 py-1.5">{getLocalizedText(c.label, defaultLang)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Logique */}
                            <div className="flex gap-4 mt-2 text-xs font-mono text-gray-600">
                                {q.relevant && (
                                    <div className="bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                        <span className="font-bold text-blue-700">Relevant:</span> {q.relevant}
                                    </div>
                                )}
                                {q.constraint && (
                                    <div className="bg-red-50 px-2 py-1 rounded border border-red-100">
                                        <span className="font-bold text-red-700">Constraint:</span> {q.constraint}
                                    </div>
                                )}
                                {q.calculation && (
                                    <div className="bg-purple-50 px-2 py-1 rounded border border-purple-100">
                                        <span className="font-bold text-purple-700">Calc:</span> {q.calculation}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CodebookModal;
