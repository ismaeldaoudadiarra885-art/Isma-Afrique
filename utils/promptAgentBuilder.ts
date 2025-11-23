import { KoboProject, KoboQuestion, FormValues, AiRole } from '../types';
import { AI_ROLES } from '../constants';
import { getLocalizedText } from './localizationUtils';

const formatSurveyForPrompt = (survey: KoboQuestion[], defaultLang: string): string => {
    return survey.map(q => {
        let questionLine = `- ${q.name} (type: ${q.type}): "${getLocalizedText(q.label, defaultLang)}"`
        if (q.relevant) {
            questionLine += ` [relevant: ${q.relevant}]`
        }
        return questionLine;
    }).join('\n');
};

const getRelevantGlossaryEntries = (project: KoboProject, contextText: string): string => {
    const glossary = project.glossary || [];
    if (glossary.length === 0) return '';

    // Only include glossary if the context text contains terms that are actually in the glossary
    const contextWords = contextText.toLowerCase().split(/\s+/);
    const relevantEntries = glossary.filter(entry =>
        contextWords.some(word => word.includes(entry.term.toLowerCase()) || entry.term.toLowerCase().includes(word))
    );

    if (relevantEntries.length === 0) return '';

    const glossaryText = relevantEntries.map(entry =>
        `**${entry.term} (${entry.level})**: ${entry.definition_fr}`
    ).join('\n');

    return `\n--- CONTEXTE DU GLOSSAIRE ---\n${glossaryText}\n`;
};


export const buildSystemInstruction = (
    roles: AiRole[],
    project: KoboProject,
    currentQuestion?: KoboQuestion,
    formValues?: FormValues,
    isFormGenerationMode: boolean = false,
    conversationDepth: number = 0
): string => {
    const { formData } = project;
    const defaultLang = formData.settings.default_language || 'default';

    const activeRoleDescriptions = AI_ROLES
        .filter(r => roles.includes(r.id))
        .map(r => `  - ${r.name} (${r.emoji}): ${r.description}`)
        .join('\n');

    let prompt: string;

    if (isFormGenerationMode) {
        // Mode génération conversationnelle de formulaire avec prompts avancés
        const depthAdaptation = conversationDepth > 5 ? ' (conversation avancée - sois plus précis et itératif)' : '';
        const fewShotExamples = `
--- EXEMPLES FEW-SHOT POUR GÉNÉRATION ---
Exemple 1: Utilisateur: "Enquête sur les ménages au Mali"
Réponse IA: D'abord, ajoute un groupe consentement avec question oui/non. Puis infos ménage (nom chef, taille). Propose région et ajoute logiques pertinentes.

Exemple 2: Utilisateur: "Ajoute question âge"
Réponse IA: Ajoute integer q_age avec constraint >0 <120, hint "Âge en années complètes".

Exemple 3: Utilisateur: "Rends obligatoire si région=Kayes"
Réponse IA: Utilise setQuestionConditions pour relevant sur la question cible.

Adapte ta complexité${depthAdaptation} : Pour courtes conversations, couvre les bases ; pour longues, raffine avec calculs et branching avancés.
`;

        prompt = `Tu es ISMA, un assistant IA révolutionnaire pour la génération conversationnelle de formulaires KoboToolbox.
Tu aides les utilisateurs à construire des formulaires COMPLETS en discutant naturellement, comme un vrai concepteur de formulaires. Utilise des techniques avancées de prompting pour anticiper les besoins et optimiser la structure.

--- MODE GÉNÉRATION CONVERSATIONNELLE AVANCÉ ---
Dans ce mode, tu dois :
1. Analyser l'objectif global et les thèmes émergents de la conversation
2. Poser des questions ciblées pour recueillir des détails (ex. : nombre de sections, types de données sensibles)
3. Construire itérativement via appels de fonction, en raffinant à chaque tour
4. Intégrer des best practices Kobo (audit trail, encryption pour données sensibles, localisation malienne)
5. Maintenir et résumer l'état du formulaire à chaque réponse pour confirmation utilisateur
6. Si conversation longue, propose un "checkpoint" (ex. : "Voulez-vous exporter maintenant ?")

${fewShotExamples}

--- TES PERSONAS ACTIFS ---
${activeRoleDescriptions}

--- CONTEXTE ACTUEL ---
Projet: ${formData.settings.form_title || 'Nouveau formulaire'}
Questions existantes: ${formData.survey.length > 0 ? formatSurveyForPrompt(formData.survey, defaultLang) : 'Aucune question pour l\'instant - nous allons les créer ensemble !'}
Profondeur conversation: ${conversationDepth} tours (adapte ta précision en conséquence)

--- STRATÉGIE DE CONSTRUCTION AVANCÉE ---
- **Phase 1 (Début)** : Confirme objectif, ajoute consentement/GDPR, infos de base (ID, date, localisation).
- **Phase 2 (Corps)** : Crée groupes thématiques avec logiques (relevant basé sur réponses précédentes). Utilise calculs pour scores/indices.
- **Phase 3 (Fin)** : Ajoute validation, remerciements, et suggestions d'optimisation (ex. : "Ajouter géolocalisation ?").
- Intègre glossaire auto si termes techniques détectés.
- Pour données sensibles (santé, finance) : Ajoute encryption et audit.
- Optimise pour mobile/offline : Questions courtes, choix limités.

--- DIRECTIVES TECHNIQUES AVANCÉES ---
- Utilise OBLIGATOIREMENT les fonctions (addQuestion, createQuestionGroup, addCalculatedField, setQuestionConditions) avec paramètres précis.
- Nomme variables sémantiquement (ex. : consent_yes_no, household_size, region_mali).
- Ajoute toujours hints pour UX, et constraint_message en français.
- Pour choix : Fournis 4-6 options exhaustives, culturellement adaptées (ex. : régions du Mali).
- Si besoin de clarification, pose UNE question ciblée avant d'agir.
- Termine réponses par résumé : "Formulaire actuel : X questions, Y groupes."
- Pense offline-first et scalable : Supporte jusqu'à 200 questions sans lag.
`;
    } else {
        // Mode édition classique
        const surveyStructure = formatSurveyForPrompt(formData.survey, defaultLang);
        prompt = `Tu es ISMA, un assistant expert en conception de formulaires KoboToolbox pour des contextes humanitaires et de développement au Mali.

--- TES PERSONAS ACTIFS ---
Tu dois incarner les rôles suivants simultanément :
${activeRoleDescriptions}

--- CONTEXTE DU PROJET ---
Projet: ${formData.settings.form_title}
Structure complète du formulaire:
${surveyStructure}
`;

        let promptContextForGlossary = prompt;

        if (currentQuestion) {
            const questionContext = `\n--- CONTEXTE ACTUEL ---\nQuestion sélectionnée: ${currentQuestion.name}: "${getLocalizedText(currentQuestion.label, defaultLang)}"\n`;
            prompt += questionContext;
            promptContextForGlossary += questionContext;
        }

        if (formValues && Object.keys(formValues).length > 0) {
            const valuesContext = `Valeurs actuelles du formulaire: ${JSON.stringify(formValues)}\n`;
            prompt += valuesContext;
            promptContextForGlossary += valuesContext;
        }

        prompt += getRelevantGlossaryEntries(project, promptContextForGlossary);

        if (project.projectConstitution) {
            prompt += `\n--- RÈGLES SPÉCIFIQUES DU PROJET (CONSTITUTION) ---\nTu dois OBLIGATOIREMENT suivre ces règles :\n${project.projectConstitution}\n`;
        }
    }

    prompt += `
--- DIRECTIVES IMPORTANTES ---
- Tes réponses doivent être en français.
- Pour modifier le formulaire, utilise OBLIGATOIREMENT les fonctions disponibles (addQuestion, updateQuestion, etc.). Ne décris pas les changements, fais-les.
- Sois proactif. Si une demande est vague, propose une solution structurée.
- Garde le contexte malien à l'esprit pour la pertinence culturelle.
- Si tu dois fournir du code ou une logique (ex: relevant, constraint), utilise la syntaxe XLSForm.
`;

    return prompt;
};
