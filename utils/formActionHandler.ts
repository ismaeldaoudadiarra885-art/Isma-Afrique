// FIX: Created full content for formActionHandler.ts to resolve module errors.
import { FunctionCall } from "@google/genai";
import { useProject } from "../contexts/ProjectContext";
import { KoboProject, KoboQuestion } from "../types";
import { v4 as uuidv4 } from 'uuid';

type ProjectContextActions = ReturnType<typeof useProject>;

export const handleFunctionCalls = async (
    functionCalls: FunctionCall[],
    projectContext: ProjectContextActions,
    project: KoboProject,
    getAssistance: (prompt: string) => Promise<{ text: string | null; functionCalls: FunctionCall[] | null; }>
): Promise<string[]> => {
    const confirmationMessages: string[] = [];

    for (const call of functionCalls) {
        const { name, args } = call;
        if (!args) {
            confirmationMessages.push(`L'appel de fonction '${name}' a été reçu sans arguments et a été ignoré.`);
            continue;
        }

        try {
            switch (name) {
                case 'addQuestion': {
                    const { type, name, label, required, choices, hint } = args as {
                        type: string;
                        name: string;
                        label: string;
                        required?: boolean;
                        choices?: { name: string; label: string }[];
                        hint?: string;
                    };
                    const newQuestion: KoboQuestion = {
                        uid: uuidv4(),
                        type,
                        name,
                        label: { fr: label },
                        required,
                        hint: hint ? { fr: hint } : undefined,
                        choices: choices?.map((c: { name: string, label: string }) => ({
                            ...c,
                            uid: uuidv4(),
                            label: { fr: c.label }
                        }))
                    };
                    projectContext.addQuestion(newQuestion);
                    projectContext.logAction('addQuestion', { name, type, label }, 'ai');
                    confirmationMessages.push(`Question "${label}" ajoutée.`);
                    break;
                }

                case 'deleteQuestion': {
                    const { questionName } = args as { questionName: string };
                    projectContext.deleteQuestion(questionName);
                    projectContext.logAction('deleteQuestion', { questionName }, 'ai');
                    confirmationMessages.push(`Question "${questionName}" supprimée.`);
                    break;
                }

                case 'updateQuestion': {
                    const { questionName, ...updates } = args as {
                        questionName: string;
                        label?: string;
                        hint?: string;
                        constraint_message?: string;
                        required?: boolean;
                        relevant?: string;
                        constraint?: string;
                    };
                    const formattedUpdates: Partial<KoboQuestion> = {};
                    if(updates.label) formattedUpdates.label = { fr: updates.label };
                    if(updates.hint) formattedUpdates.hint = { fr: updates.hint };
                    if(updates.constraint_message) formattedUpdates.constraint_message = { fr: updates.constraint_message };
                    if(updates.required !== undefined) formattedUpdates.required = updates.required;
                    if(updates.relevant) formattedUpdates.relevant = updates.relevant;
                    if(updates.constraint) formattedUpdates.constraint = updates.constraint;

                    projectContext.updateQuestion(questionName, formattedUpdates);
                    projectContext.logAction('updateQuestion', { questionName, updates: formattedUpdates }, 'ai');
                    confirmationMessages.push(`Question "${questionName}" mise à jour.`);
                    break;
                }

                case 'reorderQuestion': {
                     const { questionNameToMove, targetQuestionName, position } = args as {
                         questionNameToMove: string;
                         targetQuestionName: string;
                         position: string;
                     };
                     projectContext.reorderQuestion(questionNameToMove, targetQuestionName, position);
                     projectContext.logAction('reorderQuestion', { questionNameToMove, targetQuestionName, position }, 'ai');
                     confirmationMessages.push(`Question "${questionNameToMove}" déplacée.`);
                     break;
                }

                case 'batchUpdateQuestions': {
                    const { updatesJson } = args as { updatesJson: string };
                    try {
                        const updates = JSON.parse(updatesJson);
                        projectContext.batchUpdateQuestions(updates);
                        projectContext.logAction('batchUpdateQuestions', { count: updates.length }, 'ai');
                        confirmationMessages.push(`${updates.length} questions mises à jour en bloc.`);
                    } catch (e) {
                        confirmationMessages.push(`Erreur de mise à jour en bloc: JSON invalide.`);
                    }
                    break;
                }

                case 'addSkipLogic': {
                    const { questionName, skipCondition } = args as { questionName: string; skipCondition: string };
                    projectContext.updateQuestion(questionName, { relevant: skipCondition });
                    projectContext.logAction('addSkipLogic', { questionName, skipCondition }, 'ai');
                    confirmationMessages.push(`Logique de saut ajoutée à "${questionName}".`);
                    break;
                }

                case 'addBranching': {
                    const { condition, targetQuestions } = args as { condition: string; targetQuestions: string[] };
                    // Créer un groupe avec logique conditionnelle
                    const groupQuestion = {
                        uid: uuidv4(),
                        type: 'begin_group',
                        name: `group_${Date.now()}`,
                        label: { fr: 'Groupe conditionnel' },
                        relevant: condition
                    };
                    projectContext.addQuestion(groupQuestion);

                    // Ajouter les questions cibles dans le groupe
                    targetQuestions.forEach(qName => {
                        // Trouver la question existante et la déplacer
                        const existingQuestion = project.formData.survey.find(q => q.name === qName);
                        if (existingQuestion) {
                            projectContext.deleteQuestion(qName);
                            projectContext.addQuestion(existingQuestion, groupQuestion.name);
                        }
                    });

                    projectContext.logAction('addBranching', { condition, targetQuestions }, 'ai');
                    confirmationMessages.push(`Embranchement conditionnel créé avec ${targetQuestions.length} questions.`);
                    break;
                }

                case 'setQuestionConditions': {
                    const { questionName, relevant, constraint, constraintMessage } = args as {
                        questionName: string;
                        relevant?: string;
                        constraint?: string;
                        constraintMessage?: string;
                    };
                    const updates: Partial<KoboQuestion> = {};
                    if (relevant) updates.relevant = relevant;
                    if (constraint) updates.constraint = constraint;
                    if (constraintMessage) updates.constraint_message = { fr: constraintMessage };

                    projectContext.updateQuestion(questionName, updates);
                    projectContext.logAction('setQuestionConditions', { questionName, ...updates }, 'ai');
                    confirmationMessages.push(`Conditions appliquées à "${questionName}".`);
                    break;
                }

                case 'createQuestionGroup': {
                    const { groupName, groupLabel, questions } = args as {
                        groupName: string;
                        groupLabel: string;
                        questions: string[];
                    };
                    const groupQuestion = {
                        uid: uuidv4(),
                        type: 'begin_group',
                        name: groupName,
                        label: { fr: groupLabel }
                    };
                    projectContext.addQuestion(groupQuestion);

                    questions.forEach(qName => {
                        const existingQuestion = project.formData.survey.find(q => q.name === qName);
                        if (existingQuestion) {
                            projectContext.deleteQuestion(qName);
                            projectContext.addQuestion(existingQuestion, groupQuestion.name);
                        }
                    });

                    projectContext.logAction('createQuestionGroup', { groupName, questions }, 'ai');
                    confirmationMessages.push(`Groupe "${groupLabel}" créé avec ${questions.length} questions.`);
                    break;
                }

                case 'addCalculatedField': {
                    const { questionName, label, calculation } = args as {
                        questionName: string;
                        label: string;
                        calculation: string;
                    };
                    const calcQuestion = {
                        uid: uuidv4(),
                        type: 'calculate',
                        name: questionName,
                        label: { fr: label },
                        calculation
                    };
                    projectContext.addQuestion(calcQuestion);
                    projectContext.logAction('addCalculatedField', { questionName, calculation }, 'ai');
                    confirmationMessages.push(`Champ calculé "${label}" ajouté.`);
                    break;
                }

                case 'setValidationRules': {
                    const { questionName, rules } = args as {
                        questionName: string;
                        rules: { constraint: string; message: string }[];
                    };
                    // Pour l'instant, appliquer la première règle
                    if (rules.length > 0) {
                        projectContext.updateQuestion(questionName, {
                            constraint: rules[0].constraint,
                            constraint_message: { fr: rules[0].message }
                        });
                    }
                    projectContext.logAction('setValidationRules', { questionName, rulesCount: rules.length }, 'ai');
                    confirmationMessages.push(`${rules.length} règles de validation appliquées à "${questionName}".`);
                    break;
                }

                default:
                    console.warn(`Unknown function call: ${name}`);
            }
        } catch (error: any) {
            confirmationMessages.push(`Erreur lors de l'exécution de '${name}': ${error.message}`);
        }
    }

    return confirmationMessages;
};
