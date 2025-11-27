
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { evaluateRelevant, sandboxedEval } from '../utils/formLogic';
import InteractiveQuestion from './InteractiveQuestion';
import DeviceFrame from './DeviceFrame';
import { useLanguage } from '../hooks/useTranslation';
import { KoboQuestion } from '../types';
import { getLocalizedText } from '../utils/localizationUtils';
import { useNotification } from '../contexts/NotificationContext';
import EnumeratorDashboard from './EnumeratorDashboard';
import { createHash } from '../utils/cryptoUtils';

interface FormPreviewProps {
  isCollecteOnly?: boolean;
}

// Helper to flatten the survey for linear navigation while keeping group context
interface FlatQuestion extends KoboQuestion {
    groupLabel?: string;
    groupId?: string; // Pour vérifier la pertinence du parent
    groupRelevant?: string; // La logique du groupe parent
    index: number;
}

const flattenSurvey = (survey: KoboQuestion[], defaultLang: string): FlatQuestion[] => {
    if (!Array.isArray(survey)) return [];
    
    const flat: FlatQuestion[] = [];
    let currentGroupLabel: string | undefined = undefined;
    let currentGroupId: string | undefined = undefined;
    let currentGroupRelevant: string | undefined = undefined;
    
    let indexCounter = 0;

    // Algorithme qui détecte les repeats et les regroupe en une seule question "parent"
    let i = 0;
    while (i < survey.length) {
        const q = survey[i];

        if (q.type === 'begin_repeat') {
            // C'est le début d'une boucle. On crée une "Super Question"
            const repeatQuestion: FlatQuestion = {
                ...q,
                children: [], // On va remplir ça avec les enfants
                groupLabel: currentGroupLabel,
                groupId: currentGroupId,
                groupRelevant: currentGroupRelevant,
                index: indexCounter++
            };
            
            i++; // On passe au suivant
            
            // On collecte tout jusqu'au end_repeat correspondant
            while (i < survey.length && survey[i].type !== 'end_repeat') {
                repeatQuestion.children?.push(survey[i]);
                i++;
            }
            
            flat.push(repeatQuestion);
        } else if (q.type === 'begin_group') {
            currentGroupLabel = getLocalizedText(q.label, defaultLang);
            currentGroupId = q.name;
            currentGroupRelevant = q.relevant;
            flat.push({ ...q, groupLabel: currentGroupLabel, groupId: currentGroupId, groupRelevant: currentGroupRelevant, index: indexCounter++ }); 
        } else if (q.type === 'end_group') {
            currentGroupLabel = undefined;
            currentGroupId = undefined;
            currentGroupRelevant = undefined;
        } else {
            flat.push({
                ...q,
                groupLabel: currentGroupLabel,
                groupId: currentGroupId,
                groupRelevant: currentGroupRelevant,
                index: indexCounter++
            });
        }
        i++;
    }
    
    return flat;
};

