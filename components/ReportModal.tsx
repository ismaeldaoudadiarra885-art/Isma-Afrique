
import React, { useMemo } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { getLocalizedText } from '../utils/localizationUtils';
import { KoboQuestion } from '../types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Statistics {
  totalCount: number;
  selectOneStats: { [questionName: string]: { label: string, counts: { [choice: string]: number } } };
  numericStats: { [questionName: string]: { label: string, sum: number, avg: number, min: number, max: number } };
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose }) => {
  const { activeProject } = useProject();

  const statistics: Statistics | null = useMemo(() => {
    if (!activeProject) return null;
    const { submissions, formData } = activeProject;
    const defaultLang = formData.settings.default_language || 'default';

    // 1. Total Count
    const totalCount = submissions.length;

    // 2. Init Stats Containers
    const selectOneStats: { [questionName: string]: { label: string, counts: { [choice: string]: number } } } = {};
    const numericStats: { [questionName: string]: { label: string, sum: number, avg: number, min: number, max: number } } = {};

    const surveyMap = new Map<string, KoboQuestion>();
    formData.survey.forEach(q => surveyMap.set(q.name, q));

    submissions.forEach(sub => {
        Object.entries(sub.data).forEach(([key, value]) => {
            const question = surveyMap.get(key);
            if (!question) return;

            // Analyse Choice (select_one)
            if (question.type === 'select_one') {
                if (!selectOneStats[key]) {
                    selectOneStats[key] = {
                        label: getLocalizedText(question.label, defaultLang) || key,
                        counts: {}
                    };
                }
                const choiceVal = String(value);
                selectOneStats[key].counts[choiceVal] = (selectOneStats[key].counts[choiceVal] || 0) + 1;
            }

            // Analyse Numeric (integer, decimal)
            if ((question.type === 'integer' || question.type === 'decimal') && value !== '' && value !== null && !isNaN(Number(value))) {
                const numVal = Number(value);
                if (!numericStats[key]) {
                    numericStats[key] = {
                        label: getLocalizedText(question.label, defaultLang) || key,
                        sum: 0,
                        avg: 0,
                        min: numVal,
                        max: numVal
                    };
                }
                const stat = numericStats[key];
                stat.sum += numVal;
                stat.min = Math.min(stat.min, numVal);
                stat.max = Math.max(stat.max, numVal);
            }
        });
    });

    // Finalize Averages
    Object.keys(numericStats).forEach(key => {
        if(totalCount > 0) {
            // Note: Simplification, ideally should divide by count of non-null answers
            numericStats[key].avg = numericStats[key].sum / totalCount; 
        }
    });

    return { totalCount, selectOneStats, numericStats };

  }, [activeProject]);

  if (!isOpen || !activeProject) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div>
              <h2 className="text-xl font-semibold">Rapport de Projet</h2>
              <p className="text-sm text-gray-500">{activeProject.name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-gray-800">
            {statistics && statistics.totalCount === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">📭 Aucune donnée disponible</p>
                    <p className="text-sm">Effectuez des collectes ou des simulations pour générer un rapport.</p>
                </div>
            ) : statistics && (
                <div className="space-y-8">
                    {/* Header Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg text-center border border-indigo-100 dark:border-indigo-800">
                            <h3 className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">{statistics.totalCount}</h3>
                            <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Soumissions Totales</p>
                        </div>
                    </div>

                    {/* Numeric Stats */}
                    {Object.keys(statistics.numericStats).length > 0 && (
                        <div>
                            <h3 className="text-lg font-bold mb-4 border-b dark:border-gray-700 pb-2 flex items-center gap-2">
                                <span>🔢</span> Indicateurs Numériques
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {Object.values(statistics.numericStats).map((stat, idx) => (
                                    <div key={idx} className="border dark:border-gray-700 p-4 rounded-lg shadow-sm">
                                        <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3 text-sm">{stat.label}</h4>
                                        <div className="grid grid-cols-3 gap-2 text-sm text-center">
                                            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                                <div className="text-[10px] text-gray-500 uppercase">Moyenne</div>
                                                <div className="font-bold text-indigo-600 dark:text-indigo-400">{stat.avg.toFixed(1)}</div>
                                            </div>
                                            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                                <div className="text-[10px] text-gray-500 uppercase">Min</div>
                                                <div className="font-bold">{stat.min}</div>
                                            </div>
                                            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                                <div className="text-[10px] text-gray-500 uppercase">Max</div>
                                                <div className="font-bold">{stat.max}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Choice Stats */}
                    {Object.keys(statistics.selectOneStats).length > 0 && (
                         <div>
                            <h3 className="text-lg font-bold mb-4 border-b dark:border-gray-700 pb-2 flex items-center gap-2">
                                <span>📊</span> Fréquences (Choix Multiples)
                            </h3>
                            <div className="grid grid-cols-1 gap-6">
                                {Object.values(statistics.selectOneStats).map((stat, idx) => (
                                    <div key={idx} className="border dark:border-gray-700 p-4 rounded-lg">
                                        <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200 mb-3">{stat.label}</h4>
                                        <div className="space-y-2">
                                            {Object.entries(stat.counts)
                                                .sort(([,a], [,b]) => b - a) // Sort by count desc
                                                .map(([choice, count]) => {
                                                const percent = ((count / statistics.totalCount) * 100).toFixed(1);
                                                return (
                                                    <div key={choice} className="flex items-center text-xs">
                                                        <div className="w-32 truncate text-right pr-3 font-mono text-gray-500">{choice}</div>
                                                        <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded-r-md overflow-hidden flex items-center relative">
                                                            <div className="h-full bg-indigo-500" style={{width: `${percent}%`}}></div>
                                                            <span className="ml-2 absolute left-0 pl-1 text-xs font-semibold text-gray-700 dark:text-gray-300 mix-blend-difference">{percent}%</span>
                                                        </div>
                                                        <div className="w-12 text-right pl-2 font-bold text-gray-600">{count}</div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                         </div>
                    )}
                </div>
            )}
        </div>
        
        <div className="p-4 flex justify-end border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <button onClick={() => window.print()} className="mr-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white dark:border-gray-600">
                Imprimer le Rapport
            </button>
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-indigo-deep rounded-md hover:bg-indigo-deep-dark">
                Fermer
            </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
