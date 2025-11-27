
import React, { useMemo, useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { Submission } from '../types';

const CaseExplorer: React.FC = () => {
    const { activeProject } = useProject();
    const [groupBy, setGroupBy] = useState<string>('');
    
    // Detect potential ID fields (fields ending in 'id', 'uuid', 'matricule', or simply first text field)
    const idFields = useMemo(() => {
        if (!activeProject) return [];
        return activeProject.formData.survey
            .filter(q => q.type === 'text' || q.type === 'integer')
            .map(q => q.name);
    }, [activeProject]);

    // Default to first likely ID field
    React.useEffect(() => {
        if (idFields.length > 0 && !groupBy) {
            const likelyId = idFields.find(f => f.includes('id') || f.includes('nom')) || idFields[0];
            setGroupBy(likelyId);
        }
    }, [idFields, groupBy]);

    const cases = useMemo<Record<string, Submission[]>>(() => {
        if (!activeProject || !groupBy) return {};
        
        const groups: Record<string, Submission[]> = {};
        
        activeProject.submissions.forEach(sub => {
            const key = String(sub.data[groupBy] || 'Sans Identifiant');
            if (!groups[key]) groups[key] = [];
            groups[key].push(sub);
        });
        
        return groups;
    }, [activeProject, groupBy]);

    if (!activeProject) return null;

    return (
        <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900">
            <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">🗂️ Dossiers Bénéficiaires</h3>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500">Regrouper par :</label>
                    <select 
                        value={groupBy} 
                        onChange={(e) => setGroupBy(e.target.value)}
                        className="text-sm border border-gray-300 dark:border-gray-600 rounded-md p-1.5 bg-gray-50 dark:bg-gray-700"
                    >
                        {idFields.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(Object.entries(cases) as [string, Submission[]][]).map(([caseId, subs]) => (
                    <div key={caseId} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-lg">{caseId}</h4>
                                <span className="text-xs text-indigo-600 dark:text-indigo-400">{subs.length} activités enregistrées</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-xl">
                                👤
                            </div>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {[...subs].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(sub => (
                                <div key={sub.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex justify-between items-center">
                                    <div>
                                        <div className="text-xs font-bold text-gray-500 uppercase mb-0.5">
                                            {new Date(sub.timestamp).toLocaleDateString()}
                                        </div>
                                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                            Soumission {sub.status === 'synced' ? '✅' : '📝'}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            Agent: {sub.metadata?.agentName || 'N/A'}
                                        </div>
                                    </div>
                                    <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                                        Voir détails
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {Object.keys(cases).length === 0 && (
                    <p className="text-center text-gray-400 mt-10">Aucun dossier trouvé pour ce critère.</p>
                )}
            </div>
        </div>
    );
};

export default CaseExplorer;
