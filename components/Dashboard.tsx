
import React, { useMemo } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';
import { getAIDataQualityAudit } from '../services/geminiService';
import { useLanguage } from '../hooks/useTranslation';
import { getLocalizedText } from '../utils/localizationUtils';

// --- Composants Graphiques SVG Légers (Souverains) ---

const PieChart: React.FC<{ data: { label: string, value: number, color: string }[] }> = ({ data }) => {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    let cumulativePercent = 0;

    const getCoordinatesForPercent = (percent: number) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    if (total === 0) return <div className="h-32 w-32 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">No Data</div>;

    return (
        <div className="flex items-center gap-4">
            <div className="relative h-32 w-32">
                <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }} className="overflow-visible">
                    {data.map((slice, i) => {
                        const start = cumulativePercent;
                        const slicePercent = slice.value / total;
                        cumulativePercent += slicePercent;
                        const end = cumulativePercent;

                        // Si un seul slice à 100%
                        if (slicePercent === 1) {
                            return <circle key={i} cx="0" cy="0" r="1" fill={slice.color} />;
                        }

                        const [startX, startY] = getCoordinatesForPercent(start);
                        const [endX, endY] = getCoordinatesForPercent(end);
                        const largeArcFlag = slicePercent > 0.5 ? 1 : 0;

                        const pathData = [
                            `M 0 0`,
                            `L ${startX} ${startY}`,
                            `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
                            `Z`
                        ].join(' ');

                        return <path key={i} d={pathData} fill={slice.color} className="hover:opacity-90 transition-opacity" />;
                    })}
                </svg>
            </div>
            <div className="space-y-1">
                {data.map((slice, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }}></span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{slice.label}</span>
                        <span className="text-gray-500">({Math.round((slice.value / total) * 100)}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BarChart: React.FC<{ data: { label: string, value: number }[], color: string }> = ({ data, color }) => {
    const max = Math.max(...data.map(d => d.value));
    return (
        <div className="space-y-2 w-full">
            {data.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-24 truncate text-right text-gray-600 dark:text-gray-400" title={d.label}>{d.label}</div>
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ width: `${(d.value / max) * 100}%`, backgroundColor: color }}
                        ></div>
                    </div>
                    <div className="w-8 font-bold text-gray-700 dark:text-gray-300">{d.value}</div>
                </div>
            ))}
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { activeProject } = useProject();
    const { addNotification } = useNotification();
    const { t } = useLanguage();
    const [isAuditing, setIsAuditing] = React.useState(false);
    const [auditResult, setAuditResult] = React.useState<string | null>(null);
    
    const stats = useMemo(() => {
        if (!activeProject) return null;
        const { submissions, formData } = activeProject;
        const defaultLang = formData.settings.default_language || 'default';

        // 1. Indicateurs Clés
        const total = submissions.length;
        const drafts = submissions.filter(s => s.status === 'draft').length;
        const synced = submissions.filter(s => s.status === 'synced').length;
        
        // Temps moyen (simulation grossière basée sur timestamps si dispo, sinon placeholder)
        // Dans un vrai cas, on calculerait start vs end time.
        
        // 2. Analyse Automatique des Questions (Categorical)
        const chartsData: { id: string, title: string, type: 'pie' | 'bar', data: any[] }[] = [];
        
        // Trouver les questions select_one intéressantes (max 4)
        const categoricalQuestions = formData.survey
            .filter(q => q.type === 'select_one')
            .slice(0, 4);

        categoricalQuestions.forEach(q => {
            const counts: Record<string, number> = {};
            submissions.forEach(s => {
                const val = s.data[q.name];
                if (val) counts[val] = (counts[val] || 0) + 1;
            });

            const chartData = Object.entries(counts).map(([key, count], index) => {
                const choiceLabel = q.choices?.find(c => c.name === key)?.label;
                const label = getLocalizedText(choiceLabel, defaultLang) || key;
                // Palette de couleurs générée
                const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
                return {
                    label,
                    value: count,
                    color: colors[index % colors.length]
                };
            }).sort((a, b) => b.value - a.value); // Tri décroissant

            if (chartData.length > 0) {
                chartsData.push({
                    id: q.uid,
                    title: getLocalizedText(q.label, defaultLang),
                    type: chartData.length > 4 ? 'bar' : 'pie', // Barres si beaucoup de choix, Pie si peu
                    data: chartData
                });
            }
        });

        return { total, drafts, synced, chartsData };
    }, [activeProject]);

    if (!activeProject) return null;

    const handleRunAudit = async () => {
        setIsAuditing(true);
        setAuditResult(null);
        try {
            const result = await getAIDataQualityAudit(activeProject.submissions);
            setAuditResult(result);
        } catch (error: any) {
            addNotification(`Erreur d'audit IA: ${error.message}`, 'error');
        } finally {
            setIsAuditing(false);
        }
    };

    if (activeProject.submissions.length === 0) {
        return (
            <div className="p-12 flex flex-col items-center justify-center text-gray-500 h-full">
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <h3 className="text-lg font-medium mb-2">{t('dashboard_noData')}</h3>
                <p className="text-sm max-w-xs text-center">Commencez la collecte ou utilisez le mode simulation pour voir les graphiques apparaître.</p>
            </div>
        );
    }
    
    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            
            {/* --- KPIs Cards --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between relative overflow-hidden group">
                    <div className="absolute right-0 top-0 h-full w-2 bg-blue-500"></div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Données</p>
                        <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{stats?.total}</p>
                        <p className="text-[10px] text-gray-400 mt-1">Depuis le début du projet</p>
                    </div>
                    <div className="text-blue-500 bg-blue-50 p-3 rounded-lg text-2xl">📊</div>
                </div>

                <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-2 bg-green-500"></div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Synchronisés</p>
                        <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{stats?.synced}</p>
                        <p className="text-[10px] text-green-600 mt-1">Sécurisés sur serveur</p>
                    </div>
                    <div className="text-green-500 bg-green-50 p-3 rounded-lg text-2xl">☁️</div>
                </div>

                <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-2 bg-orange-400"></div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">En Attente</p>
                        <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{stats?.drafts}</p>
                        <p className="text-[10px] text-orange-500 mt-1">Sur les appareils</p>
                    </div>
                    <div className="text-orange-500 bg-orange-50 p-3 rounded-lg text-2xl">📱</div>
                </div>
            </div>

            {/* --- Automatic Charts Grid --- */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <span>📈</span> Analyse Automatique
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {stats?.chartsData.map((chart) => (
                        <div key={chart.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4 border-b dark:border-gray-700 pb-2 truncate" title={chart.title}>
                                {chart.title}
                            </h4>
                            <div className="flex justify-center">
                                {chart.type === 'pie' ? (
                                    <PieChart data={chart.data} />
                                ) : (
                                    <BarChart data={chart.data} color="#6366F1" />
                                )}
                            </div>
                        </div>
                    ))}
                    {stats?.chartsData.length === 0 && (
                        <div className="col-span-full p-6 text-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300">
                            <p className="text-sm text-gray-500">Ajoutez des questions à choix unique (select_one) pour voir des graphiques automatiques ici.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- AI Audit Section --- */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 p-6 rounded-xl shadow-sm border border-indigo-100 dark:border-gray-700">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white dark:bg-gray-700 rounded-full shadow-sm text-2xl">🤖</div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-indigo-900 dark:text-white">{t('dashboard_qualityAudit')}</h3>
                        <p className="text-sm text-indigo-700 dark:text-gray-400 mt-1 mb-4">{t('dashboard_qualityAuditDescription')}</p>
                        
                        <button onClick={handleRunAudit} disabled={isAuditing} className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-all disabled:opacity-50 flex items-center gap-2">
                            {isAuditing ? (
                                <><span className="animate-spin">⏳</span> {t('dashboard_auditing')}</>
                            ) : (
                                <>{t('dashboard_runAudit')}</>
                            )}
                        </button>

                        {auditResult && (
                            <div className="mt-6 p-5 bg-white dark:bg-gray-900 rounded-xl shadow-inner border border-indigo-100 dark:border-gray-700 animate-fadeIn">
                                <div className="prose prose-sm dark:prose-invert max-w-full" dangerouslySetInnerHTML={{ __html: auditResult.replace(/\n/g, '<br />') }} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
