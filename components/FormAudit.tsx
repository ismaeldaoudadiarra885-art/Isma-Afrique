import React, { useMemo, useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { evaluateRelevant } from '../utils/formLogic';
import { detectCircularDependencies, findUndefinedVariables } from '../services/formValidationService';
import { LogicError, LocalizedText } from '../types';
import LogicInspector from './LogicInspector';
import { getAIFormQualityAudit } from '../services/geminiService';
import { useNotification } from '../contexts/NotificationContext';
// FIX: Added missing import for getLocalizedText to resolve reference errors.
import { getLocalizedText } from '../utils/localizationUtils';

const FormAudit: React.FC = () => {
    const { activeProject, formValues, currentQuestionName, setCurrentQuestionName } = useProject();
    const { addNotification } = useNotification();
    const [activeTab, setActiveTab] = useState('problems');
    const [isAiAuditing, setIsAiAuditing] = useState(false);
    const [aiAuditResult, setAiAuditResult] = useState<string | null>(null);

    const runAiAudit = async () => {
        if (!activeProject) return;
        setIsAiAuditing(true);
        try {
            const result = await getAIFormQualityAudit(activeProject);
            setAiAuditResult(result);
        } catch (error) {
            console.error('Erreur lors de l\'audit IA:', error);
            setAiAuditResult('Erreur lors de l\'audit IA. Vérifiez votre connexion internet.');
        } finally {
            setIsAiAuditing(false);
        }
    };

    const currentQuestion = activeProject?.formData.survey.find(q => q.name === currentQuestionName);

    const errors: LogicError[] = useMemo(() => {
        if (!activeProject) return [];
        const foundErrors: LogicError[] = [];
        const { survey, settings } = activeProject.formData;
        const defaultLang = settings.default_language || 'fr';

        // 1. Syntax errors
        for (const q of survey) {
            if (q.relevant) {
                const { error } = evaluateRelevant(q.relevant, formValues);
                if (error) {
                    foundErrors.push({
                        questionName: q.name,
                        questionLabel: (getLocalizedText(q.label, defaultLang) || q.name),
                        logicType: 'relevant',
                        expression: q.relevant,
                        error
                    });
                }
            }
        }

        // 2. Undefined variables
        const undefinedVars = findUndefinedVariables(survey);
        undefinedVars.forEach(err => {
            const q = survey.find(q => q.name === err.questionName);
            foundErrors.push({
                questionName: err.questionName,
                questionLabel: (getLocalizedText(q?.label, defaultLang) || err.questionName),
                logicType: 'undefined_variable',
                expression: err.logic,
                error: `La variable '${err.undefinedVar}' est utilisée mais n'existe pas.`
            });
        });

        // 3. Circular dependencies
        const circularDeps = detectCircularDependencies(survey);
        if (circularDeps.length > 0) {
            const cycleString = circularDeps.join(' -> ');
            circularDeps.forEach(qName => {
                 const q = survey.find(q => q.name === qName);
                 foundErrors.push({
                    questionName: qName,
                    questionLabel: (getLocalizedText(q?.label, defaultLang) || qName),
                    logicType: 'circular_dependency',
                    error: `Dépendance circulaire détectée: ${cycleString}`
                 });
            });
        }
        
        const uniqueErrors = foundErrors.filter((v,i,a)=>a.findIndex(t=>(t.questionName === v.questionName && t.error === v.error))===i);
        return uniqueErrors;

    }, [activeProject, formValues]);
    
    const handleRunAiAudit = async () => {
        if (!activeProject) return;
        setIsAiAuditing(true);
        setAiAuditResult(null);
        addNotification("L'audit qualitatif par l'IA a commencé...", 'info');
        try {
            const result = await getAIFormQualityAudit(activeProject);
            setAiAuditResult(result);
            addNotification("Audit IA terminé !", 'success');
        } catch(e: any) {
            addNotification(`Erreur durant l'audit IA: ${e.message}`, 'error');
        } finally {
            setIsAiAuditing(false);
        }
    }

    const TabButton: React.FC<{tabId: string, children: React.ReactNode}> = ({ tabId, children }) => (
      <button 
        onClick={() => setActiveTab(tabId)}
        className={`px-3 py-1.5 text-xs rounded-md transition-colors ${activeTab === tabId ? 'bg-gray-200 dark:bg-gray-700' : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-900'}`}
      >
        {children}
      </button>
    );

    return (
        <div className="flex flex-col h-full">
            <div className="p-2 border-b dark:border-gray-700 space-y-2">
                 <div className="flex items-center border-b dark:border-gray-700 px-2 flex-shrink-0 space-x-1">
                    <TabButton tabId="problems">
                        Problèmes Logiques <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${errors.length > 0 ? 'bg-red-earth text-white' : 'bg-gray-300 dark:bg-gray-600'}`}>{errors.length}</span>
                    </TabButton>
                    <TabButton tabId="inspector">Inspecteur</TabButton>
                </div>
                 <div>
                    <button
                        id="btnAiAudit"
                        onClick={handleRunAiAudit}
                        disabled={isAiAuditing}
                        className="w-full text-xs px-3 py-1.5 bg-indigo-deep text-white rounded-md disabled:opacity-50"
                        aria-label="Lancer l'audit qualitatif par intelligence artificielle"
                    >
                      {isAiAuditing ? 'Analyse en cours...' : 'Lancer l\'Audit Qualitatif IA'}
                    </button>
                </div>
            </div>
           
            <div className="flex-1 overflow-y-auto p-2">
                {activeTab === 'problems' && (
                    errors.length > 0 ? (
                        <div className="space-y-2">
                            {errors.map((err, index) => (
                                <button key={index} onClick={() => setCurrentQuestionName(err.questionName)} className="w-full text-left p-3 bg-red-earth/10 dark:bg-red-earth/20 rounded-lg hover:bg-red-earth/20 dark:hover:bg-red-earth/30 transition-colors">
                                    <p className="text-sm font-bold text-red-earth dark:text-red-earth/90">
                                        Erreur sur "{err.questionLabel}"
                                    </p>
                                    {err.expression && (
                                        <p className="mt-1 font-mono text-xs text-red-earth/90 dark:text-red-earth/80 bg-red-earth/10 p-2 rounded">
                                            {err.expression}
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs text-red-earth dark:text-red-earth/90">
                                        Détail : {err.error}
                                    </p>
                                </button>
                            ))}
                        </div>
                    ) : (
                         <div className="p-4 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-green-tamani" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Aucune erreur de logique détectée. Bravo !</p>
                        </div>
                    )
                )}
                {activeTab === 'inspector' && (
                    !currentQuestion ? (
                        <div className="text-xs text-gray-500 p-4 text-center">Sélectionnez une question pour inspecter sa logique.</div>
                    ) : !currentQuestion.relevant ? (
                        <div className="text-xs text-gray-500 p-4 text-center">Aucune logique de pertinence pour la question sélectionnée.</div>
                    ) : (
                        <LogicInspector expression={currentQuestion.relevant} values={formValues} />
                    )
                )}
                <div className="mt-4">
                    <button
                        onClick={runAiAudit}
                        disabled={isAiAuditing}
                        className="w-full px-3 py-2 text-sm font-medium bg-blue-light-ai text-white rounded-md hover:bg-blue-light-ai/90 disabled:opacity-50"
                    >
                        {isAiAuditing ? 'Audit en cours...' : 'Lancer l\'audit qualitatif IA'}
                    </button>
                </div>
                {aiAuditResult && (
                     <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <h4 className="text-sm font-semibold mb-2">Résultat de l'Audit Qualitatif IA</h4>
                        <div className="prose prose-sm dark:prose-invert max-w-full" dangerouslySetInnerHTML={{ __html: aiAuditResult.replace(/\n/g, '<br />') }}/>
                     </div>
                )}
            </div>
        </div>
    );
};

export default FormAudit;