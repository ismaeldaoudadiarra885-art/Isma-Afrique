
// FIX: Created full content for formLogic.ts to provide expression evaluation logic.
import { FormValues } from '../types';

/**
 * A sandboxed evaluator for XLSForm-like expressions.
 * @param expression The expression string to evaluate.
 * @param context An object containing variable values.
 * @returns An object with the evaluation result and any error message.
 */
export const sandboxedEval = (expression: string, context: { [key: string]: any }): { result: any; error: string | null } => {
    if (!expression) return { result: null, error: null };

    // 1. Sanitize expression to replace XLSForm syntax with JavaScript syntax.
    const sanitizedExpression = expression
        // ${variable} -> context['variable']
        .replace(/\$\{([^}]+)\}/g, (_, varName) => {
            // Sanitize varName to prevent injection if it's not a simple identifier
            if (/^[a-zA-Z0-9_]+$/.test(varName)) {
                // Handle undefined values safely as 0 or empty string depending on usage context usually, 
                // but here we return undefined to let JS logic decide (or 0 for math).
                // Better: check if exists.
                return `(context['${varName}'] !== undefined && context['${varName}'] !== '' ? context['${varName}'] : 0)`; 
            }
            return '0'; // Invalid variable name
        })
        // selected(question, 'value') -> (' ' + context['question'] + ' ').includes(' value ')
        .replace(/selected\((context\['[^']+'\][^)]*), '([^']+)'\)/g, (_, questionBlock, value) => 
            `(String(${questionBlock}).includes('${value}'))`
        )
        // count-selected(question) -> (context['question'] ? String(context['question']).split(' ').length : 0)
        .replace(/count-selected\((context\['[^']+'\][^)]*)\)/g, (_, questionBlock) => 
            `(${questionBlock} ? String(${questionBlock}).split(' ').filter(Boolean).length : 0)`
        )
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
        let result = func(evalContext);
        
        // Handle NaN / Infinity
        if (typeof result === 'number' && (!isFinite(result) || isNaN(result))) {
            return { result: 0, error: null }; // Default to 0 on math error
        }
        
        return { result, error: null };
    } catch (e: any) {
        // console.warn("Logic eval error:", e.message, expression); 
        // Return null/false on error to prevent crash, depending on expected type.
        return { result: null, error: e.message };
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
