

import { GoogleGenAI, Type, FunctionDeclaration, Content } from "@google/genai";
import { KoboProject, KoboQuestion, FormValues, AiRole, Submission, SimulationProfile, KoboFormData, LocalizedText, LogicError, DataCleaningSuggestion } from '../types';
import { buildSystemInstruction } from '../utils/promptAgentBuilder';
import { getFormAgentFunctions } from '../utils/formAgentFunctions';
import { v4 as uuidv4 } from 'uuid';
import { getLocalizedText } from "../utils/localizationUtils";

// FIX: Initialize the Gemini AI client as per the guidelines.
const apiKey = (import.meta as any).env?.VITE_API_KEY;
if (!apiKey) {
    console.warn('API_KEY not set. AI features may not work properly. Please set API_KEY in .env file.');
}
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
const model = 'gemini-2.5-flash';
const proModel = 'gemini-2.5-pro';

// Cache for AI responses to reduce API calls
const aiCache = new Map<string, any>();

const withRetry = async <T>(fn: () => Promise<T>, onRetry: () => void, maxRetries = 2): Promise<T> => {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await fn();
        } catch (error) {
            attempt++;
            if (attempt >= maxRetries) {
                throw error;
            }
            onRetry();
        }
    }
    throw new Error("Max retries reached");
};


export const getAssistance = async (
    userInput: string,
    chatHistory: Content[],
    roles: AiRole[],
    project: KoboProject,
    currentQuestion?: KoboQuestion,
    formValues?: FormValues,
    isFormGenerationMode: boolean = false,
    conversationDepth: number = 0,
    onRetry?: () => void
): Promise<{ text: string; functionCalls: any[] | null; }> => {
    if (!ai) {
        console.warn('AI not available, returning mock response for script generation.');
        // Mock response for script generation
        if (userInput.includes('R')) {
            return {
                text: `# Mock R Script for Data Analysis
# Install packages if needed
# install.packages(c("dplyr", "ggplot2"))

library(dplyr)
library(ggplot2)

# Load data
data <- read.csv("data.csv")

# Basic summary for each variable
summary(data)

# Frequency tables for categorical variables
table(data$sexe)
table(data$region)

# Example visualization
ggplot(data, aes(x = region, fill = sexe)) + 
  geom_bar(position = "dodge") +
  labs(title = "Distribution by Region and Sex")

# Export results
write.csv(summary_stats, "analysis_results.csv")`,
                functionCalls: null,
            };
        } else if (userInput.includes('Stata')) {
            return {
                text: `* Mock Stata Script for Data Analysis

* Install packages if needed (use ssc install)
ssc install estout
ssc install outreg2

* Load data
import delimited "data.csv", clear

* Basic summary for each variable
summarize

* Frequency tables for categorical variables
tabulate sexe
tabulate region

* Example regression or visualization
graph bar (mean) sexe, over(region)
graph export "distribution.png", replace

* Export results
outreg2 using "analysis_results.xls", replace
estpost summarize
esttab using "summary_stats.csv", replace`,
                functionCalls: null,
            };
        }
        return {
            text: "L'assistance IA n'est pas disponible sans clé API. Veuillez configurer VITE_API_KEY dans votre fichier .env.",
            functionCalls: null,
        };
    }

    const systemInstruction = buildSystemInstruction(roles, project, currentQuestion, formValues, isFormGenerationMode, conversationDepth);
    const tools = [{ functionDeclarations: getFormAgentFunctions() }];
    const modelToUse = roles.includes('architecte_formulaire') ? proModel : model;

    const contents: Content[] = [...chatHistory, { role: 'user', parts: [{ text: userInput }] }];

    const fn = async () => {
        const response = await ai.models.generateContent({
            model: modelToUse,
            contents: contents,
            config: {
                systemInstruction,
                tools,
            }
        });
        return response;
    };

    const response = onRetry ? await withRetry(fn, onRetry) : await fn();

    return {
        text: response.text,
        functionCalls: response.functionCalls || null,
    };
};

const formGenerationSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, description: "Type de question XLSForm (ex: text, integer, select_one, note, begin_group)." },
            name: { type: Type.STRING, description: "Nom de variable unique (court, sans espaces, en minuscules)." },
            label: { type: Type.STRING, description: "Le libellé complet de la question en français." },
            hint: { type: Type.STRING, description: "Indice ou texte d'aide optionnel." },
            required: { type: Type.BOOLEAN, description: "La question est-elle obligatoire ?" },
            choices: {
                type: Type.ARRAY,
                description: "Pour les questions 'select_one' ou 'select_multiple', la liste des choix.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "La valeur stockée (name)." },
                        label: { type: Type.STRING, description: "Le texte affiché (label)." },
                    },
                },
            },
        },
        required: ["type", "name", "label"],
    },
};

