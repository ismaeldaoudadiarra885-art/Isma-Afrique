
import React, { useState, useEffect } from 'react';
import { Submission, FormValues, KoboQuestion, ReviewData } from '../types';
import { useProject } from '../contexts/ProjectContext';
import { getLocalizedText } from '../utils/localizationUtils';

interface SubmissionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: Submission;
  onSave: (submission: Submission) => void;
}

const SubmissionEditorModal: React.FC<SubmissionEditorModalProps> = ({ isOpen, onClose, submission, onSave }) => {
  const { activeProject, currentUserName } = useProject();
  const [activeTab, setActiveTab] = useState<'data' | 'review'>('data');
  const [editedData, setEditedData] = useState<FormValues>({});
  const [reviewData, setReviewData] = useState<ReviewData>({ status: 'pending' });

  useEffect(() => {
    setEditedData(submission.data);
    setReviewData(submission.review || { status: 'pending' });
  }, [submission]);
  
  if (!isOpen || !activeProject) return null;

  const { survey, settings } = activeProject.formData;
  const defaultLang = settings.default_language || 'default';

  const handleChange = (key: string, value: string) => {
    setEditedData(prev => ({ ...prev, [key]: value }));
  };

  const handleReviewChange = (field: keyof ReviewData, value: any) => {
      setReviewData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const updatedReview = activeTab === 'review' ? {
        ...reviewData,
        reviewerName: currentUserName || 'Admin',
        reviewedAt: new Date().toISOString()
    } : submission.review;

    onSave({ 
        ...submission, 
        data: editedData, 
        review: updatedReview,
        status: 'modified' 
    });
    onClose();
  };

  const handlePrint = () => {
      window.print();
  };
  
  const questionMap = new Map<string, KoboQuestion>(survey.map(q => [q.name, q]));

  // Logique pour l'affichage des données (utilisée aussi pour l'impression)
  const renderDataFields = () => (
      <div className="space-y-4">
        {Object.entries(editedData).map(([key, value]) => {
            const question = questionMap.get(key);
            if (!question) return null;
            const isImage = typeof value === 'string' && value.startsWith('data:image/');
            const isSignature = question.type === 'signature';

            return (
            <div key={key} className="pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 break-inside-avoid">
                <label htmlFor={key} className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                {getLocalizedText(question.label, defaultLang)}
                </label>
                <p className="text-xs text-gray-400 font-mono mb-1 print:hidden">{key}</p>
                {isImage ? (
                    <div className="mt-1">
                        <img 
                            src={value} 
                            alt="valeur soumise" 
                            className={`max-h-40 rounded-md border dark:border-gray-600 ${isSignature ? 'bg-white p-2 border-dashed' : ''}`} 
                        />
                    </div>
                ) : (
                    <div className="print:font-mono print:text-base">
                        {/* En mode édition écran, on affiche un input */}
                        <input
                            type="text"
                            id={key}
                            value={String(value)}
                            onChange={(e) => handleChange(key, e.target.value)}
                            className="mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-isma-blue focus:ring-isma-blue dark:bg-gray-700 dark:border-gray-600 print:hidden"
                        />
                        {/* En mode impression, on affiche juste le texte */}
                        <span className="hidden print:block">{String(value)}</span>
                    </div>
                )}
            </div>
            );
        })}
      </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col print:shadow-none print:w-full print:h-auto print:max-h-none print:border-none">
        
        {/* Header (Modifié pour impression) */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 print:bg-white print:border-b-2 print:border-black">
          <div>
            <h2 className="text-xl font-semibold print:text-2xl print:uppercase">Fiche Individuelle</h2>
            <div className="flex items-center gap-2 mt-1 print:mt-2">
                <span className="text-xs text-gray-500 font-mono print:text-sm">ID: {submission.id}</span>
                <span className="text-xs text-gray-500 print:text-sm"> | Date: {new Date(submission.timestamp).toLocaleString()}</span>
                <span className="text-xs text-gray-500 print:text-sm"> | Agent: {submission.metadata?.agentName || 'N/A'}</span>
                
                {/* Badges cachés à l'impression si non pertinents, ou stylisés */}
                <div className="print:hidden">
                    {reviewData.status === 'approved' && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ml-2">Validé</span>}
                    {reviewData.status === 'rejected' && <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ml-2">Rejeté</span>}
                </div>
            </div>
          </div>
          <div className="flex gap-2 print:hidden">
            <button onClick={handlePrint} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md text-sm font-bold flex items-center gap-1 transition-colors">
                <span>🖨️</span> Imprimer
            </button>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Tabs (Cachés à l'impression) */}
        <div className="flex border-b dark:border-gray-700 print:hidden">
            <button 
                onClick={() => setActiveTab('data')}
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'data' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20' : 'text-gray-500 hover:text-gray-700'}`}
            >
                📝 Données
            </button>
            <button 
                onClick={() => setActiveTab('review')}
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'review' ? 'border-b-2 border-orange-500 text-orange-600 bg-orange-50/50 dark:bg-orange-900/20' : 'text-gray-500 hover:text-gray-700'}`}
            >
                🛡️ Supervision & Validation
            </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto print:overflow-visible print:p-0 print:mt-4">
          {/* Contenu Data (Toujours visible à l'impression) */}
          <div className={activeTab === 'data' ? 'block' : 'hidden print:block'}>
              {renderDataFields()}
          </div>

          {/* Contenu Review (Visible seulement si onglet actif, ou en bas à l'impression) */}
          <div className={`${activeTab === 'review' ? 'block' : 'hidden'} print:block print:mt-8 print:border-t print:border-gray-300 print:pt-4`}>
              <div className="space-y-6 animate-fadeIn">
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-100 dark:border-orange-800 print:bg-transparent print:border-none print:p-0">
                      <h3 className="font-bold text-orange-800 dark:text-orange-300 mb-2 print:text-black print:text-lg print:uppercase">Supervision</h3>
                      <p className="text-sm text-orange-700 dark:text-orange-400 print:hidden">
                          Utilisez cet espace pour valider la qualité des données ou demander des corrections à l'enquêteur.
                      </p>
                  </div>

                  <div className="print:hidden">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Statut de Validation</label>
                      <div className="grid grid-cols-4 gap-3">
                          {[
                              { id: 'pending', label: 'En attente', color: 'bg-gray-200 text-gray-700' },
                              { id: 'approved', label: 'Approuvé ✅', color: 'bg-green-100 text-green-800 border-green-300' },
                              { id: 'rejected', label: 'Rejeté ❌', color: 'bg-red-100 text-red-800 border-red-300' },
                              { id: 'flagged', label: 'Suspect ⚠️', color: 'bg-orange-100 text-orange-800 border-orange-300' },
                          ].map(status => (
                              <button
                                key={status.id}
                                onClick={() => handleReviewChange('status', status.id)}
                                className={`py-2 px-3 rounded-lg text-sm font-bold border transition-all ${
                                    reviewData.status === status.id 
                                    ? `${status.color} ring-2 ring-offset-1` 
                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                  {status.label}
                              </button>
                          ))}
                      </div>
                  </div>
                  
                  {/* Affichage impression du statut */}
                  <div className="hidden print:block mb-4">
                      <strong>Statut : </strong> {reviewData.status.toUpperCase()}
                  </div>

                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 print:font-bold">Commentaires / Instructions</label>
                      <textarea 
                        value={reviewData.reviewerNote || ''}
                        onChange={(e) => handleReviewChange('reviewerNote', e.target.value)}
                        rows={5}
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 print:hidden"
                        placeholder="Ex: La photo du site est floue. Merci de vérifier la question sur le revenu..."
                      />
                      <div className="hidden print:block p-2 border border-gray-300 min-h-[50px] italic">
                          {reviewData.reviewerNote || 'Aucun commentaire.'}
                      </div>
                  </div>
                  
                  {reviewData.reviewedAt && (
                      <p className="text-xs text-gray-400 text-right print:text-black">
                          Dernière révision par {reviewData.reviewerName} le {new Date(reviewData.reviewedAt).toLocaleString()}
                      </p>
                  )}
              </div>
          </div>
        </div>

        <div className="p-4 flex justify-end gap-2 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 print:hidden">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300">Annuler</button>
          <button onClick={handleSave} className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 shadow-sm">
              Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmissionEditorModal;
