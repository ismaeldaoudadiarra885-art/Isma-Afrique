// FIX: Created full content for formLogic.ts to provide expression evaluation logic.
import { FormValues } from '../types';

/**
 * A sandboxed evaluator for XLSForm-like expressions.
 * @param expression The expression string to evaluate.
 * @param context An object containing variable values.
 * @returns An object with the evaluation result and any error message.
 */
const sandboxedEval = (expression: string, context: { [key: string]: any }): { result: any; error: string | null } => {
    // 1. Sanitize expression to replace XLSForm syntax with JavaScript syntax.
    const sanitizedExpression = expression
        // ${variable} -> context['variable']
        .replace(/\$\{([^}]+)\}/g, (_, varName) => {
            // Sanitize varName to prevent injection if it's not a simple identifier
            if (/^[a-zA-Z0-9_]+$/.test(varName)) {
                return `context['${varName}']`;
            }
            return 'undefined'; // Invalid variable name
        })
        // selected(question, 'value') -> (' ' + context['question'] + ' ').includes(' value ')
        .replace(/selected\((context\['[^']+'\]), '([^']+)'\)/g, (_, question, value) =>
            `(typeof ${question} === 'string' && (' ' + ${question} + ' ').includes(' ${value} '))`
        )
        // selected(${variable}, 'value') -> (' ' + context['variable'] + ' ').includes(' value ')
        .replace(/selected\(\$\{([^}]+)\}, '([^']+)'\)/g, (_, varName, value) => {
            if (/^[a-zA-Z0-9_]+$/.test(varName)) {
                return `(typeof context['${varName}'] === 'string' && (' ' + context['${varName}'] + ' ').includes(' ${value} '))`;
            }
            return 'false';
        })
        // count-selected(question) -> (context['question'] ? String(context['question']).split(' ').length : 0)
        .replace(/count-selected\((context\['[^']+'\])\)/g, (_, question) =>
            `(${question} ? String(${question}).split(' ').filter(Boolean).length : 0)`
        )
        // Support for 'and' and 'or' operators
        .replace(/\band\b/g, '&&')
        .replace(/\bor\b/g, '||')
        // . for current value -> context.currentValue
        // A regex with negative lookbehind to avoid replacing decimal points.
        .replace(/(?<![0-9])\.(?![0-9])/g, 'context.currentValue')
        // string-length(.) -> String(context.currentValue).length
        .replace(/string-length\((context\.currentValue)\)/g, 'String($1).length');

    // 2. Create a context for the evaluation.
    const evalContext = { ...context };

    try {
        // 3. Use the Function constructor for a safer-than-eval execution environment.
        const func = new Function('context', `return ${sanitizedExpression};`);
        const result = func(evalContext);
        return { result, error: null };
    } catch (e: any) {
        return { result: false, error: e.message };
    }
};

/**
 * Evaluates the 'relevant' logic for a question.
 * @param relevant The relevant expression string.
 * @param values The current form values.
 * @returns An object with a boolean result and any error message.
 */
export const evaluateRelevant = (
    relevant: string | undefined,
    values: FormValues
): { result: boolean; error: string | null } => {
    if (!relevant || relevant.trim() === '') {
        return { result: true, error: null };
    }

    const context = { ...values };
    const { result, error } = sandboxedEval(relevant, context);

    return { result: !!result, error };
};

/**
 * Validates a value against a 'constraint' expression.
 * @param constraint The constraint expression string.
 * @param value The current value of the question being validated.
 * @param values The current form values.
 * @returns An object with a boolean indicating validity and any error message.
 */
export const validateConstraint = (
    constraint: string | undefined,
    value: any,
    values: FormValues
): { isValid: boolean; error: string | null } => {
    // An empty constraint or an empty value is always considered valid.
    if (!constraint || constraint.trim() === '' || value === undefined || value === null || value === '') {
        return { isValid: true, error: null };
    }

    const context = { ...values, currentValue: value };
    const { result, error } = sandboxedEval(constraint, context);

    return { isValid: !!result, error };
};

/**
 * Evaluates choice_filter for cascading selects.
 * @param choiceFilter The choice_filter expression string.
 * @param values The current form values.
 * @param listName The list_name for choices.
 * @returns Filtered choices based on the filter.
 */
export const evaluateChoiceFilter = (
    choiceFilter: string | undefined,
    values: FormValues,
    allChoices: any[]
): any[] => {
    if (!choiceFilter || !allChoices.length) {
        return allChoices;
    }

    const context = { ...values };
    const { result, error } = sandboxedEval(choiceFilter, context);

    if (error) {
        console.warn('Choice filter evaluation error:', error);
        return allChoices; // Fallback to all choices
    }

    // Assuming result is a string like 'parent_value', filter choices where relevant column matches
    const filterValue = result;
    return allChoices.filter(choice => choice.relevant?.includes(filterValue) || true);
};

/**
 * Validates common constraints for specific question types.
 * @param type The question type.
 * @param value The value to validate.
 * @param appearance Optional appearance hint (e.g., 'email').
 * @returns An object with a boolean indicating validity and any error message.
 */
export const validateCommonConstraints = (
    type: string,
    value: any,
    appearance?: string
): { isValid: boolean; error: string | null } => {
    if (value === undefined || value === null || value === '') {
        return { isValid: true, error: null };
    }

    // Email validation if appearance includes 'email' or type is text with email hint
    if ((type === 'text' && appearance?.includes('email')) || appearance === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return { isValid: false, error: 'Format email invalide' };
        }
    }

    switch (type) {
        case 'integer':
            const intValue = parseInt(value, 10);
            if (isNaN(intValue)) {
                return { isValid: false, error: 'Doit être un nombre entier' };
            }
            if (intValue < 0) {
                return { isValid: false, error: 'Ne peut pas être négatif' };
            }
            break;

        case 'decimal':
            const floatValue = parseFloat(value);
            if (isNaN(floatValue)) {
                return { isValid: false, error: 'Doit être un nombre décimal' };
            }
            if (floatValue < 0) {
                return { isValid: false, error: 'Ne peut pas être négatif' };
            }
            break;

        case 'date':
            // Check for YYYY-MM-DD format
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(value)) {
                return { isValid: false, error: 'Format de date invalide (utilisez YYYY-MM-DD)' };
            }
            const dateValue = new Date(value);
            if (isNaN(dateValue.getTime())) {
                return { isValid: false, error: 'Date invalide' };
            }
            break;

        case 'geopoint':
            const coords = value.split(' ').filter((c: string) => c.trim() !== '');
            if (coords.length !== 2) {
                return { isValid: false, error: 'Doit contenir latitude et longitude' };
            }
            const lat = parseFloat(coords[0]);
            const lng = parseFloat(coords[1]);
            if (isNaN(lat) || isNaN(lng)) {
                return { isValid: false, error: 'Coordonnées invalides' };
            }
            if (lat < -90 || lat > 90) {
                return { isValid: false, error: 'Latitude doit être entre -90 et 90' };
            }
            if (lng < -180 || lng > 180) {
                return { isValid: false, error: 'Longitude doit être entre -180 et 180' };
            }
            break;

        default:
            break;
    }

    return { isValid: true, error: null };
};
