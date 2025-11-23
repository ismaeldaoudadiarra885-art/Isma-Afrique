import { getAssistance } from './geminiService';
import { Submission } from '../types';

export interface AISuggestion {
    questionName: string;
    suggestion: string;
    confidence: number;
    type: 'follow_up' | 'validation' | 'improvement';
}

export interface AnomalyDetection {
    submissionId: string;
    questionName: string;
    anomalyType: 'outlier' | 'inconsistent' | 'missing_pattern' | 'duplicate';
    severity: 'low' | 'medium' | 'high';
    description: string;
    suggestedAction: string;
}

export interface TranslationResult {
    originalText: string;
    translatedText: string;
    targetLanguage: string;
    confidence: number;
}

export interface ReportInsights {
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    trends: string[];
    dataQuality: {
        completeness: number;
        accuracy: number;
        consistency: number;
    };
}

class AIService {
    // Suggestions intelligentes basées sur les réponses précédentes
    async getSmartSuggestions(currentSubmission: Submission, allSubmissions: Submission[], survey: any[]): Promise<AISuggestion[]> {
        try {
            const prompt = `Analyse les soumissions suivantes et suggère des questions complémentaires pertinentes pour la soumission actuelle.

Soumissions précédentes (résumé):
${this.summarizeSubmissions(allSubmissions.slice(-10))}

Soumission actuelle:
${JSON.stringify(currentSubmission.data, null, 2)}

Questions du formulaire:
${survey.map(q => `${q.name}: ${q.label?.default || q.name}`).join('\n')}

Fournis des suggestions de questions complémentaires sous forme JSON avec: questionName, suggestion, confidence (0-1), type.`;

            const response = await getAssistance(prompt, [], [], null, null, null);
            const suggestions = this.parseAISuggestions(response.text);

            return suggestions.filter(s => s.confidence > 0.6); // Seulement les suggestions confiantes
        } catch (error) {
            console.error('Erreur lors de la génération de suggestions IA:', error);
            return [];
        }
    }

    // Traduction automatique en langues maliennes
    async translateText(text: string, targetLanguage: 'ff' | 'snk' | 'dgo' | 'bm'): Promise<TranslationResult> {
        try {
            const languageNames = {
                'ff': 'Fulfulde (Peul)',
                'snk': 'Soninké',
                'dgo': 'Dogon',
                'bm': 'Bambara'
            };

            const prompt = `Traduis le texte suivant en ${languageNames[targetLanguage]}.
Si tu ne connais pas cette langue, fournis une translittération phonétique et note-le.

Texte à traduire: "${text}"

Réponds uniquement avec la traduction.`;

            const translatedText = await getAssistance(prompt, [], [], null, null, null);

            return {
                originalText: text,
                translatedText: translatedText.text.trim(),
                targetLanguage,
                confidence: 0.8 // À ajuster basé sur la réponse de l'IA
            };
        } catch (error) {
            console.error('Erreur lors de la traduction:', error);
            return {
                originalText: text,
                translatedText: text, // Retourner le texte original en cas d'erreur
                targetLanguage,
                confidence: 0
            };
        }
    }

    // Analyse prédictive et insights avancés
    async generatePredictiveInsights(submissions: Submission[], survey: any[]): Promise<{
        predictions: string[];
        trends: string[];
        recommendations: string[];
        seasonalPatterns: string[];
    }> {
        try {
            const prompt = `Analyse ces données de collecte et fournis des insights prédictifs:

Données: ${submissions.length} soumissions sur ${Math.ceil((new Date(submissions[submissions.length-1]?.timestamp || Date.now()).getTime() - new Date(submissions[0]?.timestamp || Date.now()).getTime()) / (1000 * 60 * 60 * 24))} jours

Échantillon de données récentes:
${JSON.stringify(submissions.slice(-10), null, 2)}

Fournis:
1. Prédictions sur les tendances futures
2. Patterns saisonniers identifiés
3. Recommandations basées sur les données
4. Tendances émergentes

Réponds en JSON structuré.`;

            const response = await getAssistance(prompt, [], [], null, null, null);
            return this.parsePredictiveInsights(response.text);
        } catch (error) {
            console.error('Erreur lors de la génération d\'insights prédictifs:', error);
            return {
                predictions: [],
                trends: [],
                recommendations: [],
                seasonalPatterns: []
            };
        }
    }

