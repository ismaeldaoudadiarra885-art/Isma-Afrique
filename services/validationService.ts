import { KoboQuestion, Submission, FormValues } from '../types';

export interface ValidationRule {
    questionName: string;
    type: 'required' | 'constraint' | 'age_minimum' | 'range' | 'pattern';
    expression?: string;
    message: string;
    minAge?: number;
    min?: number;
    max?: number;
    pattern?: string;
}

export interface ValidationError {
    questionName: string;
    message: string;
    severity: 'error' | 'warning';
}

class ValidationService {
    private rules: ValidationRule[] = [];

    setRules(rules: ValidationRule[]) {
        this.rules = rules;
    }

    addRule(rule: ValidationRule) {
        this.rules.push(rule);
    }

    validateField(questionName: string, value: any, survey: KoboQuestion[]): ValidationError[] {
        const errors: ValidationError[] = [];
        const question = survey.find(q => q.name === questionName);

        if (!question) return errors;

        // Required field validation
        if (question.required && (value === null || value === undefined || value === '')) {
            errors.push({
                questionName,
                message: 'Ce champ est obligatoire',
                severity: 'error'
            });
        }

        // Constraint validation
        if (question.constraint && value !== null && value !== undefined && value !== '') {
            try {
                // Simple constraint evaluation (can be enhanced with proper XLSForm constraint parsing)
                const constraint = question.constraint.toLowerCase();
                if (constraint.includes('>=') && typeof value === 'number') {
                    const min = parseFloat(constraint.split('>=')[1]);
                    if (value < min) {
                        errors.push({
                            questionName,
                            message: `La valeur doit être supérieure ou égale à ${min}`,
                            severity: 'error'
                        });
                    }
                }
            } catch (e) {
                console.warn('Constraint validation failed:', e);
            }
        }

        // Custom rules validation
        const fieldRules = this.rules.filter(r => r.questionName === questionName);
        for (const rule of fieldRules) {
            switch (rule.type) {
                case 'age_minimum':
                    if (rule.minAge && typeof value === 'number' && value < rule.minAge) {
                        errors.push({
                            questionName,
                            message: rule.message,
                            severity: 'error'
                        });
                    }
                    break;
                case 'range':
                    if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
                        errors.push({
                            questionName,
                            message: rule.message,
                            severity: 'error'
                        });
                    }
                    if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
                        errors.push({
                            questionName,
                            message: rule.message,
                            severity: 'error'
                        });
                    }
                    break;
                case 'pattern':
                    if (rule.pattern && typeof value === 'string' && !new RegExp(rule.pattern).test(value)) {
                        errors.push({
                            questionName,
                            message: rule.message,
                            severity: 'error'
                        });
                    }
                    break;
            }
        }

        return errors;
    }

    validateSubmission(submission: Submission, survey: KoboQuestion[]): ValidationError[] {
        const errors: ValidationError[] = [];

        for (const question of survey) {
            const value = submission.data[question.name];
            const fieldErrors = this.validateField(question.name, value, survey);
            errors.push(...fieldErrors);
        }

        return errors;
    }

    // Age validation helper for common Malian use cases
    validateAge(value: any, minAge: number = 0): ValidationError | null {
        if (typeof value !== 'number' || value < minAge) {
            return {
                questionName: 'age',
                message: `L'âge doit être d'au moins ${minAge} ans`,
                severity: 'error'
            };
        }
        return null;
    }

    // Phone number validation for Malian numbers
    validateMalianPhone(value: any): ValidationError | null {
        if (typeof value !== 'string') return null;

        const malianPhoneRegex = /^(\+223|00223)?[6-9][0-9]{7}$/;
        if (!malianPhoneRegex.test(value.replace(/\s+/g, ''))) {
            return {
                questionName: 'phone',
                message: 'Numéro de téléphone malien invalide (format: +223XXXXXXXX ou 6XXXXXXXX)',
                severity: 'error'
            };
        }
        return null;
    }
}

export const validationService = new ValidationService();
