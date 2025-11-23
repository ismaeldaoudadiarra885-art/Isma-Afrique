import React, { useState, useMemo } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { getAIFormQualityAudit, getAIDataQualityAudit, getDataAnalysisInsight } from '../services/geminiService';
import { KoboProject, ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useLanguage } from '../hooks/useTranslation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { exportFilteredData, filterSubmissions, getUniqueValues, ExportFilters } from '../services/dataExportService';

const DataAnalysisPanel: React.FC = () => {
    const { activeProject, updateAnalysisChatHistory, logicErrors, analysisChatHistory } = useProject();
    const { t } = useLanguage();
    const [isFormReportModalOpen, setIsFormReportModalOpen] = useState(false);
    const [isDataReportModalOpen, setIsDataReportModalOpen] = useState(false);
    const [formReport, setFormReport] = useState('');
    const [dataReport, setDataReport] = useState('');
    const [customQuery, setCustomQuery] = useState('');
    const [isQueryLoading, setIsQueryLoading] = useState(false);
    const [showDynamicReports, setShowDynamicReports] = useState(false);
    const [reportType, setReportType] = useState<'graphs' | 'maps' | 'tables'>('graphs');
    const [filters, setFilters] = useState<ExportFilters>({});

    const handleFormQualityReport = async () => {
        if (!activeProject) return;
        try {
            const report = await getAIFormQualityAudit(activeProject);
            setFormReport(report);
            setIsFormReportModalOpen(true);
        } catch (e) {
            console.error('Form quality audit failed:', e);
            setFormReport('Erreur lors de la génération du rapport. Vérifiez la clé API.');
            setIsFormReportModalOpen(true);
        }
    };

    const handleDataQualityReport = async () => {
        if (!activeProject || activeProject.submissions.length === 0) {
            setDataReport('Aucune soumission disponible pour l\'audit.');
            setIsDataReportModalOpen(true);
            return;
        }
        try {
            const report = await getAIDataQualityAudit(activeProject.submissions);
            setDataReport(report);
            setIsDataReportModalOpen(true);
        } catch (e) {
            console.error('Data quality audit failed:', e);
            setDataReport('Erreur lors de la génération du rapport. Vérifiez la clé API.');
            setIsDataReportModalOpen(true);
        }
    };

    const handleCustomAnalysis = async () => {
        if (!customQuery.trim() || !activeProject) return;
        setIsQueryLoading(true);
        try {
            const response = await getDataAnalysisInsight(customQuery, activeProject);
            const aiMessage: ChatMessage = {
                id: uuidv4(),
                sender: 'ai',
                text: response
            };
            const userMessage: ChatMessage = {
                id: uuidv4(),
                sender: 'user',
                text: customQuery
            };
            updateAnalysisChatHistory([userMessage, aiMessage]);
            setCustomQuery('');
        } catch (e) {
            console.error('Custom analysis failed:', e);
            const errorMessage: ChatMessage = {
                id: uuidv4(),
                sender: 'ai',
                text: 'Erreur lors de l\'analyse. Vérifiez la clé API.'
            };
            updateAnalysisChatHistory([errorMessage]);
        } finally {
            setIsQueryLoading(false);
        }
    };

    // Préparer données pour rapports dynamiques avec filtres
    const filteredSubmissions = useMemo(() => {
        if (!activeProject?.submissions.length) return [];
        return filterSubmissions(activeProject.submissions, filters);
    }, [activeProject?.submissions, filters]);

    const prepareChartData = () => {
        if (!filteredSubmissions.length) return [];
        const submissions = filteredSubmissions;
        const survey = activeProject!.formData.survey;

        // Graphique taux complétion par date
        const completionByDate = submissions.reduce((acc, sub) => {
            const date = new Date(sub.timestamp).toISOString().split('T')[0];
            const requiredFields = survey.filter(q => q.required).length;
            const filledFields = survey.filter(q => sub.data[q.name]).length;
            const rate = requiredFields > 0 ? (filledFields / requiredFields) * 100 : 0;
            const currentValue = acc[date] || 0;
            acc[date] = currentValue + rate;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(completionByDate).map(([date, totalRate]) => {
            const count = submissions.filter(s => new Date(s.timestamp).toISOString().split('T')[0] === date).length;
            return {
                date,
                tauxCompletion: count > 0 ? Math.round(totalRate / count) : 0
            };
        });
    };

    const prepareMapData = () => {
        if (!filteredSubmissions.length) return [];
        return filteredSubmissions
            .filter(sub => sub.meta?.gps)
            .map(sub => ({
                lat: sub.meta!.gps!.lat,
                lng: sub.meta!.gps!.lng,
                id: sub.id
            }));
    };

    const prepareTableData = () => {
        if (!filteredSubmissions.length) return [];
        return filteredSubmissions.slice(0, 50); // Limiter pour performance
    };

    // Données pour graphiques avancés
    const prepareHousingTypeData = () => {
        if (!filteredSubmissions.length) return [];
        const housingTypes = filteredSubmissions.reduce((acc, sub) => {
            const type = sub.data.type_logement || 'Non spécifié';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(housingTypes).map(([type, count]) => ({
            name: type,
            value: count
        }));
    };

    const prepareIncomeSourceData = () => {
        if (!filteredSubmissions.length) return [];
        const incomeSources = filteredSubmissions.reduce((acc, sub) => {
            const source = sub.data.source_revenu || 'Non spécifié';
            acc[source] = (acc[source] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(incomeSources).map(([source, count]) => ({
            name: source,
            value: count
        }));
    };

    const chartData = prepareChartData();
    const mapData = prepareMapData();
    const tableData = prepareTableData();
    const housingTypeData = prepareHousingTypeData();
    const incomeSourceData = prepareIncomeSourceData();

    // Valeurs uniques pour les filtres
    const uniqueRegions = useMemo(() => getUniqueValues(activeProject?.submissions || [], 'region'), [activeProject?.submissions]);
    const uniqueHousingTypes = useMemo(() => getUniqueValues(activeProject?.submissions || [], 'type_logement'), [activeProject?.submissions]);
    const uniqueIncomeSources = useMemo(() => getUniqueValues(activeProject?.submissions || [], 'source_revenu'), [activeProject?.submissions]);

    const handleExport = (format: 'xls' | 'csv' | 'json') => {
        if (!activeProject) return;
        const filename = `${activeProject.name}_export_${new Date().toISOString().split('T')[0]}`;
        exportFilteredData(activeProject.submissions, format, filename, filters);
    };

    return (
        <div className="flex flex-col h-full p-4 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <h3 className="text-sm font-semibold mb-2">Outils d'Analyse IA</h3>
                <div className="space-y-2">
                    <button
                        onClick={handleFormQualityReport}
                        className="w-full px-3 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
                        disabled={!activeProject}
                    >
                        Rapport Qualité Formulaire
                    </button>
                    <button
                        onClick={handleDataQualityReport}
                        className="w-full px-3 py-2 text-sm text-white bg-purple-600 rounded-md hover:bg-purple-700"
                        disabled={!activeProject || activeProject.submissions.length === 0}
                    >
                        Résumé Qualité Données ({activeProject?.submissions.length || 0} soumissions)
                    </button>
                    <button
                        onClick={() => setShowDynamicReports(!showDynamicReports)}
                        className="w-full px-3 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                        disabled={!activeProject || activeProject.submissions.length === 0}
                    >
                        Générer Rapports Dynamiques
                    </button>
                </div>
                {logicErrors.length > 0 && (
                    <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-sm">
                        {logicErrors.length} erreur(s) logique détectée(s)
                    </div>
                )}
            </div>

            {showDynamicReports && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                    <h3 className="text-sm font-semibold mb-2">Rapports Dynamiques</h3>

                    {/* Filtres */}
                    <div className="mb-4 space-y-2">
                        <div className="flex gap-2">
                            <select
                                value={filters.region || ''}
                                onChange={(e) => setFilters({ ...filters, region: e.target.value || undefined })}
                                className="px-2 py-1 text-sm border rounded"
                            >
                                <option value="">Toutes les régions</option>
                                {uniqueRegions.map(region => (
                                    <option key={region} value={region}>{region}</option>
                                ))}
                            </select>
                            <select
                                value={filters.housingType || ''}
                                onChange={(e) => setFilters({ ...filters, housingType: e.target.value || undefined })}
                                className="px-2 py-1 text-sm border rounded"
                            >
                                <option value="">Tous types de logement</option>
                                {uniqueHousingTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            <select
                                value={filters.incomeSource || ''}
                                onChange={(e) => setFilters({ ...filters, incomeSource: e.target.value || undefined })}
                                className="px-2 py-1 text-sm border rounded"
                            >
                                <option value="">Toutes sources de revenu</option>
                                {uniqueIncomeSources.map(source => (
                                    <option key={source} value={source}>{source}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleExport('xls')} className="px-3 py-1 text-sm bg-green-600 text-white rounded">Export XLS</button>
                            <button onClick={() => handleExport('csv')} className="px-3 py-1 text-sm bg-blue-600 text-white rounded">Export CSV</button>
                            <button onClick={() => handleExport('json')} className="px-3 py-1 text-sm bg-purple-600 text-white rounded">Export JSON</button>
                        </div>
                    </div>

                    <div className="flex space-x-2 mb-4">
                        <button onClick={() => setReportType('graphs')} className={`px-3 py-1 text-sm rounded ${reportType === 'graphs' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Graphiques</button>
                        <button onClick={() => setReportType('maps')} className={`px-3 py-1 text-sm rounded ${reportType === 'maps' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Cartes</button>
                        <button onClick={() => setReportType('tables')} className={`px-3 py-1 text-sm rounded ${reportType === 'tables' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Tableaux</button>
                    </div>
                    <div className="h-64">
                        {reportType === 'graphs' && (
                            <div className="space-y-4">
                                {chartData.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">Taux de Complétion par Date</h4>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <LineChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line type="monotone" dataKey="tauxCompletion" stroke="#8884d8" name="Taux Complétion (%)" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                                {housingTypeData.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">Répartition par Type de Logement</h4>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <PieChart>
                                                <Pie data={housingTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                                    {housingTypeData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                                {incomeSourceData.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">Répartition par Source de Revenu</h4>
                                        <ResponsiveContainer width="100%" height={200}>
                                            <BarChart data={incomeSourceData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Bar dataKey="value" fill="#82ca9d" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        )}
                        {reportType === 'maps' && mapData.length > 0 && (
                            <MapContainer center={[14.4974, -14.4524]} zoom={6} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                {mapData.map((point, idx) => (
                                    <Marker key={idx} position={[point.lat, point.lng]}>
                                        <Popup>Soumission {point.id}</Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        )}
                        {reportType === 'tables' && tableData.length > 0 && (
                            <div className="overflow-y-auto max-h-full">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Région</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type Logement</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source Revenu</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {tableData.map((sub, idx) => (
                                            <tr key={idx}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sub.id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sub.timestamp).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.data.region || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.data.type_logement || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.data.source_revenu || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow overflow-y-auto">
                <h3 className="text-sm font-semibold mb-2">Historique Analyse</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {analysisChatHistory.map((msg) => (
                        <div key={msg.id} className={`p-2 rounded ${msg.sender === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-100'}`}>
                            <strong>{msg.sender === 'user' ? 'Vous' : 'IA'}:</strong> {msg.text}
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <h3 className="text-sm font-semibold mb-2">Analyse Personnalisée</h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={customQuery}
                        onChange={(e) => setCustomQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCustomAnalysis()}
                        placeholder="Ex: Quelles sont les tendances dans les données de région ?"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                        disabled={isQueryLoading}
                    />
                    <button
                        onClick={handleCustomAnalysis}
                        disabled={isQueryLoading || !customQuery.trim()}
                        className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isQueryLoading ? '...' : 'Analyser'}
                    </button>
                </div>
            </div>

            {/* Modals for Reports */}
            {isFormReportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-semibold">Rapport Qualité Formulaire</h2>
                            <button onClick={() => setIsFormReportModalOpen(false)} className="float-right text-gray-500 hover:text-gray-700">×</button>
                        </div>
                        <div className="p-4 prose dark:prose-invert max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: formReport.replace(/\n/g, '<br>') }} />
                        </div>
                    </div>
                </div>
            )}

            {isDataReportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="p-4 border-b">
                            <h2 className="text-lg font-semibold">Résumé Qualité Données</h2>
                            <button onClick={() => setIsDataReportModalOpen(false)} className="float-right text-gray-500 hover:text-gray-700">×</button>
                        </div>
                        <div className="p-4 prose dark:prose-invert max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: dataReport.replace(/\n/g, '<br>') }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataAnalysisPanel;
