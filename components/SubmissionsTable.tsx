
import React, { useMemo, useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { Submission } from '../types';
import { getLocalizedText } from '../utils/localizationUtils';
import { exportResponses } from '../utils/responseExporter';

interface SubmissionsTableProps {
    onEdit: (submission: Submission) => void;
}

const SubmissionsTable: React.FC<SubmissionsTableProps> = ({ onEdit }) => {
    const { activeProject, deleteSubmission, updateSubmission } = useProject();
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [selectedAgent, setSelectedAgent] = useState<string>('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    if (!activeProject) return <div>No project data.</div>;

    const { survey, settings } = activeProject.formData;
    const defaultLang = settings.default_language || 'default';

    const columns = useMemo(() => {
        const questionCols = survey
            .filter(q => !['note', 'begin_group', 'end_group', 'calculate'].includes(q.type))
            .map(q => ({
                key: q.name,
                header: getLocalizedText(q.label, defaultLang) || q.name,
                type: 'data'
            }));
            
        return [
            { key: 'agent_info', header: 'Agent / Source', type: 'meta' },
            ...questionCols
        ];
    }, [survey, defaultLang]);

    const agentList = useMemo(() => {
        const agents = new Set<string>();
        activeProject.submissions.forEach(s => {
            if (s.metadata?.agentName) agents.add(s.metadata.agentName);
        });
        return Array.from(agents);
    }, [activeProject.submissions]);

    const sortedSubmissions = useMemo(() => {
        let sortableItems = [...activeProject.submissions];
        
        if (selectedAgent !== 'all') {
            sortableItems = sortableItems.filter(s => s.metadata?.agentName === selectedAgent);
        }

        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let aValue: any, bValue: any;
                
                if (sortConfig.key === 'agent_info') {
                    aValue = a.metadata?.agentName || '';
                    bValue = b.metadata?.agentName || '';
                } else {
                    aValue = a.data[sortConfig.key];
                    bValue = b.data[sortConfig.key];
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [activeProject.submissions, sortConfig, selectedAgent]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleExport = (format: 'xlsx' | 'json') => {
        exportResponses(activeProject.submissions, survey, settings.form_id, format);
    };

    const renderCellContent = (value: any) => {
        const strValue = String(value ?? '');
        if (strValue.startsWith('data:image/')) {
            return <img src={strValue} alt="submission" className="h-10 w-10 object-cover rounded-md" />;
        }
        return strValue;
    };

    // --- Bulk Actions Logic ---
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(sortedSubmissions.map(s => s.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectRow = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = () => {
        if (window.confirm(`Supprimer définitivement ${selectedIds.size} soumission(s) ?`)) {
            selectedIds.forEach(id => deleteSubmission(id));
            setSelectedIds(new Set());
        }
    };

    const handleBulkStatusChange = (status: 'finalized' | 'synced') => {
        selectedIds.forEach(id => {
            const sub = activeProject.submissions.find(s => s.id === id);
            if (sub) updateSubmission({ ...sub, status });
        });
        setSelectedIds(new Set());
    };

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                <div className="flex items-center gap-4">
                    <h3 className="font-semibold flex items-center gap-2">
                        <span>Données</span>
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-500">{sortedSubmissions.length}</span>
                    </h3>
                    
                    <div className="relative">
                        <select 
                            value={selectedAgent} 
                            onChange={(e) => setSelectedAgent(e.target.value)}
                            className="text-xs border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 pr-8 bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="all">Tous les agents</option>
                            {agentList.map(agent => (
                                <option key={agent} value={agent}>{agent}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Barre d'actions en masse */}
                {selectedIds.size > 0 ? (
                    <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800 animate-fadeIn">
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">{selectedIds.size} sélectionné(s)</span>
                        <div className="h-4 w-px bg-indigo-200 dark:bg-indigo-700 mx-1"></div>
                        <button onClick={() => handleBulkStatusChange('synced')} className="text-xs text-green-600 hover:bg-green-100 px-2 py-1 rounded" title="Marquer comme Synchronisé">✅ Valider</button>
                        <button onClick={handleBulkDelete} className="text-xs text-red-600 hover:bg-red-100 px-2 py-1 rounded" title="Supprimer la sélection">🗑️ Supprimer</button>
                    </div>
                ) : (
                    <div>
                        <button onClick={() => handleExport('xlsx')} className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 mr-2">Exporter XLS</button>
                        <button onClick={() => handleExport('json')} className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">Exporter JSON</button>
                    </div>
                )}
            </div>
            
            <div className="flex-1 overflow-auto relative">
                <table className="min-w-full text-sm text-left border-collapse">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700 z-10 shadow-sm">
                        <tr>
                            <th className="p-3 w-10 border-b dark:border-gray-600 text-center">
                                <input 
                                    type="checkbox" 
                                    onChange={handleSelectAll} 
                                    checked={selectedIds.size === sortedSubmissions.length && sortedSubmissions.length > 0}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                />
                            </th>
                            <th className="p-3 border-b dark:border-gray-600 font-semibold text-gray-600 dark:text-gray-200 w-24">Actions</th>
                            {columns.map(col => (
                                <th key={col.key} className="p-3 border-b dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 font-semibold text-gray-600 dark:text-gray-200 whitespace-nowrap" onClick={() => requestSort(col.key)}>
                                    {col.header} {sortConfig?.key === col.key ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {sortedSubmissions.map(sub => (
                            <tr key={sub.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedIds.has(sub.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                                <td className="p-3 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.has(sub.id)} 
                                        onChange={() => handleSelectRow(sub.id)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                </td>
                                <td className="p-3 whitespace-nowrap flex gap-2">
                                    <button onClick={() => onEdit(sub)} className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50" title="Éditer">✏️</button>
                                    <button onClick={() => deleteSubmission(sub.id)} className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50" title="Supprimer">🗑️</button>
                                </td>
                                {columns.map(col => {
                                    if (col.key === 'agent_info') {
                                        return (
                                            <td key={col.key} className="p-3 whitespace-nowrap">
                                                {sub.metadata ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold uppercase">
                                                            {(sub.metadata.agentName || '?').charAt(0)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{sub.metadata.agentName}</span>
                                                            <span className="text-[10px] text-gray-400 font-mono">{sub.metadata.agentCode}</span>
                                                        </div>
                                                        {sub.metadata.digitalSignature && (
                                                            <span title="Signature numérique vérifiée" className="text-green-500 ml-1 text-xs">🛡️</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Inconnu</span>
                                                )}
                                            </td>
                                        )
                                    }
                                    return (
                                        <td key={col.key} className="p-3 whitespace-nowrap overflow-hidden text-ellipsis max-w-xs text-gray-600 dark:text-gray-300">
                                            {renderCellContent(sub.data[col.key])}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SubmissionsTable;
