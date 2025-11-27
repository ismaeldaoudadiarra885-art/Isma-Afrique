
import { FunctionCall } from "@google/generative-ai";
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
                    const { type, name, label, required, choices, hint, relevant, constraint, calculation } = args;
                    const newQuestion: KoboQuestion = {
                        uid: uuidv4(),
                        type,
                        name,
                        label: { fr: label },
                        required,
                        hint: hint ? { fr: hint } : undefined,
                        relevant,
                        constraint,
                        calculation,
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

                case 'addQuestionsBatch': {
                    const { questions } = args;
                    if (Array.isArray(questions)) {
                        const newQuestions: KoboQuestion[] = questions.map((q: any) => ({
                            uid: uuidv4(),
                            type: q.type,
                            name: q.name,
                            label: { fr: q.label },
                            required: q.required,
                            hint: q.hint ? { fr: q.hint } : undefined,
                            relevant: q.relevant,
                            constraint: q.constraint,
                            calculation: q.calculation,
                            choices: q.choices?.map((c: { name: string, label: string }) => ({
                                ...c,
                                uid: uuidv4(),
                                label: { fr: c.label }
                            }))
                        }));
                        projectContext.addQuestionsBatch(newQuestions);
                        projectContext.logAction('addQuestionsBatch', { count: newQuestions.length }, 'ai');
                        confirmationMessages.push(`${newQuestions.length} questions ajoutées en une seule fois.`);
                    }
                    break;
                }
                
                case 'deleteQuestion': {
                    const { questionName } = args;
                    projectContext.deleteQuestion(questionName);
                    projectContext.logAction('deleteQuestion', { questionName }, 'ai');
                    confirmationMessages.push(`Question "${questionName}" supprimée.`);
                    break;
                }

                case 'updateQuestion': {
                    const { questionName, choices, ...updates } = args;
                    const formattedUpdates: any = {}; // Use any to allow dynamic property assignment
                    
                    // Mapping direct des champs simples
                    if(updates.type) formattedUpdates.type = updates.type;
                    if(updates.name) formattedUpdates.name = updates.name; // Renommage
                    if(updates.required !== undefined) formattedUpdates.required = updates.required;
                    if(updates.relevant) formattedUpdates.relevant = updates.relevant;
                    if(updates.constraint) formattedUpdates.constraint = updates.constraint;
                    if(updates.calculation) formattedUpdates.calculation = updates.calculation;
                    if(updates.appearance) formattedUpdates.appearance = updates.appearance;
                    if(updates.choice_filter) formattedUpdates.choice_filter = updates.choice_filter; // New: Cascading selects

                    // Mapping des champs localisés
                    if(updates.label) formattedUpdates.label = { fr: updates.label };
                    if(updates.hint) formattedUpdates.hint = { fr: updates.hint };
                    if(updates.constraint_message) formattedUpdates.constraint_message = { fr: updates.constraint_message };
                    
                    // Mapping des choix (remplacement complet)
                    if (choices && Array.isArray(choices)) {
                        formattedUpdates.choices = choices.map((c: { name: string, label: string }) => ({
                            uid: uuidv4(),
                            name: c.name,
                            label: { fr: c.label }
                        }));
                    }

                    projectContext.updateQuestion(questionName, formattedUpdates);
                    projectContext.logAction('updateQuestion', { questionName, updates: formattedUpdates }, 'ai');
                    
                    let msg = `Question "${questionName}" modifiée.`;
                    if (updates.relevant) msg += ` (Logique ajoutée)`;
                    if (updates.constraint) msg += ` (Validation ajoutée)`;
                    if (choices) msg += ` (Choix mis à jour)`;
                    
                    confirmationMessages.push(msg);
                    break;
                }
                
                case 'createGroup': {
                    const { startQuestionName, endQuestionName, groupLabel, groupName } = args;
                    
                    // Logic to find questions and wrap them
                    const startQ = project.formData.survey.find(q => q.name === startQuestionName);
                    
                    if (startQ) {
                        const gName = groupName || `grp_${Math.random().toString(36).substr(2, 5)}`;
                        
                        const beginGroup: KoboQuestion = {
                            uid: uuidv4(),
                            type: 'begin_group',
                            name: gName,
                            label: { fr: groupLabel },
                        };
                        
                        const endGroup: KoboQuestion = {
                            uid: uuidv4(),
                            type: 'end_group',
                            name: `${gName}_end`,
                            label: {},
                        };

                        // Insert begin_group BEFORE startQuestion
                        projectContext.addQuestion(beginGroup, startQuestionName, 'before');
                        
                        // Insert end_group AFTER endQuestion (or startQuestion if single)
                        const targetEnd = endQuestionName || startQuestionName;
                        // Small delay to ensure order if inserting rapidly, or better: handling batch insertion in context
                        // For now, sequential add works because 'addQuestion' modifies state immediately in our context implementation
                        projectContext.addQuestion(endGroup, targetEnd, 'after');
                        
                        projectContext.logAction('createGroup', { groupLabel }, 'ai');
                        confirmationMessages.push(`Groupe "${groupLabel}" créé autour des questions.`);
                    } else {
                        confirmationMessages.push(`Erreur: Question de départ "${startQuestionName}" introuvable.`);
                    }
                    break;
                }

                case 'cloneQuestion': {
                    const { sourceQuestionName, newLabel, newName } = args;
                    const sourceQ = project.formData.survey.find(q => q.name === sourceQuestionName);
                    
                    if (sourceQ) {
                        const clonedQ: KoboQuestion = {
                            ...sourceQ,
                            uid: uuidv4(),
                            name: newName || `${sourceQ.name}_copy`,
                            label: { fr: newLabel || `${(sourceQ.label as any).fr} (Copie)` },
                            choices: sourceQ.choices?.map(c => ({...c, uid: uuidv4()}))
                        };
                        
                        projectContext.addQuestion(clonedQ, sourceQuestionName, 'after');
                        projectContext.logAction('cloneQuestion', { source: sourceQuestionName }, 'ai');
                        confirmationMessages.push(`Question "${sourceQuestionName}" dupliquée.`);
                    }
                    break;
                }
                
                case 'reorderQuestion': {
                     const { questionNameToMove, targetQuestionName, position } = args;
                     projectContext.reorderQuestion(questionNameToMove, targetQuestionName, position);
                     projectContext.logAction('reorderQuestion', { questionNameToMove, targetQuestionName, position }, 'ai');
                     confirmationMessages.push(`Question "${questionNameToMove}" déplacée.`);
                     break;
                }

                case 'updateProjectSettings': {
                    const { form_title, form_id } = args;
                    const newSettings = { ...project.formData.settings };
                    if (form_title) newSettings.form_title = form_title;
                    if (form_id) newSettings.form_id = form_id;
                    
                    projectContext.updateProjectSettings(newSettings);
                    projectContext.logAction('updateProjectSettings', { form_title, form_id }, 'ai');
                    confirmationMessages.push(`Paramètres du projet mis à jour.`);
                    break;
                }

                case 'batchUpdateQuestions': {
                    const { updatesJson } = args;
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
                
                default:
                    console.warn(`Unknown function call: ${name}`);
            }
        } catch (error: any) {
            confirmationMessages.push(`Erreur lors de l'exécution de '${name}': ${error.message}`);
        }
    }

    return confirmationMessages;
};
