// FIX: Corrected import paths
import { KoboProject } from '../types';
import { getAssistance } from '../services/geminiService';

/**
 * Uses AI to synthesize a summary from a list of text responses.
 * @param responses An array of strings representing answers to a single question.
 * @param questionLabel The label of the question being synthesized.
 * @param project The active Kobo project, for context.
 * @returns A promise that resolves to the AI-generated summary.
 */
export const synthesizeResponse = async (
    responses: string[],
    questionLabel: string,
    project: KoboProject
): Promise<string> => {
    if (responses.length === 0) {
        return "Aucune réponse à synthétiser.";
    }

    const prompt = `
        En tant qu'analyste de données qualitatif, synthétise les réponses suivantes à la question de formulaire: "${questionLabel}".
        Identifie les thèmes principaux, les opinions récurrentes et les points de vue divergents.
        Produis un résumé concis en 3 à 5 points clés.

        Réponses à analyser:
        ${responses.map(r => `- "${r}"`).join('\n')}
    `;

    try {
        const response = await getAssistance(
            prompt,
            [], // No chat history needed for this one-off task
            ['analyste_donnees'],
            project
        );
        return response.text ? response.text.trim() : "L'IA n'a pas pu générer de synthèse.";
    } catch (error) {
        console.error("Erreur durant la synthèse des réponses:", error);
        return "Une erreur est survenue lors de la synthèse des réponses.";
    }
};