    // Support multilingue avancé avec contexte culturel
    async translateWithContext(text: string, targetLanguage: 'ff' | 'snk' | 'dgo' | 'bm', context?: string): Promise<TranslationResult> {
        try {
            const languageNames = {
                'ff': 'Fulfulde (Peul)',
                'snk': 'Soninké',
                'dgo': 'Dogon',
                'bm': 'Bambara'
            };

            const contextPrompt = context ? `\nContexte culturel: ${context}` : '';

            const prompt = `Traduis le texte suivant en ${languageNames[targetLanguage]} en tenant compte du contexte malien.
Adapte la traduction pour qu'elle soit culturellement appropriée et utilise les termes locaux corrects.

Texte à traduire: "${text}"${contextPrompt}

Fournis une traduction naturelle et culturellement adaptée.`;

            const translatedText = await getAssistance(prompt, [], [], null, null, null);

            return {
                originalText: text,
                translatedText: translatedText.text.trim(),
                targetLanguage,
                confidence: 0.9
            };
        } catch (error) {
            console.error('Erreur lors de la traduction contextuelle:', error);
            return {
                originalText: text,
                translatedText: text,
                targetLanguage,
                confidence: 0
            };
        }
    }

    // Automatisation des workflows
    async generateWorkflowAutomation(submissions: Submission[], survey: any[]): Promise<{
        validationRules: string[];
        exportAutomation: string[];
        collaborationWorkflows: string[];
    }> {
        try {
            const prompt = `Analyse ces données et propose des automatisations de workflow:

Structure du formulaire:
${survey.map(q => `${q.name}: ${q.type}`).join('\n')}

Patterns de données identifiés:
${this.analyzeDataPatterns(submissions)}

Propose:
1. Règles de validation automatique
2. Automatisations d'export
3. Workflows de collaboration

Réponds en JSON structuré.`;

            const response = await getAssistance(prompt, [], [], null, null, null);
            return this.parseWorkflowAutomation(response.text);
        } catch (error) {
            console.error('Erreur lors de la génération d\'automatisation:', error);
            return {
                validationRules: [],
                exportAutomation: [],
                collaborationWorkflows: []
            };
        }
    }

    // Apprentissage continu et adaptation
    async learnFromUsage(userFeedback: string[], projectContext: any): Promise<{
        improvements: string[];
        culturalAdaptations: string[];
        performanceOptimizations: string[];
    }> {
        try {
            const prompt = `Analyse les retours utilisateurs et le contexte du projet pour proposer des améliorations:

Retours utilisateurs:
${userFeedback.slice(-20).join('\n')}

Contexte du projet:
${JSON.stringify(projectContext, null, 2)}

Propose des améliorations dans:
1. Adaptations culturelles
2. Optimisations de performance
3. Améliorations générales

Réponds en JSON structuré.`;

            const response = await getAssistance(prompt, [], [], null, null, null);
            return this.parseLearningInsights(response.text);
        } catch (error) {
            console.error('Erreur lors de l\'apprentissage:', error);
            return {
                improvements: [],
                culturalAdaptations: [],
                performanceOptimizations: []
            };
        }
    }