export const structureFormFromText = async (text: string): Promise<Partial<KoboQuestion>[]> => {
    const cacheKey = `structure_${text}`;
    if (aiCache.has(cacheKey)) {
        return aiCache.get(cacheKey);
    }

    const prompt = `
        Analyse le texte brut suivant d'un questionnaire Word en français et extrais une structure de formulaire KoboToolbox (XLSForm).
        Règles strictes :
        - Détecte les sections (ex: "Section 1 : ...") comme groupes : type 'begin_group' pour début, 'end_group' pour fin, avec label = nom section.
        - Questions numérotées (ex: "1. Label : …") : type 'text' pour champs ouverts (…………), 'integer' si âge/nombre, 'select_one' pour choix avec "o" (ex: o Homme). Name = 'q1', 'q2' etc. séquentiel. Label = texte après numéro jusqu'à ':'.
        - Choix multiples : Lister sous question avec "o" comme array choices {name: auto (c1, c2...), label: {fr: texte}}.
        - Conditionnels (ex: "Si Oui :") : Ajouter comme hint ou sous-groupe après la question parent.
        - Ignorer metadata (titre, date, nom enquêteur) sauf si premier ligne comme titre global (note).
        - Pour chaque question : required=false par défaut, hint si explication.
        - Gère le français ; sortie en JSON array d'objets.

        Exemple d'entrée :
        Section 1 : Informations générales
        1. Nom du chef de ménage : ……………………………
        2. Sexe du chef de ménage :
        o Homme
        o Femme
        3. Nombre de personnes : ……………………………

        Sortie attendue :
        [
          {"type": "begin_group", "name": "group1", "label": "Section 1 : Informations générales"},
          {"type": "text", "name": "q1", "label": "Nom du chef de ménage"},
          {"type": "select_one sexe", "name": "q2", "label": "Sexe du chef de ménage", "choices": [{"name": "homme", "label": "Homme"}, {"name": "femme", "label": "Femme"}]},
          {"type": "integer", "name": "q3", "label": "Nombre de personnes"},
          {"type": "end_group", "name": "group1"}
        ]

        Texte à analyser:
        ---
        ${text}
        ---
        Réponds UNIQUEMENT avec le JSON array correspondant au schéma. Pas de texte supplémentaire.
    `;

    try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: formGenerationSchema
            }
        });
        const structuredJSON = JSON.parse(response.text);
        if (!Array.isArray(structuredJSON) || structuredJSON.length === 0) {
            throw new Error("Aucune question extraite. Vérifiez le format du document.");
        }
        const result = structuredJSON.map((q: any) => ({
            ...q,
            label: { fr: q.label },
            hint: q.hint ? { fr: q.hint } : undefined,
            choices: q.choices?.map((c: any) => ({ ...c, label: { fr: c.label } }))
        }));
        aiCache.set(cacheKey, result);
        return result;
    } catch (e) {
        console.error("Erreur lors de la structuration du formulaire par l'IA:", e);
        throw new Error("L'IA n'a pas pu structurer le document. Essayez de simplifier le format (numérotation claire, sections, choix avec 'o') ou fournissez un exemple plus structuré.");
    }
};

