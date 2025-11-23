// FIX: Created placeholder content for formAnalysisService.ts to resolve module errors.
import { KoboProject } from "../types";
import { getLocalizedText } from '../utils/localizationUtils';

/**
 * Performs a comprehensive quality audit on the form structure.
 * This is a non-AI based check for quick best practices.
 * @param project The Kobo project to analyze.
 * @returns A string containing the audit report in Markdown format.
 */
export const performQualityAudit = async (project: KoboProject): Promise<string> => {
  const reportParts: string[] = [];
  const { survey, settings } = project.formData;
  const lang = settings.default_language || 'fr';

  const questionsWithoutHints = survey.filter(q => !q.hint && !['note', 'begin_group', 'end_group'].includes(q.type));
  if (questionsWithoutHints.length > 0) {
    reportParts.push(`- **Conseil :** ${questionsWithoutHints.length} question(s) n'ont pas de texte d'aide (indice). L'ajout d'indices peut améliorer la qualité des données. (Ex: *${getLocalizedText(questionsWithoutHints[0].label, lang)}*)`);
  }

  const questionsWithoutLabels = survey.filter(q => !getLocalizedText(q.label, lang));
   if (questionsWithoutLabels.length > 0) {
    reportParts.push(`- **Alerte :** ${questionsWithoutLabels.length} question(s) n'ont pas de libellé. (Ex: *${questionsWithoutLabels[0].name}*)`);
  }

  const complexRelevants = survey.filter(q => q.relevant && (q.relevant.includes(' and ') || q.relevant.includes(' or '))).length;
  if (complexRelevants > 2) {
    reportParts.push(`- **Info :** ${complexRelevants} questions ont des logiques de pertinence complexes. Assurez-vous qu'elles sont bien testées.`);
  }
  
  if(reportParts.length === 0) {
      return "✅ L'audit rapide n'a révélé aucun problème évident. Le formulaire semble bien structuré.";
  }

  return `### Rapport d'Audit Qualité du Formulaire\n\n${reportParts.join('\n')}`;
};