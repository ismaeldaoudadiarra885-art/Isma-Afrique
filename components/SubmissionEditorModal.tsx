import React, { useState, useEffect } from 'react';
import { Submission, FormValues, KoboQuestion } from '../types';
import { useProject } from '../contexts/ProjectContext';
import { getLocalizedText } from '../utils/localizationUtils';

interface SubmissionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission;
  onSave: (submission: Submission) => void;
}

const SubmissionEditorModal: React.FC<SubmissionEditorModalProps> = ({ isOpen, onClose, submission, onSave }) => {
  const [editedData, setEditedData] = useState<FormValues>({});
  const { activeProject } = useProject();

  useEffect(() => {
    setEditedData(submission.data);
  }, [submission]);
  
  if (!isOpen || !activeProject) return null;

  const { survey, settings } = activeProject.formData;
  const defaultLang = settings.default_language || 'default';

  const handleChange = (key: string, value: string) => {
    setEditedData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave({ ...submission, data: editedData, status: 'modified' });
    onClose();
  };
  
  const questionMap = new Map<string, KoboQuestion>(survey.map(q => [q.name, q]));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold">Éditeur de Soumission</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{submission.id}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {Object.entries(editedData).map(([key, value]) => {
            const question = questionMap.get(key);
            if (!question) return null; // Don't show fields that are not in the current form structure
            const isImage = typeof value === 'string' && value.startsWith('data:image/');

            return (
              <div key={key}>
                <label htmlFor={key} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getLocalizedText(question.label, defaultLang)}
                </label>
                {isImage ? (
                    <div className="mt-1">
                        <img src={value} alt="valeur soumise" className="max-h-40 rounded-md border dark:border-gray-600" />
                        <p className="text-xs text-gray-400 mt-1">L'édition d'images n'est pas supportée.</p>
                    </div>
                ) : (
                    <input
                      type="text"
                      id={key}
                      value={String(value)}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-isma-blue focus:ring-isma-blue dark:bg-gray-700 dark:border-gray-600"
                    />
                )}
              </div>
            );
          })}
        </div>
        <div className="p-4 flex justify-end gap-2 border-t dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-600 rounded-md">Annuler</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-isma-blue rounded-md hover:bg-isma-blue-dark">Enregistrer les modifications</button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionEditorModal;