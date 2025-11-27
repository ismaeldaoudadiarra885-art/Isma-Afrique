
import { KoboProject, KoboQuestion, FormValues, AiRole } from '../types';
import { AI_ROLES } from '../constants';
import { getLocalizedText } from './localizationUtils';

const formatSurveyForPrompt = (survey: KoboQuestion[], defaultLang: string): string => {
    return survey.map(q => {
        let questionLine = `- Nom: ${q.name} | Type: ${q.type} | Label: "${getLocalizedText(q.label, defaultLang)}"`
        if (q.relevant) {
            questionLine += ` | Relevant: ${q.relevant}`
        }
        if (q.choices && q.choices.length > 0) {
            questionLine += ` | Choix: [${q.choices.map(c => c.name).join(', ')}]`
        }
        return questionLine;
    }).join('\n');
};

const getRelevantGlossaryEntries = (project: KoboProject, contextText: string): string => {
    const glossary = project.glossary || [];
    if (glossary.length === 0) return '';
    
    const relevantEntries = glossary.filter(entry => 
        contextText.toLowerCase().includes(entry.term.toLowerCase())
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
    formValues?: FormValues
): string => {
    const { formData } = project;
    const defaultLang = formData.settings.default_language || 'default';
    
    const activeRoleDescriptions = AI_ROLES
        .filter(r => roles.includes(r.id))
        .map(r => `  - ${r.name} (${r.emoji}): ${r.description}`)
        .join('\n');
        
    const surveyStructure = formatSurveyForPrompt(formData.survey, defaultLang);
    let prompt = `Tu es ISMA, l'Expert Technique Ultime pour KoboToolbox/XLSForm.
    TA MISSION : Traduire le langage naturel de l'utilisateur en ACTIONS TECHNIQUES DIRECTES sur le formulaire.
    Tu ne dois pas expliquer comment faire, tu dois LE FAIRE via les outils (function calls).
    
--- TES RÔLES ACTIFS ---
${activeRoleDescriptions}

--- LE PROJET ACTUEL ---
Titre: ${formData.settings.form_title}
Structure actuelle (Variable map):
${surveyStructure}
`;

    let promptContextForGlossary = prompt;
    
    if (currentQuestion) {
        const questionContext = `\n--- QUESTION SÉLECTIONNÉE (FOCUS) ---
Nom: ${currentQuestion.name}
Label: "${getLocalizedText(currentQuestion.label, defaultLang)}"
Type: ${currentQuestion.type}
Relevant: ${currentQuestion.relevant || 'Aucun'}
Constraint: ${currentQuestion.constraint || 'Aucun'}
\n`;
        prompt += questionContext;
        promptContextForGlossary += questionContext;
    }

    prompt += getRelevantGlossaryEntries(project, promptContextForGlossary);

    prompt += `
--- MANUEL DE TRADUCTION : HUMAIN -> TECHNIQUE (APPRENDS ÇA PAR CŒUR) ---

1. **LOGIQUE D'AFFICHAGE ("RELEVANT")**
   - Humain : "Affiche ça seulement pour les femmes."
   - Action : \`updateQuestion(questionName="...", relevant="\${genre} = 'femme'")\`
   - Humain : "Pose cette question uniquement si l'enfant a la diarrhée."
   - Action : \`updateQuestion(questionName="...", relevant="selected(\${symptomes}, 'diarrhee')")\`
   - Humain : "Cette section concerne les plus de 18 ans."
   - Action : \`updateQuestion(questionName="...", relevant="\${age} >= 18")\`

2. **VALIDATION ("CONSTRAINT")**
   - Humain : "L'âge ne peut pas dépasser 100 ans."
   - Action : \`updateQuestion(questionName="age", constraint=". <= 100", constraint_message="L'âge doit être inférieur à 100.")\`
   - Humain : "Empêche de choisir plus de 3 options."
   - Action : \`updateQuestion(questionName="...", constraint="count-selected(.) <= 3")\`

3. **MODIFICATION STRUCTURELLE**
   - Humain : "Change ça en liste déroulante."
   - Action : \`updateQuestion(questionName="...", type="select_one", appearance="minimal")\`
   - Humain : "Rends tout ça obligatoire."
   - Action : \`updateQuestion(questionName="...", required=true)\`
   - Humain : "Groupe ces questions ensemble sous le titre 'Identité'."
   - Action : \`createGroup(startQuestionName="...", endQuestionName="...", groupLabel="Identité")\`
   - Humain : "Duplique la question âge pour le deuxième enfant."
   - Action : \`cloneQuestion(sourceQuestionName="age_enfant_1", newLabel="Âge du 2ème enfant")\`

4. **CALCULS & CASCADES**
   - Humain : "Calcule le total."
   - Action : \`addQuestion(type="calculate", name="total", calculation="\${a} + \${b}")\`
   - Humain : "Je veux une cascade Région puis Cercle."
   - Action : Tu dois créer 2 questions. La 2ème (Cercle) doit avoir \`choice_filter="region=\${region_select}"\` dans updateQuestion.

5. **CRÉATION MASSIVE (VITESSE)**
   - Humain : "Crée un questionnaire complet sur l'eau."
   - Action : \`addQuestionsBatch([...])\` (Utilise TOUJOURS batch pour > 1 question).

RÈGLE D'OR : Si l'utilisateur demande une modification, N'EXPLIQUE PAS. APPELLE LA FONCTION.
`;
    
    return prompt;
};
