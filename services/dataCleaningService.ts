import { GoogleGenAI, Type } from '@google/genai';
import { KoboProject, DataCleaningSuggestion } from '../types';
import { v4 as uuidv4 } from 'uuid';
// FIX: Imported getLocalizedText to safely access question labels.
import { getLocalizedText } from '../utils/localizationUtils';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const model = 'gemini-2.5-flash';

export const suggestDataCleaning = async (project: KoboProject): Promise<DataCleaningSuggestion[]> => {
    const { submissions, formData } = project;
    if (submissions.length === 0) return [];

    // Take a sample of up to 50 submissions
    const sample = submissions.slice(-50).map(s => ({ id: s.id, data: s.data }));

    // FIX: Use getLocalizedText to handle LocalizedText union type correctly.
    const defaultLang = formData.settings.default_language || 'default';
    const questionInfo = formData.survey
        .filter(q => q.type === 'text' || q.type === 'integer' || q.type === 'select_one')
        .map(q => `- ${q.name} (${q.type}): ${getLocalizedText(q.label, defaultLang)}`)
        .join('\n');

    const prompt = `
        En tant qu'expert en nettoyage de données d'enquêtes, analyse l'échantillon de soumissions JSON suivant.
        Ton objectif est d'identifier les erreurs potentielles et de suggérer des corrections.
        
        Contexte du formulaire :
        ${questionInfo}
        
        Types d'erreurs à rechercher :
        1.  **Coquilles (typos) communes :** "Bamako" au lieu de "bamako", "femm" au lieu de "femme".
        2.  **Standardisation :** Proposer une casse cohérente (ex: Majuscule en début de mot pour les noms propres).
        3.  **Incohérences logiques simples :** Si tu vois une valeur qui contredit une autre dans la même soumission (ex: âge 5, profession "ingénieur").
        4.  **Valeurs aberrantes (outliers) :** Des valeurs numériques qui semblent extrêmes par rapport aux autres (ex: un âge de 150 ans).

        Pour chaque suggestion, fournis les informations requises dans le schéma JSON. Ne suggère des changements que si tu es très confiant. Il vaut mieux ne rien suggérer que de faire une mauvaise correction.

        Échantillon de données :
        ${JSON.stringify(sample, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            submissionId: { type: Type.STRING },
                            questionName: { type: Type.STRING },
                            originalValue: { type: Type.STRING }, // Simplified for schema
                            suggestedValue: { type: Type.STRING },
                            reason: { type: Type.STRING },
                        },
                        required: ['submissionId', 'questionName', 'originalValue', 'suggestedValue', 'reason'],
                    },
                },
            },
        });

        const suggestions = JSON.parse(response.text);
        
        return suggestions.map((s: any) => ({
            ...s,
            id: uuidv4(),
            status: 'pending',
        })) as DataCleaningSuggestion[];

    } catch (error) {
        console.error("Erreur lors de la suggestion de nettoyage par l'IA:", error);
        throw new Error("L'assistant IA n'a pas pu générer de suggestions.");
    }
};