    // Détection d'anomalies dans les soumissions
    async detectAnomalies(submissions: Submission[], survey: any[]): Promise<AnomalyDetection[]> {
        try {
            const anomalies: AnomalyDetection[] = [];

            // Analyse statistique basique
            const questionStats = this.calculateQuestionStats(submissions, survey);

            for (const submission of submissions) {
                for (const question of survey) {
                    const value = submission.data[question.name];
                    const stat = questionStats[question.name];

                    if (!stat) continue;

                    // Détection d'outliers pour les questions numériques
                    if (typeof value === 'number' && stat.mean !== undefined) {
                        const zScore = Math.abs((value - stat.mean) / stat.std);
                        if (zScore > 3) { // Outlier à 3 écarts-types
                            anomalies.push({
                                submissionId: submission.id,
                                questionName: question.name,
                                anomalyType: 'outlier',
                                severity: zScore > 5 ? 'high' : 'medium',
                                description: `Valeur ${value} est un outlier (moyenne: ${stat.mean.toFixed(2)})`,
                                suggestedAction: 'Vérifier la saisie ou contacter l\'énumérateur'
                            });
                        }
                    }

                    // Détection de valeurs manquantes dans des patterns
                    if (value === null || value === undefined || value === '') {
                        const missingRate = stat.missingCount / submissions.length;
                        if (missingRate < 0.1 && question.required) { // Faible taux de missing global mais valeur manquante
                            anomalies.push({
                                submissionId: submission.id,
                                questionName: question.name,
                                anomalyType: 'missing_pattern',
                                severity: 'medium',
                                description: 'Valeur manquante dans un champ généralement rempli',
                                suggestedAction: 'Demander à l\'énumérateur de compléter'
                            });
                        }
                    }
                }
            }

            // Utiliser l'IA pour détecter des anomalies plus complexes
            const prompt = `Analyse ces soumissions pour détecter des anomalies ou incohérences:

${JSON.stringify(submissions.slice(-20), null, 2)}

Identifie les problèmes potentiels comme:
- Incohérences logiques entre réponses
- Valeurs suspectes
- Patterns inhabituels

Réponds sous forme de liste JSON d'anomalies.`;

            const aiResponse = await getAssistance(prompt, [], [], null, null, null);
            const aiAnomalies = this.parseAnomalies(aiResponse.text);

            return [...anomalies, ...aiAnomalies];
        } catch (error) {
            console.error('Erreur lors de la détection d\'anomalies:', error);
            return [];
        }
    }

    // Génération de rapports avec insights IA
    async generateReportInsights(submissions: Submission[], survey: any[]): Promise<ReportInsights> {
        try {
            const prompt = `Analyse ces données de collecte et fournis un résumé exécutif avec insights:

Données: ${submissions.length} soumissions
Questions: ${survey.length} questions

Échantillon de données:
${JSON.stringify(submissions.slice(0, 5), null, 2)}

Fournis:
1. Résumé général
2. Principales conclusions
3. Recommandations
4. Tendances identifiées
5. Évaluation de la qualité des données (complétude, exactitude, cohérence)

Réponds en JSON structuré.`;

            const response = await getAssistance(prompt, [], [], null, null, null);
            const insights = this.parseReportInsights(response.text);

            // Calculs de qualité des données
            const dataQuality = this.calculateDataQuality(submissions, survey);

            return {
                ...insights,
                dataQuality
            };
        } catch (error) {
            console.error('Erreur lors de la génération d\'insights:', error);
            return {
                summary: 'Erreur lors de l\'analyse IA',
                keyFindings: [],
                recommendations: [],
                trends: [],
                dataQuality: { completeness: 0, accuracy: 0, consistency: 0 }
            };
        }
    }

    // Génération de logique de formulaire avancée
    async generateAdvancedLogic(questionName: string, context: string, survey: any[]): Promise<{
        skipLogic?: string;
        branching?: { condition: string; questions: string[] };
        validation?: { constraint: string; message: string }[];
        calculation?: string;
    }> {
        try {
            const prompt = `Analyse le contexte et génère une logique avancée XLSForm pour la question "${questionName}".

Contexte: ${context}

Questions existantes:
${survey.map(q => `${q.name}: ${q.type} - ${q.label?.default || q.name}`).join('\n')}

Génère une logique appropriée incluant:
1. Logique de saut (skip logic) si applicable
2. Embranchements conditionnels si nécessaire
3. Règles de validation avancées
4. Calculs automatiques si pertinent

Réponds en JSON avec les champs: skipLogic, branching, validation, calculation.
Utilise la syntaxe XLSForm standard.`;

            const response = await getAssistance(prompt, [], [], null, null, null);
            return this.parseAdvancedLogic(response.text);
        } catch (error) {
            console.error('Erreur lors de la génération de logique avancée:', error);
            return {};
        }
    }

