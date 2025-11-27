
import React from 'react';
import { useProject } from '../contexts/ProjectContext';

const VersionHistory: React.FC = () => {
    const { activeProject, restoreProjectVersion } = useProject();

    if (!activeProject || !activeProject.versions || activeProject.versions.length === 0) {
        return <p className="p-4 text-sm text-center text-gray-500">Aucune version sauvegardée.</p>;
    }

    const handleRestore = (versionId: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir restaurer cette version ? Les modifications non sauvegardées seront perdues.")) {
            restoreProjectVersion(versionId);
        }
    };

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-3">Historique des Versions</h3>
            <div className="space-y-3">
                {activeProject.versions.slice().reverse().map(version => (
                    <div key={version.id} className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm font-semibold">{version.comment || 'Sauvegarde automatique'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(version.timestamp).toLocaleString('fr-FR')}
                                </p>
                            </div>
                            <button 
                                onClick={() => handleRestore(version.id)}
                                className="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                            >
                                Restaurer
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VersionHistory;
