import React, { useMemo, useState, useEffect } from 'react';

import { useProject } from '../contexts/ProjectContext';
import { Submission, PerformanceMetrics } from '../types';
import { getLocalizedText } from '../utils/localizationUtils';
import { exportResponses } from '../utils/responseExporter';
import { exportSubmissionsToCsv, exportSubmissionsToSqlite, exportSubmissionsToApiJson } from '../utils/exportUtils';
import { performanceService } from '../services/performanceService';
import { supabase } from '../services/supabaseClient';

interface SubmissionsTableProps {
    onEdit: (submission: Submission) => void;
}

const SubmissionsTable: React.FC<SubmissionsTableProps> = ({ onEdit }) => {
    const { activeProject, deleteSubmission } = useProject();
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
    const [isSupervisor, setIsSupervisor] = useState(false);

    useEffect(() => {
        if (activeProject?.id) {
            // Assume user role is 'supervisor' for demo; in real app, get from context
            setIsSupervisor(true); // Placeholder
            loadMetrics();
            // const unsubscribe = performanceService.subscribeToMetrics(activeProject.id, setMetrics);
            // return unsubscribe;
        }
    }, [activeProject?.id]);

    const loadMetrics = async () => {
        if (activeProject?.id) {
            const data = await performanceService.getAllEnumeratorsMetrics(activeProject.id);
            setMetrics(data);
        }
    };

    if (!activeProject) return <div>No project data.</div>;

    const { survey, settings } = activeProject.formData;
    const defaultLang = settings.default_language || 'default';

    const columns = useMemo(() => {
        return [
            ...survey
                .filter(q => !['note', 'begin_group', 'end_group', 'calculate'].includes(q.type))
                .map(q => ({
                    key: q.name,
                    header: getLocalizedText(q.label, defaultLang) || q.name,
                })),
            { key: 'validationStatus', header: 'Statut Validation' },
            { key: 'validatedBy', header: 'Validé Par' }
        ];
    }, [survey, defaultLang]);

    const sortedSubmissions = useMemo(() => {
        let sortableItems = [...activeProject.submissions];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a.data[sortConfig.key];
                const bValue = b.data[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [activeProject.submissions, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handleExport = async (format: 'xlsx' | 'json' | 'csv' | 'sqlite' | 'api-json') => {
        const formId = settings.form_id;
        switch (format) {
            case 'xlsx':
            case 'json':
                exportResponses(activeProject.submissions, survey, formId, format);
                break;
            case 'csv':
                exportSubmissionsToCsv(activeProject.submissions, survey, formId);
                break;
            case 'sqlite':
                await exportSubmissionsToSqlite(activeProject.submissions, survey, formId);
                break;
            case 'api-json':
                exportSubmissionsToApiJson(activeProject.submissions, survey, formId);
                break;
        }
    };

    const renderCellContent = (value: any) => {
        const strValue = String(value ?? '');
        if (strValue.startsWith('data:image/')) {
            return <img src={strValue} alt="submission" className="h-10 w-10 object-cover rounded-md" />;
        }
        return strValue;
    };

    const handleApprove = async (submissionId: string) => {
        const { error } = await supabase
            .from('submissions')
            .update({
                validationStatus: 'validated' as const,
                validatedBy: 'supervisor_placeholder', // Placeholder
                validationTimestamp: new Date().toISOString()
            })
            .eq('id', submissionId);
        if (error) console.error('Error approving submission:', error);
        else loadMetrics(); // Refresh metrics
    };

    const handleReject = async (submissionId: string) => {
        const { error } = await supabase
            .from('submissions')
            .update({
                validationStatus: 'rejected' as const,
                validatedBy: 'supervisor_placeholder', // Placeholder
                validationTimestamp: new Date().toISOString()
            })
            .eq('id', submissionId);
        if (error) console.error('Error rejecting submission:', error);
        else loadMetrics();
    };

    const getStatusBadge = (status?: string) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            validated: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            'auto_flagged': 'bg-orange-100 text-orange-800'
        };
        return status ? `px-2 py-1 rounded-full text-xs ${badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'}` : 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs';
    };

    const Row = ({ index }: { index: number }) => {
        const sub = sortedSubmissions[index];
        return (
            <div className="flex border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="p-2 flex gap-2 w-20 flex-shrink-0">
                    <button onClick={() => onEdit(sub)} className="text-xs">✏️</button>
                    <button onClick={() => deleteSubmission(sub.id)} className="text-xs">🗑️</button>
                    {isSupervisor && (
                        <>
                            <button onClick={() => handleApprove(sub.id)} className="text-xs text-green-600">✅</button>
                            <button onClick={() => handleReject(sub.id)} className="text-xs text-red-600">❌</button>
                        </>
                    )}
                </div>
                {columns.map(col => {
                    if (col.key === 'validationStatus') {
                        return (
                            <div key={col.key} className="p-2 whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0">
                                <span className={getStatusBadge(sub.validationStatus)}>{sub.validationStatus || 'pending'}</span>
                            </div>
                        );
                    }
                    if (col.key === 'validatedBy') {
                        return (
                            <div key={col.key} className="p-2 whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0">
                                {sub.validatedBy || '-'}
                            </div>
                        );
                    }
                    return (
                        <div key={col.key} className="p-2 whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0">
                            {renderCellContent(sub.data[col.key])}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Soumissions ({activeProject.submissions.length})</h3>
                 <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleExport('xlsx')} className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all duration-200 hover:scale-105 shadow-md">Exporter XLS</button>
                    <button onClick={() => handleExport('json')} className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-deep to-indigo-deep-light text-white rounded-lg hover:from-indigo-deep-light hover:to-indigo-deep transition-all duration-200 hover:scale-105 shadow-md">Exporter JSON</button>
                    <button onClick={() => handleExport('csv')} className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-ocre-gold to-ocre-gold-light text-white rounded-lg hover:from-ocre-gold-light hover:to-ocre-gold transition-all duration-200 hover:scale-105 shadow-md">Exporter CSV</button>
                    <button onClick={() => handleExport('sqlite')} className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-red-earth to-red-earth-light text-white rounded-lg hover:from-red-earth-light hover:to-red-earth transition-all duration-200 hover:scale-105 shadow-md">Exporter SQLite</button>
                    <button onClick={() => handleExport('api-json')} className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-600 transition-all duration-200 hover:scale-105 shadow-md">Exporter API JSON</button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    <div className="p-2 w-20 flex-shrink-0 font-medium">Actions</div>
                    {columns.map(col => (
                        <div key={col.key} className="p-2 cursor-pointer flex-1 min-w-0 font-medium" onClick={() => requestSort(col.key)}>
                            {col.header}
                        </div>
                    ))}
                </div>
                <div className="overflow-y-auto max-h-96">
                    {sortedSubmissions.map((sub, index) => (
                        <div key={sub.id}>
                            <Row index={index} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Performance Metrics Dashboard */}
            {isSupervisor && metrics.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-semibold mb-4">Performances des Enquêteurs</h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Enquêteur</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nombre Soumissions</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Taux d'Erreurs (%)</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Temps Moyen (ms)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 dark:divide-gray-600 dark:bg-gray-800">
                                {metrics.map((metric) => (
                                    <tr key={metric.enumeratorId}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{metric.enumeratorId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{metric.submissionCount}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                                            <span className={`px-2 py-1 rounded-full text-xs ${metric.errorRate > 20 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                {metric.errorRate.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{metric.avgCompletionTime || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubmissionsTable;