export const generateFormFromPrompt = async (prompt: string, projectName: string): Promise<KoboFormData> => {
     const generationPrompt = `
        Crée une structure de formulaire KoboToolbox basée sur la description suivante.
        Conçois une liste de questions logiques et bien structurées. Utilise des groupes si nécessaire.
        Réponds UNIQUEMENT avec un objet JSON qui correspond au schéma fourni.
        
        Description: "${prompt}"
    `;

    if (!ai) {
        console.warn('Pas d\'API_KEY, utilisation de mock pour génération IA.');
        // Mock fallback si pas d'API - formulaire basique mais structuré
        console.warn('Mode IA non disponible - génération de formulaire basique optimisé');
        return {
            settings: {
              form_title: projectName,
              form_id: projectName.toLowerCase().replace(/\s+/g, '_').slice(0, 30),
              version: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
              default_language: 'fr',
            },
            survey: [
                {
                    uid: uuidv4(),
                    type: 'note',
                    name: 'intro_note',
                    label: { fr: 'Bienvenue dans cette enquête. Toutes les réponses sont confidentielles.' },
                    required: false
                },
                {
                    uid: uuidv4(),
                    type: 'select_one yes_no',
                    name: 'consent',
                    label: { fr: 'Acceptez-vous de participer à cette enquête ?' },
                    hint: { fr: 'Votre participation est volontaire et anonyme' },
                    required: true,
                    choices: [
                        { uid: uuidv4(), name: 'oui', label: { fr: 'Oui' } },
                        { uid: uuidv4(), name: 'non', label: { fr: 'Non' } }
                    ]
                },
                {
                    uid: uuidv4(),
                    type: 'text',
                    name: 'nom_chef',
                    label: { fr: 'Nom du chef de ménage' },
                    hint: { fr: 'Nom complet en majuscules' },
                    required: true,
                    relevant: '${consent} = \'oui\''
                },
                {
                    uid: uuidv4(),
                    type: 'integer',
                    name: 'age_chef',
                    label: { fr: 'Âge du chef de ménage' },
                    hint: { fr: 'En années' },
                    required: true,
                    constraint: '. >= 18 and . <= 120',
                    constraint_message: { fr: 'L\'âge doit être entre 18 et 120 ans' },
                    relevant: '${consent} = \'oui\''
                }
            ],
            choices: [
                { uid: uuidv4(), name: 'oui', label: { fr: 'Oui' } },
                { uid: uuidv4(), name: 'non', label: { fr: 'Non' } }
            ],
        };
    }

     try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: generationPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: formGenerationSchema
            }
        });

        console.log('Réponse Gemini pour génération avancée:', response.text);
        const parsed = JSON.parse(response.text);
        if (!Array.isArray(parsed) || parsed.length === 0) {
            throw new Error('Réponse IA vide - essayez de reformuler votre description');
        }

        // Validation et enrichissement des questions générées
        const survey = parsed.map((q: any): KoboQuestion => {
            const enrichedQuestion = {
                ...q,
                uid: uuidv4(),
                label: { fr: q.label },
                hint: q.hint ? { fr: q.hint } : undefined,
                choices: q.choices?.map((c: any) => ({ ...c, uid: uuidv4(), label: { fr: c.label } }))
            };

            // Ajouter des contraintes automatiques pour certains types
            if (q.type === 'integer' && q.name.includes('age') && !q.constraint) {
                enrichedQuestion.constraint = '. >= 0 and . <= 120';
                enrichedQuestion.constraint_message = { fr: 'L\'âge doit être entre 0 et 120 ans' };
            }

            return enrichedQuestion;
        });

        console.log('Survey avancé parsé (longueur):', survey.length, survey);

        if (survey.length === 0) {
            throw new Error('Aucune question générée - vérifiez la description');
        }

        // Vérifier la présence du consentement
        const hasConsent = survey.some(q => q.name.includes('consent'));
        if (!hasConsent) {
            console.warn('Aucun consentement détecté - ajout automatique recommandé');
        }
        
        return {
            settings: {
              form_title: projectName,
              form_id: projectName.toLowerCase().replace(/\s+/g, '_').slice(0, 30),
              version: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
              default_language: 'fr',
            },
            survey,
            choices: [],
        };
    } catch (e) {
        console.error("Erreur lors de la génération du formulaire par l'IA:", e);
        // Fallback : Créer questions basiques basées sur prompt
        const keywords = prompt.toLowerCase().includes('santé') ? ['Symptômes observés', 'Vaccination à jour ?'] : 
                         prompt.toLowerCase().includes('ménage') ? ['Nom du chef de ménage', 'Nombre de membres'] : 
                         ['Question 1', 'Question 2'];
        const fallbackSurvey = [
            {
                uid: uuidv4(),
                type: 'note',
                name: 'consent_note',
                label: { fr: 'Consentement et informations générales' },
                required: false
            },
            {
                uid: uuidv4(),
                type: 'select_one yes_no',
                name: 'consent',
                label: { fr: 'Acceptez-vous de participer à cette enquête ?' },
                hint: { fr: 'Votre participation est volontaire et confidentielle' },
                required: true,
                choices: [
                    { uid: uuidv4(), name: 'oui', label: { fr: 'Oui' } },
                    { uid: uuidv4(), name: 'non', label: { fr: 'Non' } }
                ]
            },
            {
                uid: uuidv4(),
                type: 'text',
                name: 'nom_chef',
                label: { fr: 'Nom du chef de ménage' },
                hint: { fr: 'Nom complet en majuscules' },
                required: true,
                relevant: '${consent} = \'oui\''
            },
            {
                uid: uuidv4(),
                type: 'select_one sexe',
                name: 'sexe_chef',
                label: { fr: 'Sexe du chef de ménage' },
                required: true,
                relevant: '${consent} = \'oui\'',
                choices: [
                    { uid: uuidv4(), name: 'homme', label: { fr: 'Homme' } },
                    { uid: uuidv4(), name: 'femme', label: { fr: 'Femme' } }
                ]
            },
            {
                uid: uuidv4(),
                type: 'integer',
                name: 'age_chef',
                label: { fr: 'Âge du chef de ménage' },
                hint: { fr: 'En années' },
                required: true,
                constraint: '. >= 18 and . <= 120',
                constraint_message: { fr: 'L\'âge doit être entre 18 et 120 ans' },
                relevant: '${consent} = \'oui\''
            },
            {
                uid: uuidv4(),
                type: 'select_one region',
                name: 'region',
                label: { fr: 'Région de résidence' },
                required: true,
                relevant: '${consent} = \'oui\'',
                choices: [
                    { uid: uuidv4(), name: 'bamako', label: { fr: 'Bamako' } },
                    { uid: uuidv4(), name: 'kayes', label: { fr: 'Kayes' } },
                    { uid: uuidv4(), name: 'koulikoro', label: { fr: 'Koulikoro' } },
                    { uid: uuidv4(), name: 'sikasso', label: { fr: 'Sikasso' } },
                    { uid: uuidv4(), name: 'segou', label: { fr: 'Ségou' } },
                    { uid: uuidv4(), name: 'mopti', label: { fr: 'Mopti' } },
                    { uid: uuidv4(), name: 'tombouctou', label: { fr: 'Tombouctou' } },
                    { uid: uuidv4(), name: 'gao', label: { fr: 'Gao' } },
                    { uid: uuidv4(), name: 'kidal', label: { fr: 'Kidal' } }
                ]
            }
        ];
        console.log('Fallback survey généré (longueur):', fallbackSurvey.length);
        return {
            settings: {
              form_title: projectName,
              form_id: projectName.toLowerCase().replace(/\s+/g, '_').slice(0, 30),
              version: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
              default_language: 'fr',
            },
            survey: fallbackSurvey,
            choices: [
                { uid: uuidv4(), name: 'oui', label: { fr: 'Oui' } },
                { uid: uuidv4(), name: 'non', label: { fr: 'Non' } }
            ],
        };
    }
};

