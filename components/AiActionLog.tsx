import React from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../hooks/useTranslation';

const AuditLog: React.FC = () => {
    const { auditLog } = useProject();
    const { t } = useLanguage();

    const getActorIcon = (actor: 'user' | 'ai') => {
        return actor === 'ai' ? (
            <span title="Action IA" className="text-lg">🤖</span>
        ) : (
            <span title="Action Utilisateur" className="text-lg">👤</span>
        );
    }

    const handleExport = () => {
        if (auditLog.length === 0) return;
        
        const header = "id,timestamp,actor,action,details\n";
        const rows = auditLog.map(log => {
            const details = JSON.stringify(log.details).replace(/"/g, '""');
            return `"${log.id}","${log.timestamp}","${log.actor}","${log.action}","${details}"`;
        }).join('\n');

        const csvContent = header + rows;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "audit_log.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-4 flex flex-col h-full">
            <div className="flex justify-between items-center mb-3">
                 <h3 className="text-lg font-semibold">Journal d'Audit</h3>
                 <button
                    id="btnExportAuditLog"
                    onClick={handleExport}
                    disabled={auditLog.length === 0}
                    className="px-3 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                    aria-label="Exporter le journal d'audit au format CSV"
                 >
                    {t('auditLog_export')}
                 </button>
            </div>
           
            {auditLog.length > 0 ? (
                <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                    {auditLog.slice().reverse().map(log => (
                        <div key={log.id} className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md text-sm">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    {getActorIcon(log.actor)}
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{log.action}</p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                                </p>
                            </div>
                            <pre className="mt-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-900/50 p-2 rounded-md overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                            </pre>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                    Aucune action n'a encore été enregistrée.
                </p>
            )}
        </div>
    );
};

export default AuditLog;