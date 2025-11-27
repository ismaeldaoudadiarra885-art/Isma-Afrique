
import React, { useState, useMemo } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { getLocalizedText } from '../utils/localizationUtils';

const CrossTabAnalysis: React.FC = () => {
    const { activeProject } = useProject();
    const [rowVar, setRowVar] = useState<string>('');
    const [colVar, setColVar] = useState<string>('');

    if (!activeProject) return null;

    const { formData, submissions } = activeProject;
    const defaultLang = formData.settings.default_language || 'default';

    // Filter questions suitable for crosstabs (select_one, select_multiple, integer)
    const availableQuestions = useMemo(() => {
        return formData.survey.filter(q => 
            ['select_one', 'select_multiple', 'integer'].includes(q.type) || 
            (q.type === 'text' && q.appearance !== 'multiline')
        );
    }, [formData.survey]);

    const matrix = useMemo(() => {
        if (!rowVar || !colVar) return null;

        const rowQuestion = availableQuestions.find(q => q.name === rowVar);
        const colQuestion = availableQuestions.find(q => q.name === colVar);

        const rowValues = new Set<string>();
        const colValues = new Set<string>();
        const counts: Record<string, Record<string, number>> = {};

        submissions.forEach(sub => {
            let rVal = String(sub.data[rowVar] ?? 'N/A');
            let cVal = String(sub.data[colVar] ?? 'N/A');

            // Simplification pour integer : grouper ? Pour l'instant on prend la valeur brute
            // Pour select_multiple, on pourrait splitter, ici on prend la combinaison pour simplifier
            
            rowValues.add(rVal);
            colValues.add(cVal);

            if (!counts[rVal]) counts[rVal] = {};
            counts[rVal][cVal] = (counts[rVal][cVal] || 0) + 1;
        });

        return {
            rows: Array.from(rowValues).sort(),
            cols: Array.from(colValues).sort(),
            counts,
            total: submissions.length,
            rowLabel: getLocalizedText(rowQuestion?.label, defaultLang) || rowVar,
            colLabel: getLocalizedText(colQuestion?.label, defaultLang) || colVar
        };
    }, [rowVar, colVar, submissions, availableQuestions, defaultLang]);

    const getHeatmapColor = (value: number, max: number) => {
        if (max === 0) return 'bg-white';
        const intensity = value / max;
        if (intensity > 0.75) return 'bg-indigo-600 text-white';
        if (intensity > 0.5) return 'bg-indigo-400 text-white';
        if (intensity > 0.25) return 'bg-indigo-200 text-indigo-900';
        if (value > 0) return 'bg-indigo-50 text-indigo-800';
        return 'bg-white text-gray-300';
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 p-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <span>🔄</span> Tableaux Croisés Dynamiques
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Variable Ligne (X)</label>
                        <select 
                            value={rowVar} 
                            onChange={e => setRowVar(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-sm"
                        >
                            <option value="">-- Sélectionner --</option>
                            {availableQuestions.map(q => (
                                <option key={q.uid} value={q.name}>{getLocalizedText(q.label, defaultLang)} ({q.name})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Variable Colonne (Y)</label>
                        <select 
                            value={colVar} 
                            onChange={e => setColVar(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-sm"
                        >
                            <option value="">-- Sélectionner --</option>
                            {availableQuestions.map(q => (
                                <option key={q.uid} value={q.name}>{getLocalizedText(q.label, defaultLang)} ({q.name})</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                {!matrix ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <span className="text-4xl mb-2">📉</span>
                        <p>Sélectionnez deux variables pour générer l'analyse.</p>
                    </div>
                ) : (
                    <div className="min-w-full">
                        <div className="mb-4 text-center">
                            <span className="font-bold text-indigo-600">{matrix.rowLabel}</span>
                            <span className="mx-2 text-gray-400">CROISÉ AVEC</span>
                            <span className="font-bold text-purple-600">{matrix.colLabel}</span>
                        </div>
                        
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr>
                                    <th className="p-2 border bg-gray-100 dark:bg-gray-700 font-mono text-xs text-gray-500">X \ Y</th>
                                    {matrix.cols.map(col => (
                                        <th key={col} className="p-2 border bg-gray-50 dark:bg-gray-700/50 font-semibold text-gray-700 dark:text-gray-300 min-w-[100px]">
                                            {col}
                                        </th>
                                    ))}
                                    <th className="p-2 border bg-gray-100 dark:bg-gray-700 font-bold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matrix.rows.map(row => {
                                    let rowTotal = 0;
                                    return (
                                        <tr key={row}>
                                            <td className="p-2 border bg-gray-50 dark:bg-gray-700/50 font-semibold text-gray-700 dark:text-gray-300">
                                                {row}
                                            </td>
                                            {matrix.cols.map(col => {
                                                const val = matrix.counts[row]?.[col] || 0;
                                                rowTotal += val;
                                                return (
                                                    <td key={`${row}-${col}`} className={`p-2 border text-center ${getHeatmapColor(val, matrix.total / 2)}`}>
                                                        {val}
                                                    </td>
                                                );
                                            })}
                                            <td className="p-2 border font-bold text-center bg-gray-50 dark:bg-gray-800">
                                                {rowTotal}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="mt-4 text-xs text-gray-500 text-right">
                            Total de l'échantillon : {matrix.total} soumissions
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CrossTabAnalysis;