export const getAIFormQualityAudit = async (project: KoboProject): Promise<string> => {
    const { survey, settings } = project.formData;
    const formStructure = survey.map(q => `- ${q.name} (${q.type}): ${getLocalizedText(q.label, settings.default_language)}`).join('\n');
    
    const prompt = `
        En tant qu'auditeur expert de formulaires KoboToolbox, analyse la structure suivante.
        Identifie les faiblesses, les ambiguïtés, et les améliorations possibles.
        Tes recommandations doivent être concrètes et pertinentes pour un contexte d'enquête au Mali.
        Fournis une réponse formatée en Markdown.
        
        Structure du formulaire :
        ${formStructure}
    `;

    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text;
};

export const getAIDataQualityAudit = async (submissions: Submission[]): Promise<string> => {
    if (submissions.length === 0) {
        return "Aucune soumission disponible pour l'audit de qualité des données.";
    }

    const sample = submissions.slice(-20).map(s => s.data);
    const prompt = `
        En tant qu'analyste de données expert, examine cet échantillon de soumissions de formulaire.
        Identifie les tendances, anomalies, ou problèmes de qualité de données potentiels.
        Propose des améliorations avancées surpassant KoboToolbox, comme :
        - Détection automatique d'incohérences culturelles
        - Suggestions de nettoyage basées sur l'IA
        - Analyse de biais potentiels dans les données
        - Recommandations pour améliorer la collecte future
        Fournis un résumé de tes observations en Markdown.

        Échantillon (${sample.length} soumissions) :
        ${JSON.stringify(sample, null, 2)}
    `;

    if (!ai) {
        return "L'IA n'est pas disponible. Vérifiez la clé API VITE_API_KEY.";
    }

    try {
        const response = await ai.models.generateContent({ model: proModel, contents: prompt });
        return response.text;
    } catch (e) {
        console.error('Erreur audit qualité données:', e);
        return "Erreur lors de l'audit IA. Vérifiez la clé API.";
    }
};

