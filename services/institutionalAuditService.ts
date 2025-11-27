
import { KoboProject } from "../types";
import { getLocalizedText } from "../utils/localizationUtils";

/**
 * Standards institutionnels définis en dur.
 * Idéalement, ceci viendrait d'un fichier de configuration externe.
 */
const institutionalStandards = {
    // Regex pour snake_case (lettres minuscules, chiffres, underscores, commence par lettre)
    variableNamingRegex: /^[a-z][a-z0-9_]*$/,
    maxQuestionNameLength: 30, // Kobo a une limite, mais 30 est une bonne pratique
    requiredPrefixes: {
        'begin_group': 'grp_',
        'geopoint': 'gps_'
    } as Record<string, string>,
};

/**
 * Audits a form against predefined institutional standards.
 * @param project The Kobo project to audit.
 * @returns An array of strings describing any violations found.
 */
export const performInstitutionalAudit = async (project: KoboProject): Promise<string[]> => {
    const violations: string[] = [];
    const { survey, settings } = project.formData;
    const defaultLang = settings.default_language || 'default';

    survey.forEach(q => {
        // 1. Vérification Naming Convention (snake_case)
        if (!institutionalStandards.variableNamingRegex.test(q.name)) {
            violations.push(`Question "${q.name}" : Le nom de variable ne respecte pas le format 'snake_case' (minuscules et underscores uniquement).`);
        }

        // 2. Vérification Longueur Variable
        if (q.name.length > institutionalStandards.maxQuestionNameLength) {
            violations.push(`Question "${q.name}" : Le nom est trop long (${q.name.length} cars). Limite recommandée : ${institutionalStandards.maxQuestionNameLength}.`);
        }

        // 3. Vérification Préfixes
        const requiredPrefix = institutionalStandards.requiredPrefixes[q.type];
        if (requiredPrefix && !q.name.startsWith(requiredPrefix)) {
            violations.push(`Type '${q.type}' ("${q.name}") : Doit commencer par le préfixe '${requiredPrefix}'.`);
        }

        // 4. Vérification Libellés
        const labelText = getLocalizedText(q.label, defaultLang);
        if (!labelText || labelText.trim() === '') {
            violations.push(`Question "${q.name}" : Le libellé est vide pour la langue par défaut.`);
        }

        // 5. Vérification Hints pour types complexes
        if ((q.type === 'calculate' || q.type === 'geopoint') && (!q.hint)) {
             // Calculate n'a pas besoin de hint, mais Geopoint souvent oui pour préciser la précision
             if(q.type === 'geopoint') {
                 violations.push(`Question GPS "${q.name}" : Un indice (hint) est recommandé pour instruire l'enquêteur (ex: "Attendre précision < 5m").`);
             }
        }
    });

    // Check Settings
    if (!settings.form_id || !institutionalStandards.variableNamingRegex.test(settings.form_id)) {
        violations.push(`Paramètres : L'ID du formulaire (form_id) doit être en snake_case.`);
    }

    return violations;
};