const FormPreview: React.FC<FormPreviewProps> = ({ isCollecteOnly = false }) => {
    const { activeProject, formValues, updateFormValue, setFormValues, activeSubmissionId, updateSubmission, setActiveSubmissionId, currentUserName, currentUserCode, currentQuestionName } = useProject();
    const { t } = useLanguage();
    const { addNotification } = useNotification();
    
    // --- 1. DECLARE ALL HOOKS ALWAYS ---
    
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [direction, setDirection] = useState<'forward' | 'back'>('forward');
    const [isAnimating, setIsAnimating] = useState(false);
    const [activeLang, setActiveLang] = useState('default'); 
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setCurrentStepIndex(0);
        setValidationErrors([]);
    }, [activeSubmissionId]);

    const survey = activeProject?.formData?.survey || [];
    const settings = activeProject?.formData?.settings;
    const defaultLang = settings?.default_language || 'default';
    const availableLangs = useMemo(() => {
        const langs = settings?.languages || [];
        return [defaultLang, ...langs.filter(l => l !== defaultLang)];
    }, [settings]);

    useEffect(() => {
        if (defaultLang) setActiveLang(defaultLang);
    }, [defaultLang]);

    const flatQuestions = useMemo(() => flattenSurvey(survey, activeLang), [survey, activeLang]);

    // --- SYNC WITH SIDEBAR SELECTION (DESIGNER MODE) ---
    useEffect(() => {
        if (!isCollecteOnly && currentQuestionName && activeProject) {
            const index = flatQuestions.findIndex(q => q.name === currentQuestionName);
            if (index !== -1 && index !== currentStepIndex) {
                // Jump to question directly
                setDirection(index > currentStepIndex ? 'forward' : 'back');
                setCurrentStepIndex(index);
            }
        }
    }, [currentQuestionName, isCollecteOnly, flatQuestions]);


    const currentQuestion = flatQuestions[currentStepIndex];
    
    const currentSubmission = activeProject?.submissions.find(s => s.id === activeSubmissionId);
    const isReadOnly = currentSubmission?.status === 'finalized' || currentSubmission?.status === 'synced';

    const checkRelevance = (q: FlatQuestion, values: any) => {
        // 1. Vérifier la pertinence de la question elle-même
        const selfRelevant = evaluateRelevant(q.relevant, values).result;
        if (!selfRelevant) return false;

        // 2. Vérifier la pertinence du groupe parent (si existant)
        if (q.groupRelevant) {
            const groupRelevant = evaluateRelevant(q.groupRelevant, values).result;
            if (!groupRelevant) return false;
        }
        
        return true;
    };

    const isCurrentRelevant = useMemo(() => {
        if (!currentQuestion) return true;
        return checkRelevance(currentQuestion, formValues);
    }, [currentQuestion, formValues]);

    // --- MOTEUR DE CALCUL ROBUSTE (CASCADING ENGINE) ---
    // Détecte les calculs et résout les dépendances en plusieurs passes si nécessaire
    useEffect(() => {
        if (!activeProject || isReadOnly) return;

        const calculateQuestions = flatQuestions.filter(q => q.type === 'calculate');
        if (calculateQuestions.length === 0) return;

        let hasUpdates = false;
        const newValues = { ...formValues };
        
        // On effectue plusieurs passes pour résoudre les dépendances (max 3 pour éviter boucles)
        for (let pass = 0; pass < 3; pass++) {
            let passHasUpdates = false;
            calculateQuestions.forEach(q => {
                if (q.calculation) {
                    if (checkRelevance(q, newValues)) {
                        const { result, error } = sandboxedEval(q.calculation, newValues);
                        if (!error && result !== newValues[q.name]) {
                            newValues[q.name] = result;
                            passHasUpdates = true;
                            hasUpdates = true;
                        }
                    } else {
                        // Si non pertinent, reset à null/vide
                        if (newValues[q.name] !== null && newValues[q.name] !== '') {
                            newValues[q.name] = '';
                            passHasUpdates = true;
                            hasUpdates = true;
                        }
                    }
                }
            });
            if (!passHasUpdates) break; // Si rien n'a changé, on arrête
        }

        if (hasUpdates) {
            setFormValues(newValues);
        }
    }, [formValues, flatQuestions, activeProject, isReadOnly, setFormValues]);


    // Helper functions
    const handleNext = () => {
        if (currentStepIndex >= flatQuestions.length) return;

        setDirection('forward');
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentStepIndex(prev => prev + 1);
            setIsAnimating(false);
        }, 150);
    };

    const handlePrev = () => {
        if (currentStepIndex <= 0) return;

        let prevIndex = currentStepIndex - 1;
        // Find previous relevant index manually
        while (prevIndex >= 0) {
            const q = flatQuestions[prevIndex];
            if (checkRelevance(q, formValues)) {
                break;
            }
            prevIndex--;
        }

        setDirection('back');
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentStepIndex(prevIndex);
            setIsAnimating(false);
        }, 150);
    };

    const handleSaveAndExit = () => {
        if (!activeProject) {
            setActiveSubmissionId(null);
            return;
        }
        
        if (activeSubmissionId) {
            const submission = activeProject.submissions.find(s => s.id === activeSubmissionId);
            if (submission && submission.status !== 'finalized' && submission.status !== 'synced') {
                updateSubmission({ ...submission, status: 'modified' });
                addNotification("Brouillon sauvegardé.", "info");
            }
        }
        setActiveSubmissionId(null);
    };

    const validateEntireForm = (): { isValid: boolean, errors: string[], firstErrorIndex: number } => {
        const errors: string[] = [];
        let firstErrorIndex = -1;

        flatQuestions.forEach((q, index) => {
            if (['begin_group', 'end_group', 'note', 'calculate'].includes(q.type)) return;

            // Utilisation de la fonction de pertinence robuste (question + groupe)
            const isRelevant = checkRelevance(q, formValues);
            if (!isRelevant) return;

            if (q.required) {
                const val = formValues[q.name];
                const isEmpty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
                
                if (isEmpty) {
                    const label = getLocalizedText(q.label, activeLang) || q.name;
                    errors.push(`Question requise manquante : "${label}"`);
                    if (firstErrorIndex === -1) firstErrorIndex = index;
                }
            }
        });

        return { isValid: errors.length === 0, errors, firstErrorIndex };
    };

    const handleFinalize = async () => {
        if (!activeSubmissionId || !activeProject) return;
        
        const validation = validateEntireForm();
        if (!validation.isValid) {
            setValidationErrors(validation.errors);
            addNotification(`Impossible de finaliser : ${validation.errors.length} erreur(s) détectée(s).`, "error");
            if (validation.firstErrorIndex !== -1) {
                setCurrentStepIndex(validation.firstErrorIndex);
            }
            return;
        }

        const submission = activeProject.submissions.find(s => s.id === activeSubmissionId);
        if (submission) {
            if (window.confirm("🔒 ATTENTION : Voulez-vous finaliser et SCELLER ce formulaire ?\n\nUne fois scellé :\n- Il ne sera PLUS MODIFIABLE.\n- Il sera prêt pour le transfert sécurisé.")) {
                
                const dataString = JSON.stringify(submission.data);
                const sealData = `${dataString}|${currentUserCode}|${new Date().toISOString()}`;
                const hash = await createHash(sealData);

                updateSubmission({ 
                    ...submission, 
                    status: 'finalized',
                    metadata: {
                        agentId: currentUserCode || 'unknown',
                        agentName: currentUserName || 'Agent',
                        agentCode: currentUserCode || 'UNK',
                        finalizedAt: new Date().toISOString(),
                        digitalSignature: hash
                    }
                });
                setActiveSubmissionId(null);
                addNotification("Formulaire SCELLÉ et signé par l'agent.", "success");
            }
        }
    };

    const handleAutoAdvance = () => {
        if (isReadOnly) return;
        setTimeout(() => {
            handleNext();
        }, 350);
    };

    const toggleLanguage = () => {
        const currentIndex = availableLangs.indexOf(activeLang);
        const nextIndex = (currentIndex + 1) % availableLangs.length;
        setActiveLang(availableLangs[nextIndex]);
    };

    // --- AUTO SKIP LOGIC ---
    useEffect(() => {
        const isFormActive = activeProject && (!isCollecteOnly || activeSubmissionId);
        
        if (isFormActive && currentQuestion && !isCurrentRelevant && currentStepIndex < flatQuestions.length) {
            const timer = setTimeout(() => {
                if (currentStepIndex < flatQuestions.length) {
                    setDirection('forward');
                    setIsAnimating(true);
                    setTimeout(() => {
                        setCurrentStepIndex(prev => prev + 1);
                        setIsAnimating(false);
                    }, 150);
                }
            }, 50); 
            return () => clearTimeout(timer);
        }
    }, [currentQuestion, isCurrentRelevant, currentStepIndex, flatQuestions.length, activeProject, isCollecteOnly, activeSubmissionId]);


    if (isCollecteOnly && !activeSubmissionId) {
        return <EnumeratorDashboard />;
    }

    if (!activeProject) {
        return <div className="p-4 text-center">{t('formPreview_noActiveProject')}</div>;
    }

    const progress = flatQuestions.length > 0 ? Math.min(100, Math.round(((currentStepIndex) / flatQuestions.length) * 100)) : 0;
    const isEndScreen = currentStepIndex >= flatQuestions.length;

    const content = (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 relative font-sans">
            
            {/* --- Mobile Header --- */}
            {isCollecteOnly && (
                <div className={`p-3 shadow-md flex justify-between items-center z-20 ${isReadOnly ? 'bg-gray-800' : 'bg-indigo-700'} text-white`}>
                    <button onClick={handleSaveAndExit} className="px-3 py-1.5 hover:bg-white/10 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors border border-white/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                        {isReadOnly ? 'Fermer' : 'Quitter'}
                    </button>
                    <div className="flex items-center gap-3">
                        {availableLangs.length > 1 && (
                            <button onClick={toggleLanguage} className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-bold uppercase tracking-wide border border-white/30 flex items-center gap-1">
                                <span>🌐</span> {activeLang}
                            </button>
                        )}
                        {isReadOnly && <span className="text-[10px] font-bold bg-red-500/80 px-1.5 rounded uppercase border border-red-400">Scellé</span>}
                    </div>
                </div>
            )}

            {/* --- Progress Header --- */}
            <div className="bg-white dark:bg-gray-800 px-4 py-3 shadow-sm z-10 flex items-center justify-between border-b dark:border-gray-700">
                {!isCollecteOnly && (
                    <button onClick={handlePrev} disabled={currentStepIndex === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-0 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                )}
                
                {!isCollecteOnly && availableLangs.length > 1 && (
                    <button onClick={toggleLanguage} className="mr-4 px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-xs font-bold uppercase flex items-center gap-1 transition-colors">
                        🌐 {activeLang}
                    </button>
                )}

                <div className="flex flex-col items-center w-full px-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {isEndScreen ? 'Finalisation' : `Question ${currentStepIndex + 1} / ${flatQuestions.length}`}
                    </span>
                    <div className="w-full h-1 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ease-out ${isReadOnly ? 'bg-gray-500' : 'bg-green-500'}`}
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
                {!isCollecteOnly && <div className="w-6"></div>}
            </div>

            {/* --- Question Area --- */}
            <div className="flex-1 relative overflow-y-auto overflow-x-hidden p-2 scrollbar-thin" ref={containerRef}>
                {!isEndScreen && currentQuestion ? (
                    <div 
                        key={currentQuestion.uid}
                        className={`min-h-full flex flex-col justify-center transition-all duration-300 ease-in-out transform ${
                            isAnimating 
                            ? (direction === 'forward' ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0') 
                            : 'translate-x-0 opacity-100'
                        }`}
                    >
                        {!isCurrentRelevant ? (
                            <div className="flex items-center justify-center h-full opacity-0">...</div>
                        ) : (
                            <div className="max-w-md mx-auto w-full py-4 px-2">
                                {currentQuestion.groupLabel && (
                                    <div className="mb-4 flex items-center gap-2 justify-center">
                                        <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 text-xs font-bold uppercase rounded-full tracking-wide border border-indigo-100 dark:border-indigo-800">
                                            {currentQuestion.groupLabel}
                                        </span>
                                    </div>
                                )}
                                <div className={isReadOnly ? 'pointer-events-none opacity-80 grayscale-[0.5]' : ''}>
                                    <InteractiveQuestion
                                        question={currentQuestion}
                                        value={formValues[currentQuestion.name]}
                                        onChange={isReadOnly ? () => {} : updateFormValue}
                                        onAutoAdvance={handleAutoAdvance}
                                        activeLang={activeLang}
                                        isWizardMode={true}
                                    />
                                </div>
                                {isReadOnly && (
                                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-center shadow-inner">
                                        <p className="text-sm font-bold text-red-800 uppercase tracking-wide mb-1">🔒 Document Scellé</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 animate-fadeIn">
                        {isReadOnly ? (
                            <>
                                <div className="w-24 h-24 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mb-6 text-5xl shadow-sm border-4 border-white">
                                    🔒
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Formulaire Verrouillé</h2>
                                <button 
                                    onClick={handleSaveAndExit}
                                    className="w-full py-4 bg-gray-800 text-white font-bold rounded-xl shadow-lg hover:bg-gray-900 transition-transform active:scale-95"
                                >
                                    Retour au menu
                                </button>
                            </>
                        ) : (
                            <>
                                {validationErrors.length > 0 ? (
                                    <div className="w-full max-w-sm animate-shake">
                                        <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 text-5xl shadow-sm border-4 border-white mx-auto">
                                            ⚠️
                                        </div>
                                        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Données Manquantes</h2>
                                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-left mb-6 max-h-40 overflow-y-auto border border-red-100 dark:border-red-800">
                                            <ul className="list-disc pl-5 text-sm text-red-700 dark:text-red-300 space-y-1">
                                                {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                                            </ul>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setValidationErrors([]);
                                            }}
                                            className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-transform active:scale-95"
                                        >
                                            Corriger les erreurs
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 text-5xl shadow-sm border-4 border-white">
                                            ✅
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Collecte Terminée</h2>
                                        <div className="w-full space-y-3">
                                            <button 
                                                onClick={handleFinalize}
                                                className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 transition-transform active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <span>🛡️</span> Sceller & Finaliser
                                            </button>
                                            <button 
                                                onClick={handleSaveAndExit}
                                                className="w-full py-3 bg-white border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50"
                                            >
                                                Sauvegarder brouillon
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {!isEndScreen && (
                <div className="bg-white dark:bg-gray-800 p-4 border-t dark:border-gray-700 flex gap-3 z-10 safe-area-bottom">
                    <button 
                        onClick={handlePrev}
                        disabled={currentStepIndex === 0}
                        className="flex-1 py-3.5 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 transition-colors"
                    >
                        Précédent
                    </button>
                    <button 
                        onClick={handleNext}
                        className="flex-[2] py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        Suivant
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            )}
        </div>
    );

    if (isCollecteOnly) {
        return content;
    }

    return (
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-200 dark:bg-gray-900 overflow-hidden">
            <DeviceFrame>
                {content}
            </DeviceFrame>
        </div>
    );
};

export default FormPreview;