export const getDataAnalysisInsight = async (userInput: string, project: KoboProject): Promise<string> => {
    const { submissions, formData } = project;
    const sample = submissions.slice(-50).map(s => s.data);
    const questionInfo = formData.survey.map(q => `${q.name}: ${getLocalizedText(q.label, formData.settings.default_language)}`).join('\n');

    const prompt = `
        Contexte : Tu es un analyste de données expert surpassant les capacités de KoboToolbox.
        Voici un aperçu des questions du formulaire :
        ${questionInfo}

        Voici un échantillon des données (${sample.length} soumissions) :
        ${JSON.stringify(sample, null, 2)}

        En te basant sur ces données, réponds à la question suivante de l'utilisateur.
        Propose des insights avancés incluant :
        - Analyse de tendances culturelles spécifiques au Mali
        - Détection de biais potentiels
        - Suggestions d'améliorations pour la collecte future
        - Comparaisons avec des benchmarks régionaux
        Ta réponse doit être claire, concise, et formatée en Markdown.

        Question: "${userInput}"
    `;

    if (!ai) {
        return "L'IA n'est pas disponible. Vérifiez la clé API VITE_API_KEY.";
    }

    try {
        const response = await ai.models.generateContent({ model: proModel, contents: prompt });
        return response.text;
    } catch (e) {
        console.error('Erreur analyse personnalisée:', e);
        return "Erreur lors de l'analyse IA. Vérifiez la clé API.";
    }
};

export const simulateAiResponse = async (
    project: KoboProject,
    profile: SimulationProfile,
    currentValues: FormValues,
    nextQuestion: KoboQuestion
): Promise<{ answer: string | number | string[] }> => {
    const { survey, settings } = project.formData;
    const defaultLang = settings.default_language;
    const questionContext = survey.map(q => {
        const value = currentValues[q.name] !== undefined ? ` (Réponse: ${currentValues[q.name]})` : '';
        return `- ${getLocalizedText(q.label, defaultLang)}${value}`;
    }).join('\n');

    const prompt = `
        Tu es un simulateur d'enquête. Incarne la persona suivante :
        --- PERSONA ---
        ${profile.persona}
        ---
        On te pose une question dans le cadre d'une enquête.
        Voici le contexte des questions et réponses précédentes :
        ${questionContext}
        ---
        Question actuelle : "${getLocalizedText(nextQuestion.label, defaultLang)}"
        ${nextQuestion.hint ? `(Indice: ${getLocalizedText(nextQuestion.hint, defaultLang)})` : ''}
        ${nextQuestion.choices ? `(Choix possibles: ${nextQuestion.choices.map(c => `${c.name} = ${getLocalizedText(c.label, defaultLang)}`).join(', ')})` : ''}
        
        Ta tâche est de fournir UNIQUEMENT la réponse la plus plausible pour ta persona, au format JSON.
        - Pour les questions 'select_one' ou 'select_multiple', retourne la valeur ('name') du choix, pas son libellé ('label').
        - Pour les questions 'integer' ou 'decimal', retourne un nombre.
        - Pour les autres, retourne une chaîne de caractères.
    `;
    
    if (!ai) {
        // Mock response for simulation if no API key
        let mockAnswer: any;
        if (nextQuestion.type === 'integer' || nextQuestion.type === 'decimal') {
            mockAnswer = nextQuestion.type === 'integer' ? Math.floor(Math.random() * 100) + 1 : (Math.random() * 100).toFixed(2);
        } else if (nextQuestion.type === 'select_one' && nextQuestion.choices && nextQuestion.choices.length > 0) {
            const randomIndex = Math.floor(Math.random() * nextQuestion.choices.length);
            mockAnswer = nextQuestion.choices[randomIndex].name;
        } else if (nextQuestion.type === 'select_multiple' && nextQuestion.choices && nextQuestion.choices.length > 0) {
            const numSelected = Math.floor(Math.random() * nextQuestion.choices.length) + 1;
            const shuffled = nextQuestion.choices.sort(() => 0.5 - Math.random());
            mockAnswer = shuffled.slice(0, numSelected).map(c => c.name).join(' ');
        } else {
            mockAnswer = 'Réponse simulée';
        }
        return { answer: mockAnswer };
    }

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
    });

    let parsed;
    try {
        parsed = JSON.parse(response.text);
        const answer = parsed.answer;
        // Auto-detect type if possible
        if (typeof answer === 'string') {
            const num = Number(answer);
            if (!isNaN(num) && answer.trim() !== '') {
                return { answer: num };
            }
            // If looks like comma-separated for array, but rely on prompt for JSON array
            if (answer.includes(',') && nextQuestion.type.includes('select_multiple')) {
                return { answer: answer.split(',').map(s => s.trim()) };
            }
        }
        return { answer };
    } catch (e) {
        console.error('JSON parse error in simulateAiResponse:', e);
        // Fallback to text as string
        return { answer: response.text };
    }
};

