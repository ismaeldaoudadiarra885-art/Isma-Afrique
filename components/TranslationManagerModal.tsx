import React, { useState, useEffect } from 'react';
// FIX: Corrected import paths
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

  const handleAddLanguage = () => {
    if (newLang && !languages.includes(newLang) && newLang !== activeProject.formData.settings.default_language) {
      const updatedLangs = [...languages, newLang];
      updateProjectSettings({ ...activeProject.formData.settings, languages: updatedLangs });
      addNotification(t('lang_add_success', { lang: newLang }), 'success');
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
        <div className="p-4 border-b dark:border-gray-700 flex items-center gap-4">
            <div>
                <input 
                    type="text"
                    value={newLang}
                    onChange={e => setNewLang(e.target.value.toLowerCase())}
                    placeholder={t('lang_code_placeholder')}
                    className="block text-sm rounded-md border-gray-300 shadow-sm dark:bg-gray-700 dark:border-gray-600"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('lang_code_hint')}</p>
            </div>
            <button onClick={handleAddLanguage} className="px-3 py-1.5 text-sm font-medium bg-isma-blue text-white rounded-md">Ajouter Langue</button>
        </div>
        <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm text-left">
                <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="p-3">Nom Variable</th>
                        {allLangs.map(lang => (
                            <th key={lang} className="p-3">
                                Libellé ({lang})
                                {lang !== defaultLang && (
                                  <button onClick={() => handleTranslateAll(lang)} disabled={!!translating} className="ml-2 text-xs p-1 bg-gray-200 dark:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-wait">
                                    {translating === lang ? '...' : 'IA traduire'}
                                  </button>
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {activeProject.formData.survey.map(q => (
                        <tr key={q.uid} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="p-2 font-mono text-xs">{q.name}</td>
                            {allLangs.map(lang => (
                                <td key={lang} className="p-2">
                                    <input 
                                      type="text" 
                                      value={getLocalizedText(q.label, lang) || ''}
                                      onChange={(e) => {
                                          const updatedLabel = setLocalizedText(q.label, lang, e.target.value);
                                          updateQuestion(q.name, { label: updatedLabel });
                                      }}
                                      placeholder={lang !== defaultLang ? '[Traduction manquante]' : ''}
                                      className="w-full bg-transparent p-1 rounded-md focus:outline-none focus:ring-1 focus:ring-isma-blue placeholder-gray-400 dark:placeholder-gray-500"
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="p-4 border-t dark:border-gray-700 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-isma-blue rounded-md">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranslationManagerModal;
