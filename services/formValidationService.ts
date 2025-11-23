// FIX: Corrected import path
import { KoboQuestion } from '../types';

// Extracts variable names (e.g., ${age}) from a string
const getDependencies = (expression: string | undefined): string[] => {
    if (!expression) return [];
    const regex = /\$\{([^}]+)\}/g;
    const matches = expression.match(regex);
    if (!matches) return [];
    return matches.map(match => match.substring(2, match.length - 1));
};

export const detectCircularDependencies = (survey: KoboQuestion[]): string[] => {
    const graph: { [key: string]: string[] } = {};
    const questionNames = new Set(survey.map(q => q.name));

    survey.forEach(q => {
        const dependencies = [
            ...getDependencies(q.relevant),
            ...getDependencies(q.calculation),
            ...getDependencies(q.constraint),
        ].filter(dep => questionNames.has(dep));
        graph[q.name] = dependencies;
    });

    const visiting = new Set<string>();
    const visited = new Set<string>();
    let cycle: string[] = [];

    const hasCycleUtil = (node: string, path: string[]): boolean => {
        visiting.add(node);
        path.push(node);

        const neighbors = graph[node] || [];
        for (const neighbor of neighbors) {
            if (visiting.has(neighbor)) {
                // Cycle detected
                const cycleStartIndex = path.indexOf(neighbor);
                cycle = path.slice(cycleStartIndex);
                return true; 
            }
            if (!visited.has(neighbor)) {
                if (hasCycleUtil(neighbor, path)) {
                    return true;
                }
            }
        }

        visiting.delete(node);
        path.pop();
        return false;
    };

    for (const qName of questionNames) {
        if (!visited.has(qName)) {
            const path: string[] = [];
            if (hasCycleUtil(qName, path)) {
                return cycle;
            }
            // Mark all nodes in the path as visited if no cycle was found from them
            path.forEach(node => visited.add(node));
            visited.add(qName);
        }
    }

    return [];
};


export const findUndefinedVariables = (survey: KoboQuestion[]): { questionName: string, logic: string, undefinedVar: string }[] => {
    const questionNames = new Set(survey.map(q => q.name));
    const errors: { questionName: string, logic: string, undefinedVar: string }[] = [];

    survey.forEach(q => {
        const logicFields: { type: string, value: string | undefined }[] = [
            { type: 'relevant', value: q.relevant },
            { type: 'calculation', value: q.calculation },
            { type: 'constraint', value: q.constraint },
        ];
        
        logicFields.forEach(field => {
            if (field.value) {
                const dependencies = getDependencies(field.value);
                dependencies.forEach(dep => {
                    if (!questionNames.has(dep)) {
                        errors.push({
                            questionName: q.name,
                            logic: field.value as string,
                            undefinedVar: dep
                        });
                    }
                });
            }
        });
    });

    return errors;
};