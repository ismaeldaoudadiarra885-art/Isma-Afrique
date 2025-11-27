
import { GoogleGenerativeAI } from '@google/generative-ai';
import { KoboProject, KoboQuestion, FormValues, AiRole, Submission, SimulationProfile, KoboFormData, LocalizedText } from '../types';
import { buildSystemInstruction } from '../utils/promptAgentBuilder';
import { getFormAgentFunctions } from '../utils/formAgentFunctions';
import { v4 as uuidv4 } from 'uuid';
import { getLocalizedText } from "../utils/localizationUtils";

// FIX: Safely access API Key to prevent 'process is not defined' crash in pure browser environments
const getApiKey = () => {
    try {
        return process.env.API_KEY;
    } catch (e) {
        // Fallback for environments where process is not defined (rare in modern bundlers but possible in raw ESM)
        // In a real scenario without a bundler, this would be injected via window.env or similar.
        // For this demo/codebase constraint, we return undefined if process fails.
        console.warn("Failed to access process.env.API_KEY");
        return undefined;
    }
};

const apiKey = getApiKey();
const genAI = new GoogleGenerativeAI(apiKey || '');

// STRATÉGIE DE VITESSE : 
// On utilise 'gemini-2.5-flash' pour 90% des tâches (Import, Chat réactif) pour l'effet "Tic au tac".
// On réserve 'gemini-2.5-pro' uniquement pour l'analyse profonde de données ou l'audit complexe.
const model = 'gemini-2.5-flash'; 
const proModel = 'gemini-2.5-pro'; // Gardé pour les tâches lourdes (Audit, Analyse Data)

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

// Helper pour nettoyer le JSON brut retourné par l'IA (enlève les ```json ... ```)
const cleanAIJson = (text: string): string => {
    if (!text) return "{}";
    // Enlève les balises markdown ```json et ```
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '');
    return cleaned.trim();
};


export const getAssistance = async (
    userInput: string,
    chatHistory: any[],
    roles: AiRole[],
    project: KoboProject,
    currentQuestion?: KoboQuestion,
    formValues?: FormValues,
    onRetry?: () => void
): Promise<{ text: string; functionCalls: any[] | null; }> => {
    const systemInstruction = buildSystemInstruction(roles, project, currentQuestion, formValues);
    const tools = [{ functionDeclarations: getFormAgentFunctions() }] as any;
    
    // Pour le chat interactif, Flash est beaucoup plus réactif.
    const modelToUse = model; 

    const contents: any[] = [...chatHistory, { role: 'user', parts: [{ text: userInput }] }];

    const fn = async () => {
        const modelInstance = genAI.getGenerativeModel({ model: modelToUse });
        const response = await modelInstance.generateContent({
            contents: contents,
            generationConfig: {
                temperature: 0.4,
            },
            systemInstruction,
            tools,
        });
        return response;
    };

    const response = onRetry ? await withRetry(fn, onRetry) : await fn();

    return {
        text: response.response.text(),
        functionCalls: response.response.functionCalls() || null,
    };
};

const formGenerationSchema = {
    type: "array",
    items: {
        type: "object",
        properties: {
            type: { type: "string", description: "Type XLSForm (text, integer, select_one, select_multiple, begin_group, end_group, begin_repeat, end_repeat, geopoint, date, signature, audio)." },
            name: { type: "string", description: "snake_case unique." },
            label: { type: "string", description: "Libellé." },
            hint: { type: "string", description: "Indice." },
            required: { type: "boolean" },
            relevant: { type: "string", description: "Logique XLSForm (ex: ${q1} = 'oui')." },
            choices: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        label: { type: "string" },
                    },
                },
            },
        },
        required: ["type", "name", "label"],
    },
};

export const structureFormFromText = async (text: string): Promise<Partial<KoboQuestion>[]> => {
    // Utilisation du modèle FLASH pour une vitesse maximale ("Tic au tac")
    // Le prompt est optimisé pour être direct.
    const prompt = `
        Transforme ce texte (issu d'un fichier Word) en structure de formulaire JSON pour KoboToolbox.
        - Détecte les questions, les choix multiples.
        - Détecte les sections (begin_group / end_group).
        - **IMPORTANT:** Si tu vois une liste répétitive (ex: "Pour chaque enfant", "Liste des membres"), utilise 'begin_repeat' et 'end_repeat' autour des questions concernées.
        - Déduis les types (text, integer, select_one, date, geopoint, signature, audio).
        - Pour les listes à choix, extrais les options.
        - Sois RAPIDE et PRÉCIS.

        Texte:
        ---
        ${text.substring(0, 30000)} 
        ---
        (Texte tronqué si trop long pour la vitesse)
    `;

    try {
        const modelInstance = genAI.getGenerativeModel({ model: model });
        const response = await modelInstance.generateContent({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: formGenerationSchema
            }
        });

        const cleanedText = cleanAIJson(response.response.text() || "[]");
        const structuredJSON = JSON.parse(cleanedText);
        
        return structuredJSON.map((q: any) => ({
            ...q,
            label: { fr: q.label },
            hint: q.hint ? { fr: q.hint } : undefined,
            choices: q.choices?.map((c: any) => ({ ...c, label: { fr: c.label } }))
        }));
    } catch (e) {
        console.error("Erreur structuration IA:", e);
        throw new Error("L'IA n'a pas pu structurer le document. Le format de réponse n'était pas valide.");
    }
};

