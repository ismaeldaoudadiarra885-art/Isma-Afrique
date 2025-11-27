
import React, { useState, useEffect, useRef } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';
import { deployToKobo } from '../services/koboService';
import QRCode from 'qrcode';

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeploymentModal: React.FC<DeploymentModalProps> = ({ isOpen, onClose }) => {
    const { activeProject, updateKoboSettings } = useProject();
    const { addNotification } = useNotification();

    const [serverUrl, setServerUrl] = useState('');
    const [apiToken, setApiToken] = useState('');
    const [assetUid, setAssetUid] = useState('');
    const [isDeploying, setIsDeploying] = useState(false);
    const [activeTab, setActiveTab] = useState<'kobo' | 'odk'>('kobo');
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (isOpen && activeProject) {
            setServerUrl(activeProject.koboServerUrl || 'https://kf.kobotoolbox.org');
            setApiToken(activeProject.koboApiToken || '');
            setAssetUid(activeProject.koboAssetUid || '');
        }
    }, [isOpen, activeProject]);

    // Generate QR Code whenever we switch to ODK tab
    useEffect(() => {
        if (activeTab === 'odk' && canvasRef.current) {
            generateODKQrCode();
        }
    }, [activeTab, serverUrl, apiToken]);

    if (!isOpen || !activeProject) return null;

    const handleDeploy = async () => {
        setIsDeploying(true);
        try {
            const newAssetUid = await deployToKobo(activeProject, serverUrl, apiToken);
            setAssetUid(newAssetUid);
            updateKoboSettings({ serverUrl, apiToken, assetUid: newAssetUid });
            addNotification(`Déploiement réussi ! Asset UID: ${newAssetUid}`, 'success');
            setActiveTab('odk');
        } catch (error: any) {
            addNotification(`Erreur de déploiement API: ${error.message}. Essayez la configuration manuelle ci-dessous si le problème persiste.`, 'error');
        } finally {
            setIsDeploying(false);
        }
    };

    const handleSaveConfigManual = () => {
        if (!serverUrl || !apiToken) {
            addNotification("URL et Token sont requis.", "warning");
            return;
        }
        updateKoboSettings({ serverUrl, apiToken, assetUid });
        addNotification("Configuration sauvegardée manuellement. Vous pouvez maintenant synchroniser.", "success");
        if(assetUid) setActiveTab('odk');
    };

    // Helper to guess KC URL from KF URL
    const getKcUrl = (url: string) => {
        if (url.includes('kf.kobotoolbox.org')) return 'https://kc.kobotoolbox.org';
        if (url.includes('kobo.humanitarianresponse.info')) return 'https://kc.humanitarianresponse.info';
        return url.replace('kf.', 'kc.'); // Heuristic
    };

    const generateODKQrCode = () => {
        const settings = {
            general: {
                server_url: getKcUrl(serverUrl),
            },
            admin: {}
        };
        
        const qrContent = JSON.stringify(settings);

        // Robustesse : vérification de la lib
        const qrLib = QRCode;
        if (qrLib && typeof qrLib.toCanvas === 'function') {
            qrLib.toCanvas(canvasRef.current, qrContent, { width: 256 }, (error) => {
                if (error) console.error(error);
            });
        } else {
            console.warn("Librairie QRCode non disponible pour le rendu canvas");
        }
    };

    const inputClass = "mt-1 block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-deep focus:ring-indigo-deep dark:bg-gray-700 dark:border-gray-600 p-2 border";
    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Configuration & Déploiement</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <div className="flex border-b dark:border-gray-700">
                    <button onClick={() => setActiveTab('kobo')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'kobo' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>Serveur KoboToolbox</button>
                    <button onClick={() => setActiveTab('odk')} className={`flex-1 py-3 text-sm font-medium ${activeTab === 'odk' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}>Mobile (ODK Collect)</button>
                </div>

                <main className="p-6 flex-1 overflow-y-auto">
                    {activeTab === 'kobo' && (
                        <div className="space-y-5">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200">
                                <p className="font-bold">ℹ️ Mode Centralisé (Cloud)</p>
                                <p>Connectez ce projet à un compte KoboToolbox pour centraliser les données de plusieurs enquêteurs.</p>
                            </div>
                            <div>
                                <label className={labelClass}>Serveur API (KF URL)</label>
                                <input type="text" value={serverUrl} onChange={e => setServerUrl(e.target.value)} className={inputClass} placeholder="https://kf.kobotoolbox.org" />
                            </div>
                            <div>
                                <label className={labelClass}>Token API (Account Settings &gt; Developer)</label>
                                <input type="password" value={apiToken} onChange={e => setApiToken(e.target.value)} className={inputClass} placeholder="Ex: 34958..." />
                            </div>
                            
                            {/* Zone de déploiement automatique */}
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                <button onClick={handleDeploy} disabled={isDeploying} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md disabled:opacity-50 transition-all flex justify-center items-center gap-2">
                                    {isDeploying ? 'Tentative de connexion...' : (activeProject.koboAssetUid ? 'Mettre à jour le déploiement' : 'Déployer Automatiquement')}
                                </button>
                                <p className="text-xs text-gray-400 mt-1 text-center">Tente de créer le projet sur Kobo via l'API.</p>
                            </div>

                            {/* Zone de configuration manuelle (Secours) */}
                            <div className="mt-4 pt-4 border-t border-dashed border-gray-300 dark:border-gray-600">
                                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Option de Secours : Configuration Manuelle</h4>
                                <p className="text-xs text-gray-500 mb-2">Si le déploiement échoue (erreur CORS/Réseau), créez le projet manuellement sur KoboToolbox et collez l'ID (uid) ici.</p>
                                <div>
                                    <label className={labelClass}>ID du Projet (Asset UID)</label>
                                    <input type="text" value={assetUid} onChange={e => setAssetUid(e.target.value)} className={`${inputClass} font-mono`} placeholder="Ex: aKx7..." />
                                </div>
                                <button onClick={handleSaveConfigManual} className="mt-2 w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition-colors text-sm">
                                    Sauvegarder la Configuration (Sans déployer)
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'odk' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg border dark:border-gray-700">
                                        <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">Paramètres Serveur</h4>
                                        <div className="space-y-2 text-sm font-mono">
                                            <div>
                                                <span className="text-gray-500">URL :</span>
                                                <div className="bg-white dark:bg-gray-800 p-2 rounded border select-all break-all">{getKcUrl(serverUrl)}</div>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Login :</span>
                                                <div className="bg-white dark:bg-gray-800 p-2 rounded border text-gray-400 italic">{'<votre_login_kobo>'}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        <p className="font-bold mb-1">Instructions :</p>
                                        <ol className="list-decimal pl-5 space-y-1">
                                            <li>Ouvrez <strong>ODK Collect</strong> sur le téléphone.</li>
                                            <li>Allez dans <strong>Configurer le projet</strong>.</li>
                                            <li>Scannez le QR Code ci-contre.</li>
                                            <li>Entrez votre mot de passe Kobo si demandé.</li>
                                        </ol>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-inner border border-gray-200">
                                    <canvas ref={canvasRef} className="w-48 h-48"></canvas>
                                    <p className="text-xs text-gray-500 mt-2 font-mono">Configuration Rapide</p>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default DeploymentModal;