export const detectLogicErrors = async (project: KoboProject): Promise<LogicError[]> => {
    const cacheKey = `logic_errors_${project.id}`;
    if (aiCache.has(cacheKey)) {
        return aiCache.get(cacheKey);
    }

    const { survey, settings } = project.formData;
    const defaultLang = settings.default_language || 'fr';
    const formStructure = survey.map(q => {
        const label = getLocalizedText(q.label, defaultLang);
        const relevant = q.relevant ? ` (Relevant: ${q.relevant})` : '';
        const constraint = q.constraint ? ` (Constraint: ${q.constraint})` : '';
        return `- ${q.name} (${q.type}): ${label}${relevant}${constraint}`;
    }).join('\n');

    const prompt = `
        En tant qu'expert en logique de formulaires KoboToolbox, analyse la structure suivante pour détecter les erreurs logiques.
        Identifie les problèmes comme : conditions relevant circulaires, contraintes impossibles, dépendances contradictoires, questions obligatoires inaccessibles.
        Contexte : Enquêtes au Mali, focus sur cohérence et flux utilisateur.
        Pour chaque erreur, spécifie : questionName (nom de la question affectée), logicType ('relevant' | 'constraint' | 'circular_dependency' | 'undefined_variable'), error (description en français), questionLabel (libellé de la question), expression (l'expression problématique si applicable).
        Réponds UNIQUEMENT avec un JSON array d'objets {questionName: string, logicType: string, error: string, questionLabel: string, expression?: string}.

        Structure du formulaire :
        ${formStructure}

        Exemple sortie :
        [
          {"questionName": "q_age", "logicType": "relevant", "error": "Condition circulaire : dépend de elle-même via q_parent.", "questionLabel": "Âge du répondant", "expression": "q_parent = 'oui'"},
          {"questionName": "q_sexe", "logicType": "constraint", "error": "Contrainte impossible : valeur doit être >100 pour un champ âge.", "questionLabel": "Sexe", "expression": "self > 100"}
        ]
    `;

    if (!ai) {
        // Mock fallback: Basic logic errors simulation
        const mockErrors: LogicError[] = [];
        if (survey.length > 0) {
            // Simulate a relevant error on first question if it has relevant
            const firstQ = survey[0];
            if (firstQ.relevant) {
                mockErrors.push({
                    questionName: firstQ.name,
                    questionLabel: getLocalizedText(firstQ.label, defaultLang),
                    logicType: 'relevant',
                    error: 'Condition relevant sur première question : potentiellement inaccessible.',
                    expression: firstQ.relevant
                });
            }
            // Simulate constraint error if any integer
            const intQ = survey.find(q => q.type === 'integer' && q.constraint);
            if (intQ) {
                mockErrors.push({
                    questionName: intQ.name,
                    questionLabel: getLocalizedText(intQ.label, defaultLang),
                    logicType: 'constraint',
                    error: 'Vérifier contrainte sur entier : risque de valeurs impossibles.',
                    expression: intQ.constraint
                });
            }
        }
        aiCache.set(cacheKey, mockErrors);
        return mockErrors;
    }

    try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            questionName: { type: Type.STRING },
                            logicType: { type: Type.STRING, enum: ['relevant', 'constraint', 'circular_dependency', 'undefined_variable'] },
                            error: { type: Type.STRING },
                            questionLabel: { type: Type.STRING },
                            expression: { type: Type.STRING }
                        },
                        required: ['questionName', 'logicType', 'error', 'questionLabel']
                    }
                }
            }
        });
        let errors = JSON.parse(response.text);
        if (!Array.isArray(errors)) {
            throw new Error('Réponse non-array');
        }
        // Ensure expression is optional
        errors = errors.map((err: any) => ({ ...err, expression: err.expression || undefined }));
        aiCache.set(cacheKey, errors);
        return errors;
    } catch (e) {
        console.error('Erreur détection erreurs logiques:', e);
        // Fallback to empty or basic
        aiCache.set(cacheKey, []);
        return [];
    }
};