    // Optimisation automatique de la logique de formulaire
    async optimizeFormLogic(survey: any[]): Promise<{
        optimizations: string[];
        warnings: string[];
        suggestions: string[];
    }> {
        try {
            const prompt = `Analyse ce formulaire XLSForm et propose des optimisations de logique:

Structure du formulaire:
${survey.map(q => `${q.name}: ${q.type} - relevant: ${q.relevant || 'none'} - constraint: ${q.constraint || 'none'}`).join('\n')}

Identifie:
1. Logiques redondantes ou inefficaces
2. Possibilités d'optimisation des sauts/embranchements
3. Améliorations de validation
4. Suggestions de simplification

Réponds en JSON avec optimizations, warnings, suggestions.`;

            const response = await getAssistance(prompt, [], [], null, null, null);
            return this.parseLogicOptimizations(response.text);
        } catch (error) {
            console.error('Erreur lors de l\'optimisation de logique:', error);
            return { optimizations: [], warnings: [], suggestions: [] };
        }
    }

    // Génération de formules de calcul complexes
    async generateCalculationFormula(requirements: string, availableFields: string[]): Promise<{
        formula: string;
        explanation: string;
        dependencies: string[];
    }> {
        try {
            const prompt = `Génère une formule de calcul XLSForm pour: ${requirements}

Champs disponibles:
${availableFields.join(', ')}

La formule doit:
- Utiliser la syntaxe XLSForm standard
- Être robuste et gérer les valeurs manquantes
- Inclure une explication claire
- Lister les dépendances

Réponds en JSON avec formula, explanation, dependencies.`;

            const response = await getAssistance(prompt, [], [], null, null, null);
            return this.parseCalculationFormula(response.text);
        } catch (error) {
            console.error('Erreur lors de la génération de formule:', error);
            return { formula: '', explanation: 'Erreur de génération', dependencies: [] };
        }
    }

    // Validation intelligente des expressions logiques
    async validateLogicExpression(expression: string, context: string): Promise<{
        isValid: boolean;
        errors: string[];
        suggestions: string[];
        optimized: string;
    }> {
        try {
            const prompt = `Valide et optimise cette expression logique XLSForm:

Expression: ${expression}
Contexte: ${context}

Vérifie:
1. Syntaxe correcte
2. Variables définies
3. Logique cohérente
4. Optimisations possibles

Réponds en JSON avec isValid, errors, suggestions, optimized.`;

            const response = await getAssistance(prompt, [], [], null, null, null);
            return this.parseLogicValidation(response.text);
        } catch (error) {
            console.error('Erreur lors de la validation logique:', error);
            return {
                isValid: false,
                errors: ['Erreur de validation'],
                suggestions: [],
                optimized: expression
            };
        }
    }

    // Méthodes utilitaires privées
    private summarizeSubmissions(submissions: Submission[]): string {
        if (submissions.length === 0) return 'Aucune soumission précédente';

        const summary: { [key: string]: any } = {};
        submissions.forEach(sub => {
            Object.entries(sub.data).forEach(([key, value]) => {
                if (!summary[key]) summary[key] = [];
                if (summary[key].length < 5) { // Limiter à 5 exemples par question
                    summary[key].push(value);
                }
            });
        });

        return Object.entries(summary)
            .map(([question, values]) => `${question}: ${values.slice(0, 3).join(', ')}${values.length > 3 ? '...' : ''}`)
            .join('\n');
    }

    private parseAdvancedLogic(response: string): {
        skipLogic?: string;
        branching?: { condition: string; questions: string[] };
        validation?: { constraint: string; message: string }[];
        calculation?: string;
    } {
        try {
            const parsed = JSON.parse(response);
            return {
                skipLogic: parsed.skipLogic,
                branching: parsed.branching,
                validation: Array.isArray(parsed.validation) ? parsed.validation : [],
                calculation: parsed.calculation
            };
        } catch (e) {
            return {};
        }
    }

