import React, { useMemo } from 'react';
// FIX: Corrected import paths
import { useProject } from '../contexts/ProjectContext';
import LogicInspector from './LogicInspector';
import { evaluateRelevant } from '../utils/formLogic';
import { detectCircularDependencies, findUndefinedVariables } from '../services/formValidationService';
import { LogicError } from '../types';
import { getLocalizedText } from '../utils/localizationUtils';

interface DebugConsoleProps {
  activeLang: string;
}

const DebugConsole: React.FC<DebugConsoleProps> = ({ activeLang }) => {
  const { activeProject, formValues, currentQuestionName, setCurrentQuestionName } = useProject();
  const [activeTab, setActiveTab] = React.useState('logic');
  
  const currentQuestion = activeProject?.formData.survey.find(q => q.name === currentQuestionName);

  const errors: LogicError[] = useMemo(() => {
    if (!activeProject) return [];
    const foundErrors: LogicError[] = [];
    const { survey } = activeProject.formData;
    const defaultLang = activeProject.formData.settings.default_language || 'default';

    // 1. Syntax errors in relevant
    for (const q of survey) {
        if (q.relevant) {
            const { error } = evaluateRelevant(q.relevant, formValues);
            if (error) {
                foundErrors.push({
                    questionName: q.name,
                    questionLabel: getLocalizedText(q.label, defaultLang) || q.name,
                    logicType: 'relevant',
                    expression: q.relevant,
                    error
                });
            }
        }
    }

    // 2. Undefined variables
    const undefinedVars = findUndefinedVariables(survey);
    undefinedVars.forEach(err => {
        const q = survey.find(q => q.name === err.questionName);
        foundErrors.push({
            questionName: err.questionName,
            questionLabel: getLocalizedText(q?.label, defaultLang) || err.questionName,
            logicType: 'undefined_variable',
            expression: err.logic,
            error: `La variable '${err.undefinedVar}' est utilisée mais n'existe pas.`
        });
    });

    // 3. Circular dependencies
    const circularDeps = detectCircularDependencies(survey);
    if (circularDeps.length > 0) {
        const cycleString = circularDeps.join(' -> ');
        circularDeps.forEach(qName => {
             const q = survey.find(q => q.name === qName);
             foundErrors.push({
                questionName: qName,
                questionLabel: getLocalizedText(q?.label, defaultLang) || qName,
                logicType: 'circular_dependency',
                error: `Dépendance circulaire détectée: ${cycleString}`
             });
        });
    }
    
    // Deduplicate errors
    return foundErrors.filter((v,i,a)=>a.findIndex(t=>(t.questionName === v.questionName && t.error === v.error))===i)
  }, [activeProject, formValues]);


  const renderLogicInspector = () => {
    if (!currentQuestion) {
        return <div className="text-xs text-gray-500 p-4 text-center">Sélectionnez une question pour inspecter sa logique.</div>;
    }
    if (!currentQuestion.relevant) {
      return <div className="text-xs text-gray-500 p-4 text-center">Aucune logique de pertinence pour la question sélectionnée.</div>;
    }
    
    return <LogicInspector expression={currentQuestion.relevant} values={formValues} />;
  };

  const renderVariables = () => {
    if (Object.keys(formValues).length === 0) {
        return <div className="text-xs text-gray-500 p-4 text-center">Aucune donnée saisie en mode simulation.</div>;
    }
    return (
      <div className="text-xs font-mono p-2">
        {Object.entries(formValues).map(([key, value]) => (
          <div key={key}>
            <span className="text-blue-400">{key}:</span> <span className="text-green-400">"{String(value)}"</span>
          </div>
        ))}
      </div>
    );
  };
  
  const renderProblems = () => {
      if (errors.length === 0) {
          return <div className="text-xs text-gray-500 p-4 text-center">Aucun problème détecté.</div>;
      }
      return (
          <div className="space-y-2 p-1">
              {errors.map((err, index) => (
                  <button key={index} onClick={() => setCurrentQuestionName(err.questionName)} className="w-full text-left p-2 bg-red-100 dark:bg-red-900/50 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                          Erreur sur "{err.questionLabel}"
                      </p>
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {err.error}
                      </p>
                  </button>
              ))}
          </div>
      )
  }
  
  const TabButton: React.FC<{tabId: string, children: React.ReactNode}> = ({ tabId, children }) => (
      <button 
        onClick={() => setActiveTab(tabId)}
        className={`px-3 py-1.5 text-sm rounded-t-md transition-colors ${activeTab === tabId ? 'bg-gray-200 dark:bg-gray-700' : 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-900'}`}
      >
        {children}
      </button>
  )

  return (
    <div className="h-48 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex flex-col">
      <div className="flex items-center border-b dark:border-gray-700 px-2 flex-shrink-0">
        <TabButton tabId="logic">Inspecteur de Logique</TabButton>
        <TabButton tabId="vars">Variables</TabButton>
        <TabButton tabId="problems">
            Problèmes <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${errors.length > 0 ? 'bg-red-500 text-white' : 'bg-gray-300 dark:bg-gray-600'}`}>{errors.length}</span>
        </TabButton>
      </div>
      <div className="flex-1 overflow-y-auto">
          {activeTab === 'logic' && renderLogicInspector()}
          {activeTab === 'vars' && renderVariables()}
          {activeTab === 'problems' && renderProblems()}
      </div>
    </div>
  );
};

export default DebugConsole;