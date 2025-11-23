// FIX: Created full content for formAgentFunctions.ts to resolve module errors.
import { FunctionDeclaration, Type } from "@google/genai";

export const getFormAgentFunctions = (): FunctionDeclaration[] => [
    {
        name: 'addQuestion',
        description: "Ajoute une nouvelle question au formulaire. Doit avoir un nom unique.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                type: { type: Type.STRING, description: "Le type de question (ex: text, integer, select_one)." },
                name: { type: Type.STRING, description: "Le nom unique de la variable (court, en minuscules, sans espaces)." },
                label: { type: Type.STRING, description: "Le libellé complet de la question." },
                required: { type: Type.BOOLEAN, description: "La question est-elle obligatoire ?" },
                choices: {
                    type: Type.ARRAY,
                    description: "Pour les questions select_one/select_multiple, la liste des choix.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "La valeur stockée pour le choix." },
                            label: { type: Type.STRING, description: "Le texte affiché pour le choix." },
                        }
                    }
                },
                hint: { type: Type.STRING, description: "Un texte d'aide optionnel pour la question." }
            },
            required: ["type", "name", "label"]
        }
    },
    {
        name: 'deleteQuestion',
        description: "Supprime une question existante du formulaire en utilisant son nom de variable.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                questionName: { type: Type.STRING, description: "Le nom de la variable de la question à supprimer." }
            },
            required: ["questionName"]
        }
    },
    {
        name: 'updateQuestion',
        description: "Modifie les propriétés d'une question existante.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                questionName: { type: Type.STRING, description: "Le nom de la variable de la question à modifier." },
                label: { type: Type.STRING, description: "Le nouveau libellé de la question." },
                hint: { type: Type.STRING, description: "Le nouveau texte d'aide." },
                required: { type: Type.BOOLEAN, description: "La question est-elle obligatoire ?" },
                relevant: { type: Type.STRING, description: "La nouvelle logique de pertinence (XLSForm)." },
                constraint: { type: Type.STRING, description: "La nouvelle contrainte de validation (XLSForm)." },
                constraint_message: { type: Type.STRING, description: "Le message d'erreur pour la contrainte." },
            },
            required: ["questionName"]
        }
    },
    {
        name: 'reorderQuestion',
        description: "Change l'ordre d'une question dans le formulaire.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                questionNameToMove: { type: Type.STRING, description: "Le nom de la question à déplacer." },
                targetQuestionName: { type: Type.STRING, description: "Le nom de la question de référence." },
                position: { type: Type.STRING, description: "Placer 'before' (avant) ou 'after' (après) la question cible." }
            },
            required: ["questionNameToMove", "targetQuestionName", "position"]
        }
    },
    {
        name: 'batchUpdateQuestions',
        description: "Met à jour plusieurs questions en une seule fois. Utile pour des modifications complexes comme l'ajout de logiques.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                updatesJson: {
                    type: Type.STRING,
                    description: "Une chaîne JSON représentant un tableau d'objets. Chaque objet doit contenir 'questionName' et un objet 'updates' avec les champs à modifier (ex: { label: 'nouveau', required: true })."
                }
            },
            required: ["updatesJson"]
        }
    },
    {
        name: 'createQuestionGroup',
        description: "Crée un groupe de questions pour organiser le formulaire.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                groupName: { type: Type.STRING, description: "Le nom unique du groupe." },
                groupLabel: { type: Type.STRING, description: "Le libellé affiché du groupe." },
                questions: {
                    type: Type.ARRAY,
                    description: "Liste des noms de variables des questions à inclure dans le groupe.",
                    items: { type: Type.STRING }
                }
            },
            required: ["groupName", "groupLabel", "questions"]
        }
    },
    {
        name: 'addCalculatedField',
        description: "Ajoute un champ calculé basé sur d'autres questions.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                questionName: { type: Type.STRING, description: "Le nom unique du champ calculé." },
                label: { type: Type.STRING, description: "Le libellé du champ calculé." },
                calculation: { type: Type.STRING, description: "La formule de calcul (XLSForm)." }
            },
            required: ["questionName", "label", "calculation"]
        }
    },
    {
        name: 'setQuestionConditions',
        description: "Définit les conditions de pertinence et contraintes pour une question.",
        parameters: {
            type: Type.OBJECT,
            properties: {
                questionName: { type: Type.STRING, description: "Le nom de la question." },
                relevant: { type: Type.STRING, description: "Condition de pertinence (XLSForm)." },
                constraint: { type: Type.STRING, description: "Contrainte de validation (XLSForm)." },
                constraintMessage: { type: Type.STRING, description: "Message d'erreur pour la contrainte." }
            },
            required: ["questionName"]
        }
    }
];