export const generateDataCleaningSuggestions = async (submissions: Submission[]): Promise<DataCleaningSuggestion[]> => {
    const cacheKey = `cleaning_suggestions_${submissions.length}_${submissions[0]?.id || 'no'}`;
    if (aiCache.has(cacheKey)) {
        return aiCache.get(cacheKey);
    }

    if (submissions.length === 0) {
        return [];
    }

    const sample = submissions.slice(0, 20); // Sample pour analyse
    const sampleData = sample.map(s => s.data);
    const prompt = `
        En tant qu'expert en nettoyage de données d'enquêtes, analyse cet échantillon de soumissions.
        Identifie les problèmes : valeurs manquantes systématiques, outliers (ex: âges >150), incohérences (ex: sexe non-binaire si choix limités), patterns suspects.
        Contexte : Données d'enquêtes au Mali, focus sur qualité pour analyse.
        Pour chaque suggestion : submissionId (ID soumission), questionName (nom champ), reason (raison en français, incluant sévérité ex: "haute: Valeur aberrante"), originalValue (valeur actuelle), suggestedValue (valeur proposée ou null si vérifier).
        Réponds UNIQUEMENT avec un JSON array d'objets {submissionId: string, questionName: string, reason: string, originalValue: any, suggestedValue: any}.

        Échantillon (${sample.length} soumissions) :
        ${JSON.stringify(sampleData, null, 2)}

        Exemple sortie :
        [
          {"submissionId": "sub1", "questionName": "age", "reason": "haute: Valeur 200 semble aberrante ; vérifier saisie.", "originalValue": 200, "suggestedValue": null},
          {"submissionId": "sub2", "questionName": "region", "reason": "moyenne: Champ vide ; imputation par mode ou contact répondant.", "originalValue": "", "suggestedValue": "Bamako"}
        ]
    `;

    if (!ai) {
        // Mock fallback: Basic suggestions
        const mockSuggestions: DataCleaningSuggestion[] = [];
        sample.forEach(sub => {
            const data = sub.data;
            Object.keys(data).forEach(field => {
                const value = data[field];
                if (value === null || value === undefined || value === '') {
                    mockSuggestions.push({
                        id: uuidv4(),
                        submissionId: sub.id,
                        questionName: field,
                        originalValue: value,
                        suggestedValue: null,
                        reason: 'moyenne: Champ manquant ; vérifier ou imputer.',
                        status: 'pending'
                    });
                } else if (typeof value === 'number' && value > 150) {
                    mockSuggestions.push({
                        id: uuidv4(),
                        submissionId: sub.id,
                        questionName: field,
                        originalValue: value,
                        suggestedValue: Math.floor(value * 0.8), // Simple suggestion
                        reason: 'haute: Valeur numérique aberrante ; valider source.',
                        status: 'pending'
                    });
                }
            });
        });
        aiCache.set(cacheKey, mockSuggestions);
        return mockSuggestions;
    }

    try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            submissionId: { type: Type.STRING },
                            questionName: { type: Type.STRING },
                            reason: { type: Type.STRING },
                            originalValue: { type: Type.OBJECT },
                            suggestedValue: { type: Type.OBJECT }
                        },
                        required: ['submissionId', 'questionName', 'reason', 'originalValue', 'suggestedValue']
                    }
                }
            }
        });
        let suggestions = JSON.parse(response.text);
        if (!Array.isArray(suggestions)) {
            throw new Error('Réponse non-array');
        }
        // Map to full type
        suggestions = suggestions.map((s: any) => ({
            id: uuidv4(),
            submissionId: s.submissionId,
            questionName: s.questionName,
            originalValue: s.originalValue,
            suggestedValue: s.suggestedValue,
            reason: s.reason,
            status: 'pending' as const
        }));
        aiCache.set(cacheKey, suggestions);
        return suggestions;
    } catch (e) {
        console.error('Erreur génération suggestions nettoyage:', e);
        aiCache.set(cacheKey, []);
        return [];
    }
};
