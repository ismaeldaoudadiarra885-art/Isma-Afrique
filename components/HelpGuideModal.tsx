
import React, { useState } from 'react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('shortcuts');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-[70vh] flex flex-col">
        <header className="flex justify-between items-center p-4 border-b dark:border-gray-700 bg-indigo-600 text-white rounded-t-lg">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>📚</span> Centre d'Aide ISMA
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20">
            ✕
          </button>
        </header>

        <div className="flex border-b dark:border-gray-700">
            <button onClick={() => setActiveTab('shortcuts')} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'shortcuts' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}>
                ⌨️ Raccourcis
            </button>
            <button onClick={() => setActiveTab('concepts')} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'concepts' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}>
                💡 Concepts Clés
            </button>
            <button onClick={() => setActiveTab('security')} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'security' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}>
                🔒 Sécurité
            </button>
        </div>

        <main className="p-6 flex-1 overflow-y-auto">
            {activeTab === 'shortcuts' && (
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 dark:text-white">Navigation & Productivité</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border dark:border-gray-600">
                            <span>Ouvrir l'Aide</span>
                            <kbd className="bg-white dark:bg-gray-800 px-2 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs shadow-sm">F1</kbd>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border dark:border-gray-600">
                            <span>Sauvegarder</span>
                            <kbd className="bg-white dark:bg-gray-800 px-2 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs shadow-sm">Ctrl + S</kbd>
                        </div>
                        <div className="flex justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border dark:border-gray-600">
                            <span>Fermer Modale</span>
                            <kbd className="bg-white dark:bg-gray-800 px-2 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs shadow-sm">Esc</kbd>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'concepts' && (
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                    <div>
                        <h4 className="font-bold text-indigo-600 mb-1">XLSForm</h4>
                        <p>Le standard international utilisé par ISMA. Chaque ligne est une question, chaque colonne un paramètre.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-indigo-600 mb-1">Relevant (Logique de saut)</h4>
                        <p>Définit QUAND une question s'affiche. Ex: <code>{'${age} > 18'}</code>.</p>
                    </div>
                    <div>
                        <h4 className="font-bold text-indigo-600 mb-1">Constraint (Validation)</h4>
                        <p>Définit si une réponse est VALIDE. Le point <code>.</code> représente la réponse actuelle. Ex: <code>. &lt; 100</code>.</p>
                    </div>
                </div>
            )}

            {activeTab === 'security' && (
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200">
                        <h4 className="font-bold text-green-700 dark:text-green-400 mb-1">Mode Souverain (Local)</h4>
                        <p>Les données restent sur votre appareil. Utilisez le Transfert Sécurisé (QR Code) pour les envoyer au superviseur sans passer par internet.</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200">
                        <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-1">Mode Cloud (KoboToolbox)</h4>
                        <p>Les données sont envoyées vers le serveur Kobo de votre organisation. Nécessite une connexion internet.</p>
                    </div>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default HelpGuideModal;