    private parseLogicOptimizations(response: string): {
        optimizations: string[];
        warnings: string[];
        suggestions: string[];
    } {
        try {
            const parsed = JSON.parse(response);
            return {
                optimizations: Array.isArray(parsed.optimizations) ? parsed.optimizations : [],
                warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
                suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : []
            };
        } catch (e) {
            return { optimizations: [], warnings: [], suggestions: [] };
        }
    }

    private parseCalculationFormula(response: string): {
        formula: string;
        explanation: string;
        dependencies: string[];
    } {
        try {
            const parsed = JSON.parse(response);
            return {
                formula: parsed.formula || '',
                explanation: parsed.explanation || '',
                dependencies: Array.isArray(parsed.dependencies) ? parsed.dependencies : []
            };
        } catch (e) {
            return { formula: '', explanation: 'Erreur de parsing', dependencies: [] };
        }
    }

    private parseLogicValidation(response: string): {
        isValid: boolean;
        errors: string[];
        suggestions: string[];
        optimized: string;
    } {
        try {
            const parsed = JSON.parse(response);
            return {
                isValid: parsed.isValid || false,
                errors: Array.isArray(parsed.errors) ? parsed.errors : [],
                suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
                optimized: parsed.optimized || ''
            };
        } catch (e) {
            return {
                isValid: false,
                errors: ['Erreur de parsing'],
                suggestions: [],
                optimized: ''
            };
        }
    }

    private parsePredictiveInsights(response: string): {
        predictions: string[];
        trends: string[];
        recommendations: string[];
        seasonalPatterns: string[];
    } {
        try {
            const parsed = JSON.parse(response);
            return {
                predictions: Array.isArray(parsed.predictions) ? parsed.predictions : [],
                trends: Array.isArray(parsed.trends) ? parsed.trends : [],
                recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
                seasonalPatterns: Array.isArray(parsed.seasonalPatterns) ? parsed.seasonalPatterns : []
            };
        } catch (e) {
            return {
                predictions: [],
                trends: [],
                recommendations: [],
                seasonalPatterns: []
            };
        }
    }

    private analyzeDataPatterns(submissions: Submission[]): string {
        if (submissions.length === 0) return 'Aucune donnée disponible';

        const patterns: string[] = [];

        // Analyse basique des patterns
        const questionNames = Object.keys(submissions[0]?.data || {});
        questionNames.forEach(qName => {
            const values = submissions.map(s => s.data[qName]).filter(v => v !== null && v !== undefined);
            const uniqueValues = [...new Set(values)];

            if (uniqueValues.length === 1) {
                patterns.push(`${qName}: valeur constante (${uniqueValues[0]})`);
            } else if (uniqueValues.length < 5) {
                patterns.push(`${qName}: valeurs discrètes (${uniqueValues.length} valeurs)`);
            } else {
                patterns.push(`${qName}: valeurs continues ou nombreuses`);
            }
        });

        return patterns.join('\n');
    }

    private parseWorkflowAutomation(response: string): {
        validationRules: string[];
        exportAutomation: string[];
        collaborationWorkflows: string[];
    } {
        try {
            const parsed = JSON.parse(response);
            return {
                validationRules: Array.isArray(parsed.validationRules) ? parsed.validationRules : [],
                exportAutomation: Array.isArray(parsed.exportAutomation) ? parsed.exportAutomation : [],
                collaborationWorkflows: Array.isArray(parsed.collaborationWorkflows) ? parsed.collaborationWorkflows : []
            };
        } catch (e) {
            return {
                validationRules: [],
                exportAutomation: [],
                collaborationWorkflows: []
            };
        }
    }

