import React, { useEffect, useCallback, useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';
import { evaluateRelevant } from '../utils/formLogic';
import InteractiveQuestion from './InteractiveQuestion';
import DeviceFrame from './DeviceFrame';
import { useLanguage } from '../hooks/useTranslation';
import { KoboQuestion, Submission } from '../types';
import { getLocalizedText } from '../utils/localizationUtils';
import { validateConstraint } from '../utils/validation';
import { v4 as uuidv4 } from 'uuid';
import { offlineQueueService } from '../services/offlineQueueService';


interface FormPreviewProps {
  isCollecteOnly?: boolean;
}

interface NestedKoboQuestion extends KoboQuestion {
    children?: NestedKoboQuestion[];
}

// Helper to transform flat survey list into a nested structure for rendering
const nestSurvey = (survey: KoboQuestion[]): NestedKoboQuestion[] => {
    const nested: NestedKoboQuestion[] = [];
    const stack: NestedKoboQuestion[] = [];

    survey.forEach(q => {
        const questionNode: NestedKoboQuestion = { ...q, children: [] };

        if (q.type === 'begin_group') {
            if (stack.length > 0) {
                stack[stack.length - 1].children!.push(questionNode);
            } else {
                nested.push(questionNode);
            }
            stack.push(questionNode);
        } else if (q.type === 'end_group') {
            stack.pop();
        } else {
            if (stack.length > 0) {
                stack[stack.length - 1].children!.push(questionNode);
            } else {
                nested.push(questionNode);
            }
        }
    });
    return nested;
};

interface RecursiveQuestionRendererProps {
    questions: NestedKoboQuestion[];
    formValues: any;
    defaultLang: string;
    onChange: (name: string, value: any) => void;
    onQuestionClick?: (questionName: string) => void;
    isCollecteOnly?: boolean;
    readOnly?: boolean;
    currentQuestionName?: string;
    showIrrelevant?: boolean;
}

// Recursive component to render questions and groups
const RecursiveQuestionRenderer: React.FC<RecursiveQuestionRendererProps> = ({ questions, formValues, defaultLang, onChange, onQuestionClick, isCollecteOnly = false, readOnly = false, currentQuestionName, showIrrelevant = false }) => {
    return (
        <>
            {questions.map(question => {
                // In designer mode (isCollecteOnly = false), show all if showIrrelevant=true, else respect relevance
                // In collecte mode, always respect relevance
                const isRelevant = isCollecteOnly ? evaluateRelevant(question.relevant, formValues).result : showIrrelevant;

                if (question.type === 'begin_group') {
                    return (
                        <fieldset key={question.uid} className="border dark:border-gray-700 rounded-lg p-4 space-y-4" style={{ display: isRelevant ? 'block' : 'none' }}>
                            <legend className="px-2 font-semibold text-indigo-deep dark:text-indigo-deep-light">
                                {getLocalizedText(question.label, defaultLang)}
                            </legend>
                            <RecursiveQuestionRenderer
                                questions={question.children || []}
                                formValues={formValues}
                                defaultLang={defaultLang}
                                onChange={onChange}
                                onQuestionClick={onQuestionClick}
                                isCollecteOnly={isCollecteOnly}
                                readOnly={readOnly}
                            />
                        </fieldset>
                    );
                }

                return (
                    <div key={question.uid} style={{ display: isRelevant ? 'block' : 'none' }}>
                        <InteractiveQuestion
                            question={question}
                            value={formValues[question.name]}
                            onChange={onChange}
                            onQuestionClick={onQuestionClick}
                            isSelected={question.name === currentQuestionName}
                            readOnly={readOnly}
                            currentQuestionName={currentQuestionName}
                        />
                    </div>
                );
            })}
        </>
    );
};


const FormPreview: React.FC<FormPreviewProps> = ({ isCollecteOnly = false }) => {
    const { activeProject, formValues, updateFormValue, activeSubmissionId, setFormValues, setCurrentQuestionName, currentQuestionName, userRole, addSubmission, setActiveSubmissionId } = useProject();
    const { addNotification } = useNotification();
    const { t } = useLanguage();

    // Offline indicator
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Reset form values when switching to designer mode or when project changes
    useEffect(() => {
        if (!isCollecteOnly && activeProject) {
            setFormValues({});
        }
    }, [isCollecteOnly, setFormValues]);

    const handleQuestionClick = useCallback((name: string) => {
        console.log('FormPreview onQuestionClick called with:', name);
        setCurrentQuestionName(name);
        // Scroll to the clicked question in the DeviceFrame
        const questionElement = document.querySelector(`[data-question-name="${name}"]`);
        if (questionElement) {
            questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        // Focus the input after state update
        setTimeout(() => {
            const inputElement = document.querySelector(`input[name="${name}"]`) as HTMLInputElement;
            if (inputElement && !inputElement.disabled) {
                inputElement.focus();
            }
        }, 0);
    }, [setCurrentQuestionName]);

    // Auto-scroll to current question when changed (e.g., from sidebar)
    useEffect(() => {
        if (currentQuestionName) {
            const questionElement = document.querySelector(`[data-question-name="${currentQuestionName}"]`);
            if (questionElement) {
                questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentQuestionName, handleQuestionClick]);

    if (!activeProject) {
        return <div className="p-4 text-center">{t('formPreview_noActiveProject')}</div>;
    }

    const { survey, settings } = activeProject.formData;
    const nestedSurvey = nestSurvey(survey);
    const readOnly = false; // Allow input in preview for testing form logic

const FrameContent = () => {
     if (isCollecteOnly && !activeSubmissionId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-semibold">{t('formPreview_selectCaseTitle')}</h3>
                <p className="text-sm text-gray-500">{t('formPreview_selectCaseDescription')}</p>
            </div>
        );
    }

    // Check if there are any visible questions (recursive check for nested questions)
    // In designer mode, show all questions regardless of relevance
    // In collecte mode, only show relevant questions
    const hasVisibleQuestions = (questions: NestedKoboQuestion[]): boolean => {
        return questions.some(question => {
            if (!isCollecteOnly) {
                // Designer mode: show all questions
                if (question.type === 'begin_group' && question.children) {
                    return hasVisibleQuestions(question.children);
                }
                return question.type !== 'end_group';
            } else {
                // Collecte mode: only show relevant questions
                const isRelevant = evaluateRelevant(question.relevant, formValues).result;
                if (!isRelevant) return false;
                if (question.type === 'begin_group' && question.children) {
                    return hasVisibleQuestions(question.children);
                }
                return question.type !== 'end_group';
            }
        });
    };

    const visibleQuestionsExist = hasVisibleQuestions(nestedSurvey);

    if (!visibleQuestionsExist) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-semibold">{t('formPreview_noQuestionsTitle')}</h3>
                <p className="text-sm text-gray-500">{t('formPreview_noQuestionsDescription')}</p>
            </div>
        );
    }

    // Calculate progress for collecte mode
    const calculateProgress = (questions: NestedKoboQuestion[], values: any): number => {
        let totalQuestions = 0;
        let completedQuestions = 0;

        const countQuestions = (qs: NestedKoboQuestion[]) => {
            qs.forEach(q => {
                if (q.type !== 'begin_group' && q.type !== 'end_group') {
                    totalQuestions++;
                    if (values[q.name] !== undefined && values[q.name] !== '' && values[q.name] !== null) {
                        completedQuestions++;
                    }
                } else if (q.type === 'begin_group' && q.children) {
                    countQuestions(q.children);
                }
            });
        };

        countQuestions(questions);
        return totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;
    };

    const progress = isCollecteOnly ? calculateProgress(nestedSurvey, formValues) : 0;

    // Calculate global errors for summary
    const calculateGlobalErrors = (questions: NestedKoboQuestion[], values: any): { count: number; details: string[] } => {
        let errorCount = 0;
        const errorDetails: string[] = [];

        const checkErrors = (qs: NestedKoboQuestion[]) => {
            qs.forEach(q => {
                if (q.type !== 'begin_group' && q.type !== 'end_group') {
                    // Basic validation check (expand with full validationService if needed)
                    const isRequired = q.required;
                    const currentValue = values[q.name];
                    const labelText = getLocalizedText(q.label || { [settings.default_language || 'fr']: q.name }, settings.default_language || 'fr');
                    if (isRequired && (!currentValue || currentValue === '' || currentValue === null)) {
                        errorCount++;
                        errorDetails.push(`${labelText}: Champ obligatoire`);
                    }
                    // Add more checks like constraint, type-specific
                    if (q.constraint) {
                        const constraintResult = validateConstraint(q.constraint, currentValue, values);
                        if (!constraintResult.isValid) {
                            errorCount++;
                            errorDetails.push(`${labelText}: Ne respecte pas la contrainte`);
                        }
                    }
                } else if (q.type === 'begin_group' && q.children) {
                    checkErrors(q.children);
                }
            });
        };

        checkErrors(questions);
        return { count: errorCount, details: errorDetails };
    };

    const { count: errorCount, details: errorDetails } = isCollecteOnly ? calculateGlobalErrors(nestedSurvey, formValues) : { count: 0, details: [] };

    const handleSubmit = useCallback(async () => {
        if (errorCount > 0) {
            addNotification('Veuillez corriger les erreurs avant de soumettre.', 'error');
            return;
        }

        // Auto-capture metadata
        const deviceId = uuidv4(); // Unique device ID
        let gps: { lat: number; lng: number } | undefined;
        if (navigator.geolocation) {
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
                });
                gps = { lat: position.coords.latitude, lng: position.coords.longitude };
            } catch (error) {
                console.warn('GPS capture failed:', error);
            }
        }

        const submission: Submission = {
            id: uuidv4(),
            data: formValues,
            meta: {
                device_id: deviceId,
                gps: gps,
            },
            status: 'synced',
            timestamp: new Date().toISOString(),
        };

        try {
            addSubmission(submission);
            setFormValues({});
            setActiveSubmissionId(null);
            addNotification('Soumission réussie !', 'success');
        } catch (error) {
            console.error('Submission error:', error);
            addNotification('Erreur lors de la soumission.', 'error');
        }
    }, [errorCount, formValues, addSubmission, setFormValues, setActiveSubmissionId, addNotification]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-800">
            {isCollecteOnly && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-indigo-deep dark:text-indigo-deep-light">{t('formProgress')} ({Math.round(progress)}%)</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('formProgressDescription')}</p>
                            {errorCount > 0 && (
                                <p className="text-sm text-red-earth mt-1">{errorCount} erreur(s) à corriger</p>
                            )}
                            {!isOnline && (
                                <p className="text-sm text-orange-600 mt-1">Mode hors ligne - Synchronisation en attente</p>
                            )}
                        </div>
                        <div className="w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2 touch-manipulation">
                            <div
                                className="bg-indigo-500 h-2 rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                <h1 className="text-xl font-bold">{settings.form_title}</h1>
                <RecursiveQuestionRenderer
                    questions={nestedSurvey}
                    formValues={formValues}
                    defaultLang={settings.default_language}
                    onChange={updateFormValue}
                    onQuestionClick={handleQuestionClick}
                    isCollecteOnly={isCollecteOnly}
                    readOnly={readOnly}
                    currentQuestionName={currentQuestionName}
                    showIrrelevant={!isCollecteOnly} // In designer mode, show all by default; can be toggled
                />
                {isCollecteOnly && errorCount > 0 && (
                    <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <h3 className="text-sm font-medium text-red-earth mb-2">Erreurs à corriger :</h3>
                        <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 max-h-32 overflow-y-auto">
                            {errorDetails.map((detail, index) => (
                                <li key={index} className="flex items-start">
                                    <svg className="w-4 h-4 text-red-earth mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {detail}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {isCollecteOnly && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={handleSubmit}
                            disabled={errorCount > 0 || progress < 100}
                            className={`w-full py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                                errorCount > 0 || progress < 100
                                    ? 'bg-gray-400 cursor-not-allowed text-gray-500'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                            }`}
                        >
                            {errorCount > 0 ? `Corriger ${errorCount} erreur(s)` : 'Soumettre le formulaire'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

    return (
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-200 dark:bg-gray-900">
            <DeviceFrame>
                <FrameContent />
            </DeviceFrame>
        </div>
    );
};

export default FormPreview;