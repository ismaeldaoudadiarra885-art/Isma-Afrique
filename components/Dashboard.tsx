
import React, { useState, useMemo } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';
import { getAIDataQualityAudit } from '../services/geminiService';
import { useLanguage } from '../hooks/useTranslation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { getSubmissionTrends, getFrequencyCounts, addCodedData } from '../utils/dataCodingUtils';
import { getLocalizedText } from '../utils/localizationUtils';

const Dashboard: React.FC = () => {
    const { activeProject } = useProject();
    const { addNotification } = useNotification();
    const { t } = useLanguage();
    const [isAuditing, setIsAuditing] = useState(false);
    const [auditResult, setAuditResult] = useState<string | null>(null);
    const [selectedQuestion, setSelectedQuestion] = useState<string>('');

    if (!activeProject) return null;

    const { submissions, formData } = activeProject;
    const { survey, settings } = formData;
    const defaultLang = settings.default_language || 'default';

    // Prepare coded submissions for analysis
    const codedSubmissions = useMemo(() => addCodedData(submissions, survey), [submissions, survey]);

    // Get submission trends
    const submissionTrends = useMemo(() => getSubmissionTrends(submissions), [submissions]);

    // Get choice questions for visualization
    const choiceQuestions = useMemo(() =>
        survey.filter(q => q.choices && q.choices.length > 0 && !['note', 'begin_group', 'end_group', 'calculate'].includes(q.type)),
        [survey]
    );

    // Get frequency data for selected question
    const frequencyData = useMemo(() => {
        if (!selectedQuestion) return [];
        const counts = getFrequencyCounts(codedSubmissions, selectedQuestion);
        const question = survey.find(q => q.name === selectedQuestion);
        if (!question) return [];

        return Object.entries(counts).map(([key, count]) => {
            const choice = question.choices?.find(c => question.choices!.indexOf(c) + 1 === parseInt(key));
            return {
                name: choice ? getLocalizedText(choice.label, defaultLang) : key,
                value: count,
                code: key
            };
        });
    }, [selectedQuestion, codedSubmissions, survey, defaultLang]);

    // Colors for pie chart
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

    const handleRunAudit = async () => {
        setIsAuditing(true);
        setAuditResult(null);
        try {
            const result = await getAIDataQualityAudit(submissions);
            setAuditResult(result);
        } catch (error: any) {
            addNotification(`Erreur d'audit IA: ${error.message}`, 'error');
        } finally {
            setIsAuditing(false);
        }
    };

    if (submissions.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                {t('dashboard_noData')}
            </div>
        );
    }
    
    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h4 className="text-sm font-semibold text-gray-500">Soumissions Totales</h4>
                    <p className="text-3xl font-bold">{submissions.length}</p>
                </div>
                {/* Other stats can be added here */}
            </div>

            {/* Submission Trends Chart */}
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Tendances des Soumissions</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={submissionTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Choice Frequency Visualization */}
            {choiceQuestions.length > 0 && (
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Analyse des Réponses</h3>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Sélectionner une question:
                        </label>
                        <select
                            value={selectedQuestion}
                            onChange={(e) => setSelectedQuestion(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value="">Choisir une question...</option>
                            {choiceQuestions.map(q => (
                                <option key={q.name} value={q.name}>
                                    {getLocalizedText(q.label, defaultLang) || q.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedQuestion && frequencyData.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-md font-semibold mb-2">Répartition (Secteurs)</h4>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={frequencyData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {frequencyData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div>
                                <h4 className="text-md font-semibold mb-2">Fréquences (Barres)</h4>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={frequencyData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <h3 className="text-lg font-semibold">{t('dashboard_qualityAudit')}</h3>
                <p className="text-sm text-gray-500 mt-1 mb-4">{t('dashboard_qualityAuditDescription')}</p>
                <button onClick={handleRunAudit} disabled={isAuditing} className="px-4 py-2 text-sm font-medium text-white bg-green-tamani rounded-md disabled:opacity-50">
                    {isAuditing ? t('dashboard_auditing') : t('dashboard_runAudit')}
                </button>
                {auditResult && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="prose prose-sm dark:prose-invert max-w-full" dangerouslySetInnerHTML={{ __html: auditResult.replace(/\n/g, '<br />') }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;