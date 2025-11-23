import React from 'react';
// FIX: Corrected import path
import { FormValues } from '../types';
import { evaluateRelevant } from '../utils/formLogic';

// A simple parser to tokenize the expression
const tokenize = (expression: string) => {
  const regex = /(\$\{[^}]+\}|selected\((?:[^()]*|\((?:[^()]*|\([^()]*\))*\))*\)|[a-zA-Z0-9_.]+|'[^']+'|>=|<=|==|!=|>|<|&&|\|\||[()])/g;
  return expression.match(regex) || [];
};


const evaluateToken = (token: string, values: FormValues): any => {
    if (token.startsWith('${')) {
        const varName = token.substring(2, token.length - 1);
        return values[varName] !== undefined ? values[varName] : 'undefined';
    }
    if (token.startsWith("'")) {
        return token.substring(1, token.length - 1);
    }
    if (!isNaN(Number(token))) {
        return Number(token);
    }
    return token; // for operators etc.
};


const LogicInspector: React.FC<{ expression: string, values: FormValues }> = ({ expression, values }) => {
    const tokens = tokenize(expression);
    const evaluation = evaluateRelevant(expression, values);
    
    // Defensive check to ensure we always have a boolean, preventing React error #310
    const finalResult = !!(evaluation && evaluation.result);
    const evaluationError = evaluation ? evaluation.error : null;

    return (
        <div>
            <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-md mb-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Expression</p>
                <p className="font-mono text-sm">{expression}</p>
            </div>
            <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-md mb-2">
                 <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Décomposition</p>
                 <div className="flex flex-wrap items-center font-mono text-sm">
                    {tokens.map((token, i) => {
                        const value = evaluateToken(token, values);
                        const isVar = token.startsWith('${');
                        return (
                            <span key={i} className="m-1 p-1 rounded-md bg-gray-200 dark:bg-gray-700 relative group">
                                {token}
                                {isVar && (
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max p-1.5 text-xs bg-black text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        Valeur: {JSON.stringify(value)}
                                    </div>
                                )}
                            </span>
                        )
                    })}
                 </div>
            </div>
            <div className={`p-2 rounded-md ${evaluationError ? 'bg-red-100 dark:bg-red-900' : (finalResult ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900')}`}>
                <p className="text-xs font-semibold">
                    {evaluationError ? `❌ Erreur d'évaluation` : (finalResult ? '✅ Résultat : VRAI' : '❌ Résultat : FAUX')}
                </p>
                 {evaluationError ? (
                    <p className="text-xs font-mono mt-1">{evaluationError}</p>
                ) : (
                    <p className="text-xs">{finalResult ? 'La question sera affichée.' : 'La question sera masquée.'}</p>
                )}
            </div>
        </div>
    );
};

export default LogicInspector;