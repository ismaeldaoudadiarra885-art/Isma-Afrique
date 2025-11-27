export const getFormAgentFunctions = () => [
    {
        name: 'addQuestion',
        description: "Ajoute UNE seule question. Utiliser si l'utilisateur demande d'ajouter un champ spécifique.",
        parameters: {
            type: "object",
            properties: {
                type: { type: "string", description: "Type XLSForm : text, integer, decimal, select_one, select_multiple, image, geopoint, date, signature, audio, begin_group, end_group, note." },
                name: { type: "string", description: "Nom de variable unique en snake_case (ex: age_chef)." },
                label: { type: "string", description: "Le libellé de la question." },
                required: { type: "boolean", description: "Est-ce obligatoire ?" },
                choices: {
                    type: "array",
                    description: "Liste des choix pour select_one/multiple.",
                    items: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            label: { type: "string" },
                        }
                    }
                },
                hint: { type: "string", description: "Texte d'aide." },
                relevant: { type: "string", description: "Logique d'affichage XLSForm (ex: ${q1} = 'oui')." },
                constraint: { type: "string", description: "Validation XLSForm (ex: . > 18)." }
            },
            required: ["type", "name", "label"]
        }
    },
    {
        name: 'addQuestionsBatch',
        description: "CRITIQUE: Ajoute PLUSIEURS questions d'un coup. À UTILISER DÈS QUE L'UTILISATEUR DEMANDE DE CRÉER UN FORMULAIRE, UNE SECTION OU PLUSIEURS CHAMPS.",
        parameters: {
            type: "object",
            properties: {
                questions: {
                    type: "array",
                    description: "Liste des questions à ajouter.",
                    items: {
                        type: "object",
                        properties: {
                            type: { type: "string" },
                            name: { type: "string" },
                            label: { type: "string" },
                            required: { type: "boolean" },
                            hint: { type: "string" },
                            relevant: { type: "string" },
                            constraint: { type: "string" },
                            calculation: { type: "string" },
                            choices: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        label: { type: "string" },
                                    }
                                }
                            },
                        },
                        required: ["type", "name", "label"]
                    }
                }
            },
            required: ["questions"]
        }
    },
    {
        name: 'createGroup',
        description: "Regroupe une série de questions existantes dans un groupe (begin_group/end_group).",
        parameters: {
            type: "object",
            properties: {
                startQuestionName: { type: "string", description: "Nom de la première question à inclure dans le groupe." },
                endQuestionName: { type: "string", description: "Nom de la dernière question à inclure (peut être la même que start)." },
                groupLabel: { type: "string", description: "Titre du groupe (ex: 'Informations Démographiques')." },
                groupName: { type: "string", description: "Nom de variable du groupe (snake_case)." }
            },
            required: ["startQuestionName", "endQuestionName", "groupLabel"]
        }
    },
    {
        name: 'cloneQuestion',
        description: "Duplique une question existante (utile pour les répétitions : enfant 1, enfant 2...).",
        parameters: {
            type: "object",
            properties: {
                sourceQuestionName: { type: "string", description: "Nom de la question à copier." },
                newLabel: { type: "string", description: "Nouveau libellé." },
                newName: { type: "string", description: "Nouveau nom de variable." }
            },
            required: ["sourceQuestionName"]
        }
    },
    {
        name: 'deleteQuestion',
        description: "Supprime une question via son nom de variable (name).",
        parameters: {
            type: "object",
            properties: {
                questionName: { type: "string" }
            },
            required: ["questionName"]
        }
    },
    {
        name: 'updateQuestion',
        description: "Modifie une question existante. UTILISER POUR : Changer le type, ajouter une logique (relevant), rendre obligatoire, ajouter des choix, changer le libellé.",
        parameters: {
            type: "object",
            properties: {
                questionName: { type: "string", description: "Nom ACTUEL de la question à modifier" },
                type: { type: "string", description: "Nouveau type (ex: select_one, integer)" },
                name: { type: "string", description: "Renommer la variable (Nouveau nom)" },
                label: { type: "string" },
                hint: { type: "string" },
                required: { type: "boolean" },
                relevant: { type: "string", description: "Logique d'affichage (ex: ${q1} = 'oui')" },
                constraint: { type: "string", description: "Validation (ex: . >= 18)" },
                constraint_message: { type: "string" },
                calculation: { type: "string" },
                appearance: { type: "string", description: "Style (minimal, horizontal, multiline, thousands-sep)" },
                choices: {
                    type: "array",
                    description: "Remplacer les choix existants.",
                    items: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            label: { type: "string" },
                        }
                    }
                },
                choice_filter: { type: "string", description: "Filtre de choix pour les cascades (ex: region=${region_select})." }
            },
            required: ["questionName"]
        }
    },
    {
        name: 'reorderQuestion',
        description: "Change l'ordre d'une question.",
        parameters: {
            type: "object",
            properties: {
                questionNameToMove: { type: "string" },
                targetQuestionName: { type: "string" },
                position: { type: "string", description: "'before' ou 'after'" }
            },
            required: ["questionNameToMove", "targetQuestionName", "position"]
        }
    },
    {
        name: 'updateProjectSettings',
        description: "Change les paramètres globaux du projet (Titre, ID formulaire).",
        parameters: {
            type: "object",
            properties: {
                form_title: { type: "string" },
                form_id: { type: "string" }
            }
        }
    },
    {
        name: 'batchUpdateQuestions',
        description: "Exécute plusieurs mises à jour simultanément (Modifications seulement).",
        parameters: {
            type: "object",
            properties: {
                updatesJson: {
                    type: "string",
                    description: "Tableau JSON d'objets avec 'questionName' et 'updates'."
                }
            },
            required: ["updatesJson"]
        }
    }
];
