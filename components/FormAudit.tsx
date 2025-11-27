
import React, { useMemo, useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { evaluateRelevant } from '../utils/formLogic';
import { detectCircularDependencies, findUndefinedVariables } from '../services/formValidationService';
import { LogicError, LocalizedText } from '../types';
import LogicInspector from './LogicInspector';
import { getAIFormQualityAudit, getAssistance } from '../services/geminiService';
import { handleFunctionCalls } from '../utils/formActionHandler';
import { useNotification } from '../contexts/NotificationContext';
import { getLocalizedText } from '../utils/localizationUtils';

const FormAudit: React.FC = () => {
    const projectContext = useProject();
    const { activeProject, formValues, currentQuestionName, setCurrentQuestionName } = projectContext;
    const { addNotification } = useNotification();
    const [activeTab, setActiveTab] = useState('problems');
    const [isAiAuditing, setIsAiAuditing] = useState(false);
    const [aiAuditResult, setAiAuditResult] = useState<string | null>(null);
    
    // État pour suivre quelle erreur est en cours de correction
    const [fixingErrorIndex, setFixingErrorIndex] = useState<number | null>(null);

    const currentQuestion = activeProject?.formData.survey.find(q => q.name === currentQuestionName);

    const errors: (LogicError & { solution?: string })[] = useMemo(() => {
        if (!activeProject) return [];
        const foundErrors: (LogicError & { solution?: string })[] = [];
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
                        error,
                        solution: "Vérifiez la syntaxe de la formule. Utilisez ${variable} pour référencer une question et 'valeur' pour du texte."
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
                error: `La variable '${err.undefinedVar}' est utilisée mais n'existe pas.`,
                solution: `Créez une question avec le nom '${err.undefinedVar}' ou corrigez l'orthographe dans la formule.`
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
                    error: `Dépendance circulaire détectée: ${cycleString}`,
                    solution: "Une question ne peut pas dépendre d'elle-même, directement ou indirectement. Brisez la boucle."
                 });
            });
        }
        
        // 4. Libellés manquants (Qualité)
        survey.forEach(q => {
            if (!getLocalizedText(q.label, defaultLang) && !['begin_group', 'end_group', 'note', 'calculate'].includes(q.type)) {
                foundErrors.push({
                    questionName: q.name,
                    questionLabel: q.name,
                    logicType: 'relevant', // Using relevant type as placeholder for general error
                    error: "Libellé manquant",
                    solution: "Ajoutez un texte pour la question dans l'onglet 'Général'."
                });
            }
        });
        
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

    const handleFixError = async (error: LogicError & { solution?: string }, index: number) => {
        if (!activeProject) return;
        setFixingErrorIndex(index);
        addNotification("L'Agent Technique analyse l'erreur...", "info");

        const prompt = `
            URGENT: Agis en tant qu'Agent Technique Expert XLSForm.
            Une erreur critique a été détectée dans le formulaire.
            
            DÉTAILS DE L'ERREUR :
            - Question concernée : ${error.questionName} ("${error.questionLabel}")
            - Type d'erreur : ${error.logicType}
            - Message d'erreur : "${error.error}"
            - Expression problématique (si applicable) : "${error.expression || 'N/A'}"
            - Solution suggérée : "${error.solution || 'Trouve la meilleure solution technique.'}"

            TA TÂCHE :
            Utilise IMMÉDIATEMENT les outils disponibles (updateQuestion, addQuestion, etc.) pour corriger cette erreur concrètement.
            - Si c'est une variable manquante, crée-la ou corrige l'orthographe dans la logique.
            - Si c'est un libellé manquant, ajoute un libellé pertinent basé sur le nom de la variable.
            - Si c'est une erreur de syntaxe, corrige l'expression logique.
            
            Ne pose pas de questions. AGIS.
        `;

        try {
            // On utilise getAssistance pour générer les appels de fonction
            const response = await getAssistance(
                prompt, 
                activeProject.chatHistory, 
                ['agent_technique'], 
                activeProject, 
                undefined, 
                undefined
            );

            if (response.functionCalls && response.functionCalls.length > 0) {
                const confirmations = await handleFunctionCalls(
                    response.functionCalls, 
                    projectContext, 
                    activeProject, 
                    (p) => getAssistance(p, [], ['agent_technique'], activeProject) // Callback simplifié
                );
                confirmations.forEach(msg => addNotification(msg, 'success'));
            } else {
                addNotification("L'IA n'a pas trouvé de correction automatique évidente. Veuillez corriger manuellement.", "warning");
            }
        } catch (e: any) {
            console.error("Erreur de correction auto:", e);
            addNotification(`Échec de la correction automatique: ${e.message}`, "error");
        } finally {
            setFixingErrorIndex(null);
        }
    };

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
                        Problèmes <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${errors.length > 0 ? 'bg-red-earth text-white' : 'bg-gray-300 dark:bg-gray-600'}`}>{errors.length}</span>
                    </TabButton>
                    <TabButton tabId="inspector">Inspecteur</TabButton>
                </div>
                 <div>
                    <button onClick={handleRunAiAudit} disabled={isAiAuditing} className="w-full text-xs px-3 py-1.5 bg-indigo-deep text-white rounded-md disabled:opacity-50 font-bold shadow-sm">
                      {isAiAuditing ? '🤖 Analyse en cours...' : '✨ Lancer l\'Audit IA Complet'}
                    </button>
                </div>
            </div>
           
            <div className="flex-1 overflow-y-auto p-2">
                {activeTab === 'problems' && (
                    errors.length > 0 ? (
                        <div className="space-y-2">
                            {errors.map((err, index) => (
                                <div key={index} className="w-full text-left p-3 bg-red-50 border border-red-100 dark:bg-red-900/20 dark:border-red-800 rounded-lg shadow-sm group relative">
                                    <div className="flex justify-between items-start cursor-pointer" onClick={() => setCurrentQuestionName(err.questionName)}>
                                        <p className="text-sm font-bold text-red-700 dark:text-red-300">
                                            Question : "{err.questionLabel}"
                                        </p>
                                        <span className="text-[10px] bg-red-200 text-red-800 px-1.5 rounded">
                                            {err.questionName}
                                        </span>
                                    </div>
                                    
                                    <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
                                        ❌ {err.error}
                                    </p>
                                    
                                    {err.expression && (
                                        <p className="mt-1 font-mono text-[10px] text-gray-500 bg-white dark:bg-black/20 p-1 rounded border border-gray-200 dark:border-gray-700">
                                            {err.expression}
                                        </p>
                                    )}

                                    {err.solution && (
                                        <div className="mt-2 pt-2 border-t border-red-100 dark:border-red-800/50 flex gap-2 items-start">
                                            <span className="text-lg">💡</span>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-tight">
                                                {err.solution}
                                            </p>
                                        </div>
                                    )}

                                    {/* BOUTON DE CORRECTION AUTOMATIQUE */}
                                    <div className="mt-3 flex justify-end">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleFixError(err, index);
                                            }}
                                            disabled={fixingErrorIndex !== null}
                                            className={`
                                                flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-white shadow-sm transition-all
                                                ${fixingErrorIndex === index 
                                                    ? 'bg-gray-400 cursor-wait' 
                                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95'
                                                }
                                            `}
                                        >
                                            {fixingErrorIndex === index ? (
                                                <>
                                                    <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>
                                                    Correction...
                                                </>
                                            ) : (
                                                <>
                                                    <span>🪄</span> Corriger avec l'IA
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h4 className="text-gray-800 dark:text-white font-bold">Formulaire Valide</h4>
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Aucune erreur technique détectée. Lancez l'audit IA pour des conseils qualitatifs.</p>
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
                {aiAuditResult && (
                     <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                        <h4 className="text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
                            <span>🤖</span> Rapport IA
                        </h4>
                        <div className="prose prose-sm dark:prose-invert max-w-full text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: aiAuditResult.replace(/\n/g, '<br />') }}/>
                     </div>
                )}
            </div>
        </div>
    );
};

export default FormAudit;
