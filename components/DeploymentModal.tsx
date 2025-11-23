
import React, { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';
import { deployToKobo } from '../services/koboService';

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeploymentModal: React.FC<DeploymentModalProps> = ({ isOpen, onClose }) => {
    const { activeProject, updateKoboSettings } = useProject();
    const { addNotification } = useNotification();

    const [serverUrl, setServerUrl] = useState('');
    const [apiToken, setApiToken] = useState('');
    const [isDeploying, setIsDeploying] = useState(false);

    useEffect(() => {
        if (isOpen && activeProject) {
            setServerUrl(activeProject.koboServerUrl || 'https://kf.kobotoolbox.org');
            setApiToken(activeProject.koboApiToken || '');
        }
    }, [isOpen, activeProject]);

    if (!isOpen || !activeProject) return null;

    const handleDeploy = async () => {
        setIsDeploying(true);
        try {
            const assetUid = await deployToKobo(activeProject, serverUrl, apiToken);
            updateKoboSettings({ serverUrl, apiToken, assetUid });
            addNotification(`Déploiement réussi ! Asset UID: ${assetUid}`, 'success');
            onClose();
        } catch (error: any) {
            addNotification(`Erreur de déploiement: ${error.message}`, 'error');
        } finally {
            setIsDeploying(false);
        }
    };

    const inputClass = "mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-isma-blue focus:ring-isma-blue dark:bg-gray-700 dark:border-gray-600";
    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
                <header className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold">Déployer sur KoboToolbox</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-6 space-y-4">
                    <div>
                        <label htmlFor="serverUrl" className={labelClass}>URL du Serveur Kobo</label>
                        <input type="text" id="serverUrl" value={serverUrl} onChange={e => setServerUrl(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                        <label htmlFor="apiToken" className={labelClass}>Clé d'API (Token)</label>
                        <input type="password" id="apiToken" value={apiToken} onChange={e => setApiToken(e.target.value)} className={inputClass} />
                    </div>
                    {activeProject.koboAssetUid && (
                        <p className="text-xs p-2 bg-blue-50 dark:bg-blue-900/50 rounded-md">
                            Ce projet est déjà lié à un formulaire sur Kobo (UID: {activeProject.koboAssetUid}). Le déploiement mettra à jour le formulaire existant.
                        </p>
                    )}
                </main>
                <footer className="p-4 flex justify-end border-t dark:border-gray-700">
                    <button onClick={handleDeploy} disabled={isDeploying || !serverUrl || !apiToken} className="px-4 py-2 text-sm font-medium text-white bg-isma-blue rounded-md hover:bg-isma-blue-dark disabled:opacity-50">
                        {isDeploying ? 'Déploiement...' : (activeProject.koboAssetUid ? 'Mettre à jour' : 'Déployer')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default DeploymentModal;
