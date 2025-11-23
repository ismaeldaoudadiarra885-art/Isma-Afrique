import React, { useState, useEffect } from 'react';
import { odkIntegrationService, ODKServerConfig } from '../services/odkIntegrationService';
import { supabaseService } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../hooks/useTranslation';

interface ODKIntegrationPanelProps {
  projectId: string;
  organizationId: string;
}

const ODKIntegrationPanel: React.FC<ODKIntegrationPanelProps> = ({
  projectId,
  organizationId
}) => {
  const { addNotification } = useNotification();
  const { t } = useLanguage();

  const [serverConfig, setServerConfig] = useState<{
    url: string;
    username: string;
    password: string;
    projectId?: string;
  }>({
    url: '',
    username: '',
    password: '',
    projectId: ''
  });

  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<{
    synced: number;
    errors: number;
    details: string[];
  } | null>(null);

  const [serverStatus, setServerStatus] = useState<{
    connected: boolean;
    projects?: any[];
    error?: string;
  } | null>(null);

  useEffect(() => {
    // Load saved configuration (would be stored in project settings)
    loadConfiguration();
  }, [projectId]);

  const loadConfiguration = async () => {
    try {
      // This would load from project settings in a real implementation
      // For now, we'll check if we have a saved config
      const savedConfig = localStorage.getItem(`odk-config-${projectId}`);
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        setServerConfig(config);
        setIsConfigured(true);
        odkIntegrationService.configureServer(config);
        await checkServerStatus();
      }
    } catch (error) {
      console.error('Error loading ODK configuration:', error);
    }
  };

  const saveConfiguration = async () => {
    try {
      localStorage.setItem(`odk-config-${projectId}`, JSON.stringify(serverConfig));
      odkIntegrationService.configureServer(serverConfig);
      setIsConfigured(true);
      addNotification('Configuration ODK sauvegardée', 'success');
    } catch (error) {
      addNotification('Erreur lors de la sauvegarde', 'error');
    }
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const connected = await odkIntegrationService.testConnection();
      setIsConnected(connected);

      if (connected) {
        addNotification('Connexion ODK réussie', 'success');
        await checkServerStatus();
      } else {
        addNotification('Échec de connexion au serveur ODK', 'error');
      }
    } catch (error) {
      addNotification('Erreur de connexion', 'error');
      setIsConnected(false);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const checkServerStatus = async () => {
    try {
      const status = await odkIntegrationService.getServerStatus();
      setServerStatus(status);
    } catch (error) {
      console.error('Error checking server status:', error);
    }
  };

  const syncSubmissions = async () => {
    if (!serverConfig.projectId) {
      addNotification('Veuillez configurer l\'ID du projet ODK', 'warning');
      return;
    }

    setIsSyncing(true);
    setSyncResults(null);

    try {
      const results = await odkIntegrationService.syncODKSubmissions(
        serverConfig.projectId,
        projectId,
        organizationId
      );

      setSyncResults(results);

      if (results.synced > 0) {
        addNotification(`${results.synced} soumissions synchronisées`, 'success');
      }
      if (results.errors > 0) {
        addNotification(`${results.errors} erreurs de synchronisation`, 'warning');
      }
    } catch (error) {
      addNotification('Erreur lors de la synchronisation', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const exportFormForODK = async () => {
    try {
      const filename = await odkIntegrationService.exportFormForODK(projectId);
      addNotification(`Formulaire exporté: ${filename}`, 'success');
    } catch (error) {
      addNotification('Erreur lors de l\'export du formulaire', 'error');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Intégration ODK Collect
      </h3>

      <div className="space-y-6">
        {/* Server Configuration */}
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            Configuration du serveur ODK
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL du serveur ODK Central
              </label>
              <input
                type="url"
                value={serverConfig.url}
                onChange={(e) => setServerConfig(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://odk-central.example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ID du projet ODK
              </label>
              <input
                type="text"
                value={serverConfig.projectId || ''}
                onChange={(e) => setServerConfig(prev => ({ ...prev, projectId: e.target.value }))}
                placeholder="123"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                value={serverConfig.username}
                onChange={(e) => setServerConfig(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={serverConfig.password}
                onChange={(e) => setServerConfig(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-4">
            <button
              onClick={saveConfiguration}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Sauvegarder
            </button>

            <button
              onClick={testConnection}
              disabled={isTestingConnection || !isConfigured}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {isTestingConnection ? 'Test en cours...' : 'Tester connexion'}
            </button>
          </div>

          {serverStatus && (
            <div className={`mt-3 p-3 rounded-md ${
              serverStatus.connected
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  {serverStatus.connected ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  )}
                </svg>
                {serverStatus.connected ? 'Connecté' : 'Non connecté'}
              </div>
              {serverStatus.error && (
                <p className="text-sm mt-1">{serverStatus.error}</p>
              )}
              {serverStatus.projects && (
                <p className="text-sm mt-1">
                  {serverStatus.projects.length} projet(s) trouvé(s)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {isConfigured && isConnected && (
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Actions de synchronisation
            </h4>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={syncSubmissions}
                disabled={isSyncing}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {isSyncing ? 'Synchronisation...' : 'Synchroniser soumissions'}
              </button>

              <button
                onClick={exportFormForODK}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
              >
                Exporter formulaire XLSForm
              </button>
            </div>

            {/* Sync Results */}
            {syncResults && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                  Résultats de synchronisation
                </h5>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{syncResults.synced}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Synchronisées</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{syncResults.errors}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Erreurs</div>
                  </div>
                </div>

                {syncResults.details.length > 0 && (
                  <div className="max-h-32 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded p-2">
                    <div className="text-xs space-y-1">
                      {syncResults.details.map((detail, index) => (
                        <div key={index} className={`${
                          detail.includes('Erreur') || detail.includes('Error')
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {detail}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            Comment utiliser l'intégration ODK
          </h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
            <p>
              <strong>1. Configuration:</strong> Configurez l'URL de votre serveur ODK Central et les identifiants.
            </p>
            <p>
              <strong>2. Export du formulaire:</strong> Exportez votre formulaire au format XLSForm pour le déployer sur ODK Central.
            </p>
            <p>
              <strong>3. Collecte:</strong> Utilisez ODK Collect sur mobile pour collecter les données sur le terrain.
            </p>
            <p>
              <strong>4. Synchronisation:</strong> Importez automatiquement les soumissions ODK dans votre application.
            </p>
            <p>
              <strong>5. Retours:</strong> Générez des codes d'accès pour permettre aux ménages de valider leurs données.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ODKIntegrationPanel;
