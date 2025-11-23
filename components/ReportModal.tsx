// FIX: Created placeholder content for ReportModal.tsx to resolve module error.
import React from 'react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">Génération de Rapport</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300">
            La génération de rapports automatisés sera disponible dans une future version.
          </p>
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

export default ReportModal;
