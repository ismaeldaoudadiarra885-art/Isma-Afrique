import React from 'react';

interface ImportStatusModalProps {
  isOpen: boolean;
  message: string;
}

const ImportStatusModal: React.FC<ImportStatusModalProps> = ({ isOpen, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 text-center">
        <h2 className="text-lg font-semibold mb-4">Importation en cours</h2>
        <div className="flex items-center justify-center space-x-2 my-4">
            <svg className="animate-spin h-8 w-8 text-isma-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">Cette opération peut prendre jusqu'à une minute pour les documents volumineux.</p>
      </div>
    </div>
  );
};

export default ImportStatusModal;