    private parseLearningInsights(response: string): {
        improvements: string[];
        culturalAdaptations: string[];
        performanceOptimizations: string[];
    } {
        try {
            const parsed = JSON.parse(response);
            return {
                improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
                culturalAdaptations: Array.isArray(parsed.culturalAdaptations) ? parsed.culturalAdaptations : [],
                performanceOptimizations: Array.isArray(parsed.performanceOptimizations) ? parsed.performanceOptimizations : []
            };
        } catch (e) {
            return {
                improvements: [],
                culturalAdaptations: [],
                performanceOptimizations: []
            };
        }
    }

    private parseAISuggestions(response: string): AISuggestion[] {
        try {
            // Essayer de parser comme JSON
            const parsed = JSON.parse(response);
            if (Array.isArray(parsed)) {
                return parsed.map(item => ({
                    questionName: item.questionName || item.question_name,
                    suggestion: item.suggestion,
                    confidence: item.confidence || 0.5,
                    type: item.type || 'follow_up'
                }));
            }
        } catch (e) {
            // Parser comme texte si JSON échoue
            const suggestions: AISuggestion[] = [];
            const lines = response.split('\n');
            lines.forEach(line => {
                if (line.includes('suggestion') || line.includes('Suggestion')) {
                    suggestions.push({
                        questionName: 'general',
                        suggestion: line.trim(),
                        confidence: 0.7,
                        type: 'follow_up'
                    });
                }
            });
            return suggestions;
        }
        return [];
    }

    private parseAnomalies(response: string): AnomalyDetection[] {
        try {
            const parsed = JSON.parse(response);
            if (Array.isArray(parsed)) {
                return parsed.map(item => ({
                    submissionId: item.submissionId || item.submission_id,
                    questionName: item.questionName || item.question_name,
                    anomalyType: item.anomalyType || item.type || 'inconsistent',
                    severity: item.severity || 'medium',
                    description: item.description,
                    suggestedAction: item.suggestedAction || item.action || 'Vérifier'
                }));
            }
        } catch (e) {
            return [];
        }
        return [];
    }

    private parseReportInsights(response: string): Omit<ReportInsights, 'dataQuality'> {
        try {
            const parsed = JSON.parse(response);
            return {
                summary: parsed.summary || 'Analyse non disponible',
                keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
                recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
                trends: Array.isArray(parsed.trends) ? parsed.trends : []
            };
        } catch (e) {
            return {
                summary: response.substring(0, 200) + '...',
                keyFindings: [],
                recommendations: [],
                trends: []
            };
        }
    }

    private calculateQuestionStats(submissions: Submission[], survey: any[]) {
        const stats: { [key: string]: any } = {};

        survey.forEach(question => {
            const values = submissions
                .map(sub => sub.data[question.name])
                .filter(val => val !== null && val !== undefined && val !== '');

            const numericValues = values.filter(val => typeof val === 'number');

            stats[question.name] = {
                count: values.length,
                missingCount: submissions.length - values.length,
                mean: numericValues.length > 0 ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length : undefined,
                std: numericValues.length > 1 ? Math.sqrt(
                    numericValues.reduce((sum, val) => sum + Math.pow(val - (numericValues.reduce((a, b) => a + b, 0) / numericValues.length), 2), 0) / numericValues.length
                ) : undefined
            };
        });

        return stats;
    }

    private calculateDataQuality(submissions: Submission[], survey: any[]) {
        let totalFields = 0;
        let filledFields = 0;
        let consistentFields = 0;

        submissions.forEach(submission => {
            survey.forEach(question => {
                totalFields++;
                const value = submission.data[question.name];

                if (value !== null && value !== undefined && value !== '') {
                    filledFields++;
                }

                // Vérification basique de cohérence (à améliorer)
                if (question.constraint) {
                    // Pour l'instant, considérer comme cohérent si rempli
                    if (value) consistentFields++;
                } else {
                    if (value) consistentFields++;
                }
            });
        });

        return {
            completeness: totalFields > 0 ? filledFields / totalFields : 0,
            accuracy: 0.8, // À implémenter avec validation plus poussée
            consistency: totalFields > 0 ? consistentFields / totalFields : 0
        };
    }
}

export const aiService = new AIService();
