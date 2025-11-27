
import React, { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { KoboQuestion, KoboChoice } from '../types';
import { getLocalizedText, setLocalizedText } from '../utils/localizationUtils';
import { getAssistance } from '../services/geminiService';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../hooks/useTranslation';

interface TranslationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TranslationManagerModal: React.FC<TranslationManagerModalProps> = ({ isOpen, onClose }) => {
  const { activeProject, updateProjectSettings, updateQuestion, batchUpdateQuestions } = useProject();
  const { addNotification } = useNotification();
  const { t } = useLanguage();
  const [newLang, setNewLang] = useState('');
  const [translating, setTranslating] = useState<string | null>(null);

  if (!isOpen || !activeProject) return null;

  const languages = activeProject.formData.settings.languages || [];

  const handleAddLanguage = (langCode: string) => {
    const code = langCode.toLowerCase().trim();
    if (code && !languages.includes(code) && code !== activeProject.formData.settings.default_language) {
      const updatedLangs = [...languages, code];
      updateProjectSettings({ ...activeProject.formData.settings, languages: updatedLangs });
      addNotification(t('lang_add_success', { lang: code }), 'success');
      setNewLang('');
    }
  };
  
 const handleTranslateAll = async (lang: string) => {
    setTranslating(lang);
    const defaultLang = activeProject.formData.settings.default_language || 'default';

    const textsToTranslate: { uid: string; field: 'label' | 'hint' | 'constraint_message' | 'choice'; choiceUid?: string; text: string }[] = [];

    activeProject.formData.survey.forEach(q => {
        const fields: ('label' | 'hint' | 'constraint_message')[] = ['label', 'hint', 'constraint_message'];
        fields.forEach(field => {
            const text = getLocalizedText(q[field], defaultLang);
            if (text && !getLocalizedText(q[field], lang)) {
                textsToTranslate.push({ uid: q.uid, field, text });
            }
        });

        if (q.choices) {
            q.choices.forEach(c => {
                const choiceLabel = getLocalizedText(c.label, defaultLang);
                if (choiceLabel && !getLocalizedText(c.label, lang)) {
                    textsToTranslate.push({ uid: q.uid, field: 'choice', choiceUid: c.uid, text: choiceLabel });
                }
            });
        }
    });

    if (textsToTranslate.length === 0) {
        addNotification(`Tous les textes sont déjà traduits en "${lang}".`, 'info');
        setTranslating(null);
        return;
    }

    const textMapForAI = Object.fromEntries(textsToTranslate.map((t, index) => [index, t.text]));
    const prompt = `
        En tant qu'expert traducteur spécialisé dans les enquêtes de terrain au Mali, traduis l'objet JSON de textes suivant vers la langue cible: "${lang}".
        - SI la langue est "bm" ou "bambara", utilise le Bambara standard écrit, compréhensible par le plus grand nombre.
        - Ta réponse DOIT être un objet JSON valide, avec les mêmes clés numériques (sous forme de chaînes de caractères) que l'objet d'entrée, et les valeurs traduites.
        - Ne retourne RIEN d'autre que l'objet JSON. Pas de texte explicatif, pas de formatage markdown.
        - Ne modifie pas les noms de variables comme \${variable}.
        - Sois concis et utilise un langage clair et adapté au terrain.

        Voici les textes à traduire :
        ${JSON.stringify(textMapForAI, null, 2)}
    `;

    try {
        const response = await getAssistance(prompt, [], ['mediateur_culturel', 'traduc_local'], activeProject, undefined);
        
        let translations: { [key: string]: string };
        try {
            // FIX: The AI can sometimes wrap the JSON in markdown. This extracts the JSON object reliably.
            const jsonString = response.text?.match(/\{[\s\S]*\}/)?.[0];
            if (!jsonString) throw new Error("La réponse de l'IA n'est pas un JSON valide.");
            translations = JSON.parse(jsonString);
        } catch (e) {
            console.error("Échec de l'analyse de la réponse IA:", e, response.text);
            addNotification("Erreur: L'IA a retourné une réponse mal formée.", 'error');
            setTranslating(null);
            return;
        }

        const questionUpdatesMap = new Map<string, Partial<KoboQuestion> & {name: string}>();
        const originalSurveyMap = new Map(activeProject.formData.survey.map(q => [q.uid, q]));

        let successfulCount = 0;
        textsToTranslate.forEach((item, index) => {
            const translatedText = translations[String(index)];
            if (translatedText) {
                successfulCount++;
                if (!questionUpdatesMap.has(item.uid)) {
                    const originalQuestion = originalSurveyMap.get(item.uid)!;
                    questionUpdatesMap.set(item.uid, JSON.parse(JSON.stringify(originalQuestion)));
                }
                const questionUpdate = questionUpdatesMap.get(item.uid)!;

                switch (item.field) {
                    case 'choice': {
                        const choice = questionUpdate.choices?.find(c => c.uid === item.choiceUid);
                        if (choice) choice.label = setLocalizedText(choice.label, lang, translatedText);
                        break;
                    }
                    default: // 'label', 'hint', 'constraint_message'
                        (questionUpdate[item.field] as any) = setLocalizedText(questionUpdate[item.field], lang, translatedText);
                        break;
                }
            }
        });

        const updatesForReducer = Array.from(questionUpdatesMap.values()).map(q => ({
            questionName: q.name,
            updates: q,
        }));

        if (updatesForReducer.length > 0) {
            batchUpdateQuestions(updatesForReducer);
        }

        const failedCount = textsToTranslate.length - successfulCount;
        addNotification(`Traduction terminée : ${successfulCount} succès, ${failedCount} échecs.`, failedCount > 0 ? 'info' : 'success');

    } catch (e: any) {
        addNotification(`Une erreur est survenue lors de la traduction IA: ${e.message}`, 'error');
    } finally {
        setTranslating(null);
    }
  };

  const defaultLang = activeProject.formData.settings.default_language || 'default';
  const allLangs = [defaultLang, ...languages];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">Gestionnaire de Traductions</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        {/* Barre d'outils rapide */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2">
                <input 
                    type="text"
                    value={newLang}
                    onChange={e => setNewLang(e.target.value.toLowerCase())}
                    placeholder="Code (ex: en)"
                    className="w-24 p-2 text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
                />
                <button onClick={() => handleAddLanguage(newLang)} className="px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    +
                </button>
            </div>

            {!languages.includes('bm') && (
                <button 
                    onClick={() => handleAddLanguage('bm')} 
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-md hover:bg-green-700 shadow-sm"
                >
                    <span>🇲🇱</span> Ajouter Bambara (bm)
                </button>
            )}
        </div>

        <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm text-left">
                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700 z-10 shadow-sm">
                    <tr>
                        <th className="p-3 font-mono text-gray-500">Variable</th>
                        {allLangs.map(lang => (
                            <th key={lang} className="p-3 min-w-[200px]">
                                <div className="flex items-center justify-between">
                                    <span className="uppercase font-bold">{lang}</span>
                                    {lang !== defaultLang && (
                                      <button 
                                        onClick={() => handleTranslateAll(lang)} 
                                        disabled={!!translating} 
                                        className="text-[10px] px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded hover:bg-indigo-200 disabled:opacity-50 flex items-center gap-1"
                                        title="Traduire automatiquement les champs vides"
                                      >
                                        {translating === lang ? <span className="animate-spin">⏳</span> : '✨ Auto-Traduction'}
                                      </button>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {activeProject.formData.survey.map(q => (
                        <tr key={q.uid} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 group">
                            <td className="p-3 font-mono text-xs text-gray-500 align-top pt-4">{q.name}</td>
                            {allLangs.map(lang => (
                                <td key={lang} className="p-2 align-top">
                                    <div className="flex flex-col gap-2">
                                        {/* Label */}
                                        <input 
                                          type="text" 
                                          value={getLocalizedText(q.label, lang) || ''}
                                          onChange={(e) => {
                                              const updatedLabel = setLocalizedText(q.label, lang, e.target.value);
                                              updateQuestion(q.name, { label: updatedLabel });
                                          }}
                                          placeholder={lang === defaultLang ? 'Libellé requis' : 'Traduction...'}
                                          className={`w-full bg-transparent p-1.5 rounded border border-transparent hover:border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm ${!getLocalizedText(q.label, lang) && lang !== defaultLang ? 'italic placeholder-red-300' : ''}`}
                                        />
                                        {/* Hint (if exists in default) */}
                                        {(getLocalizedText(q.hint, defaultLang) || getLocalizedText(q.hint, lang)) && (
                                            <div className="flex items-center gap-1">
                                                <span className="text-[10px] text-gray-400 select-none">ℹ️</span>
                                                <input 
                                                    type="text" 
                                                    value={getLocalizedText(q.hint, lang) || ''}
                                                    onChange={(e) => {
                                                        const updatedHint = setLocalizedText(q.hint, lang, e.target.value);
                                                        updateQuestion(q.name, { hint: updatedHint });
                                                    }}
                                                    placeholder="Indice..."
                                                    className="flex-1 bg-transparent p-1 rounded border border-transparent hover:border-gray-300 focus:border-indigo-500 text-xs text-gray-500"
                                                />
                                            </div>
                                        )}
                                        {/* Choices */}
                                        {q.choices && q.choices.map(choice => (
                                            <div key={choice.uid} className="flex items-center gap-1 pl-2 border-l-2 border-gray-100 dark:border-gray-700">
                                                <span className="text-[10px] text-gray-400 select-none">○</span>
                                                <input 
                                                    type="text" 
                                                    value={getLocalizedText(choice.label, lang) || ''}
                                                    onChange={(e) => {
                                                        // Logic to update choice not exposed directly in context, needing batch update or specialized logic
                                                        // For this UI, we construct a full question update
                                                        const newChoices = q.choices?.map(c => c.uid === choice.uid ? { ...c, label: setLocalizedText(c.label, lang, e.target.value) } : c);
                                                        updateQuestion(q.name, { choices: newChoices });
                                                    }}
                                                    placeholder="Choix..."
                                                    className="flex-1 bg-transparent p-1 rounded border border-transparent hover:border-gray-300 focus:border-indigo-500 text-xs"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="p-4 border-t dark:border-gray-700 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-indigo-deep rounded-md">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranslationManagerModal;