export const generateFormFromPrompt = async (prompt: string, projectName: string): Promise<KoboFormData> => {
     const generationPrompt = `
        Génère un formulaire complet basé sur : "${prompt}".
        Inclure : 
        - Logique pertinente (relevant).
        - Types variés : 'signature' pour consentement, 'audio' pour témoignages.
        - Groupes répétitifs ('begin_repeat' / 'end_repeat') si on demande de lister des items (membres, biens, etc.).
        Sortie JSON stricte.
    `;

     try {
        const modelInstance = genAI.getGenerativeModel({ model: model });
        const response = await modelInstance.generateContent({
            contents: generationPrompt,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: formGenerationSchema
            }
        });

        const cleanedText = cleanAIJson(response.response.text() || "[]");
        const surveyData = JSON.parse(cleanedText);

        const survey = surveyData.map((q: any): KoboQuestion => ({
            ...q,
            uid: uuidv4(),
            label: { fr: q.label },
            hint: q.hint ? { fr: q.hint } : undefined,
            choices: q.choices?.map((c: any) => ({ ...c, uid: uuidv4(), label: { fr: c.label } }))
        }));
        
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
        console.error("Erreur génération IA:", e);
        throw new Error("L'IA n'a pas pu générer le formulaire. Réessayez.");
    }
};

// L'audit de qualité demande plus de réflexion, on garde le modèle Pro si disponible, ou Flash avec un budget de pensée (si dispo).
export const getAIFormQualityAudit = async (project: KoboProject): Promise<string> => {
    const { survey, settings } = project.formData;
    const formStructure = survey.map(q => `- ${q.name} (${q.type}): ${getLocalizedText(q.label, settings.default_language)} ${q.relevant ? `[Relevant: ${q.relevant}]` : ''}`).join('\n');
    
    const prompt = `
        Audit expert KoboToolbox. Analyse cette structure.
        Cherche : 
        1. Logiques manquantes (ex: demander "Combien?" sans vérifier "Avez-vous?").
        2. Types inappropriés.
        3. Manque de contraintes (âge < 0).
        
        Structure:
        ${formStructure}
    `;

    const modelInstance = genAI.getGenerativeModel({ model: proModel });
    const response = await modelInstance.generateContent(prompt);
    return response.response.text() || "Pas de réponse d'audit.";
};

export const getAIDataQualityAudit = async (submissions: Submission[]): Promise<string> => {
    const sample = submissions.slice(-20).map(s => s.data);
    const prompt = `
        Analyse ces données d'enquête (JSON). Trouve les anomalies, outliers, et incohérences.
        Données:
        ${JSON.stringify(sample, null, 2)}
    `;
    const modelInstance = genAI.getGenerativeModel({ model: proModel });
    const response = await modelInstance.generateContent({ contents: [{ parts: [{ text: prompt }] }] });
    return response.response.text() || "Pas de réponse d'analyse.";
};

export const getDataAnalysisInsight = async (userInput: string, project: KoboProject): Promise<string> => {
    const { submissions, formData } = project;
    const sample = submissions.slice(-50).map(s => s.data);
    const questionInfo = formData.survey.map(q => `${q.name}: ${getLocalizedText(q.label, formData.settings.default_language)}`).join('\n');

    const prompt = `
        Analyste de données.
        Questions: ${questionInfo}
        Données: ${JSON.stringify(sample)}
        Question utilisateur: "${userInput}"
    `;

    const modelInstance = genAI.getGenerativeModel({ model: proModel });
    const response = await modelInstance.generateContent(prompt);
    return response.response.text() || "Je n'ai pas pu analyser les données.";
};

export const simulateAiResponse = async (
    project: KoboProject,
    profile: SimulationProfile,
    currentValues: FormValues,
    nextQuestion: KoboQuestion
): Promise<{ answer: string | number | string[] }> => {
    // Simulation rapide avec Flash
    const { survey, settings } = project.formData;
    const defaultLang = settings.default_language;
    
    // Contexte réduit pour la vitesse
    const prompt = `
        Persona: ${profile.persona}
        Question: "${getLocalizedText(nextQuestion.label, defaultLang)}"
        Type: ${nextQuestion.type}
        ${nextQuestion.choices ? `Choix: ${nextQuestion.choices.map(c => c.name).join(', ')}` : ''}
        
        Réponds en JSON strict { "answer": ... }.
        Si select_one/multiple, renvoie le 'name'.
        Si type 'signature' ou 'image' ou 'audio' ou 'begin_repeat', renvoie une chaine vide "" (simulation impossible pour média).
    `;
    
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    answer: { type: Type.STRING } // On simplifie en string pour le parsing, on adaptera ensuite
                },
                required: ["answer"]
            }
        }
    });

    const cleanedText = cleanAIJson(response.text || "{}");
    return JSON.parse(cleanedText);
};
