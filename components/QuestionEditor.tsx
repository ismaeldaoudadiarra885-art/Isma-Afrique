
import React, { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { KoboQuestion, KoboChoice } from '../types';
import { getLocalizedText, setLocalizedText } from '../utils/localizationUtils';
import { v4 as uuidv4 } from 'uuid';
import LogicBuilderModal from './LogicBuilderModal';
import { useLanguage } from '../hooks/useTranslation';
import { useNotification } from '../contexts/NotificationContext';
import RealtimeCoach from './RealtimeCoach';

const QuestionEditor: React.FC = () => {
    const { activeProject, currentQuestion, updateQuestion, deleteQuestion, addQuestion } = useProject();
    const { t } = useLanguage();
    const { addNotification } = useNotification();
    const [formData, setFormData] = useState<Partial<KoboQuestion>>({});
    const [isLogicBuilderOpen, setIsLogicBuilderOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'choices' | 'logic'>('general');
    
    const defaultLang = activeProject?.formData.settings.default_language || 'fr';

    useEffect(() => {
        if (currentQuestion) {
            setFormData(currentQuestion);
            // Auto-switch back to general if we change question type to non-choice but stay on tab
            if (currentQuestion.type !== 'select_one' && currentQuestion.type !== 'select_multiple' && activeTab === 'choices') {
                setActiveTab('general');
            }
        }
    }, [currentQuestion]);

    if (!currentQuestion || !activeProject) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const finalValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;
        
        // Logique "Tic au tac" pour les choix
        if (name === 'type' && (value === 'select_one' || value === 'select_multiple')) {
            setActiveTab('choices');
            // Ajouter automatiquement un premier choix si vide pour gagner du temps
            if (!formData.choices || formData.choices.length === 0) {
                const newChoice: KoboChoice = { uid: uuidv4(), name: 'choix_1', label: { [defaultLang]: 'Choix 1' } };
                setFormData(prev => ({ 
                    ...prev, 
                    [name]: finalValue,
                    choices: [newChoice] 
                }));
                // Update immédiat pour sauvegarder l'état
                updateQuestion(currentQuestion.name, { type: value as string, choices: [newChoice] });
                return;
            }
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleLocalizedChange = (field: 'label' | 'hint' | 'constraint_message', value: string) => {
        const newLocalizedText = setLocalizedText(formData[field], defaultLang, value);
        setFormData(prev => ({ ...prev, [field]: newLocalizedText }));
    };

    const handleChoiceChange = (uid: string, field: 'name' | 'label', value: string) => {
        const newChoices = formData.choices?.map(c => {
            if (c.uid === uid) {
                if (field === 'label') {
                    return { ...c, label: setLocalizedText(c.label, defaultLang, value) };
                }
                return { ...c, [field]: value };
            }
            return c;
        });
        setFormData(prev => ({ ...prev, choices: newChoices }));
    };

    const addChoice = () => {
        const count = (formData.choices?.length || 0) + 1;
        const newChoice: KoboChoice = { uid: uuidv4(), name: `choix_${count}`, label: { [defaultLang]: `Option ${count}` } };
        setFormData(prev => ({ ...prev, choices: [...(prev.choices || []), newChoice] }));
    };
    
    const removeChoice = (uid: string) => {
        setFormData(prev => ({ ...prev, choices: prev.choices?.filter(c => c.uid !== uid) }));
    };

    const handleUpdate = () => {
        updateQuestion(currentQuestion.name, formData);
        addNotification(t('notification_questionSaved', { questionName: currentQuestion.name }), 'success');
    };
    
    const handleDelete = () => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer la question "${currentQuestion.name}" ?`)) {
            deleteQuestion(currentQuestion.name);
        }
    };

    const handleDuplicate = () => {
        const duplicate: KoboQuestion = {
            ...currentQuestion,
            uid: uuidv4(),
            name: `${currentQuestion.name}_copy`,
            choices: currentQuestion.choices?.map(c => ({...c, uid: uuidv4()}))
        };
        addQuestion(duplicate, currentQuestion.name, 'after');
        addNotification("Question dupliquée", "success");
    };

    const inputClass = "block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border transition-all";
    const labelClass = "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1";

    const hasChoices = formData.type === 'select_one' || formData.type === 'select_multiple';

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800">
            {/* Toolbar Actions */}
            <div className="flex items-center justify-between p-2 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <span className="text-xs font-mono text-gray-500 ml-2">{formData.name}</span>
                <div className="flex gap-1">
                    <button onClick={handleDuplicate} className="p-1.5 text-gray-600 hover:bg-gray-200 rounded dark:text-gray-300 dark:hover:bg-gray-700" title="Dupliquer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    </button>
                    <button onClick={handleDelete} className="p-1.5 text-red-500 hover:bg-red-50 rounded dark:hover:bg-red-900/30" title="Supprimer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b dark:border-gray-700">
                <button 
                    onClick={() => setActiveTab('general')} 
                    className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'general' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Général
                </button>
                {hasChoices && (
                    <button 
                        onClick={() => setActiveTab('choices')} 
                        className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'choices' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Choix ({formData.choices?.length || 0})
                    </button>
                )}
                <button 
                    onClick={() => setActiveTab('logic')} 
                    className={`flex-1 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'logic' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Logique
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                
                {activeTab === 'general' && (
                    <div className="space-y-4 animate-fadeIn">
                        <div>
                            <label htmlFor="label" className={labelClass}>Libellé de la question</label>
                            <textarea 
                                id="label" 
                                rows={2} 
                                value={getLocalizedText(formData.label, defaultLang)} 
                                onChange={e => handleLocalizedChange('label', e.target.value)} 
                                className={inputClass} 
                                placeholder="Ex: Quel est votre âge ?"
                                autoFocus
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="type" className={labelClass}>Type de réponse</label>
                                <select name="type" id="type" value={formData.type || ''} onChange={handleChange} className={inputClass}>
                                    <optgroup label="Basique">
                                        <option value="text">Texte (Abc)</option>
                                        <option value="integer">Entier (123)</option>
                                        <option value="decimal">Décimal (1.5)</option>
                                    </optgroup>
                                    <optgroup label="Choix (Ouvre l'onglet choix)">
                                        <option value="select_one">Choix Unique</option>
                                        <option value="select_multiple">Choix Multiple</option>
                                    </optgroup>
                                    <optgroup label="Date/Heure/Lieu">
                                        <option value="date">Date</option>
                                        <option value="time">Heure</option>
                                        <option value="geopoint">GPS</option>
                                    </optgroup>
                                    <optgroup label="Média & Preuve">
                                        <option value="image">Photo</option>
                                        <option value="audio">Audio (Vocal)</option>
                                        <option value="signature">Signature</option>
                                    </optgroup>
                                    <optgroup label="Structure">
                                        <option value="begin_group">Groupe (Début)</option>
                                        <option value="end_group">Groupe (Fin)</option>
                                        <option value="begin_repeat">Boucle (Repeat)</option>
                                        <option value="end_repeat">Fin Boucle</option>
                                        <option value="note">Note (Info)</option>
                                        <option value="calculate">Calcul</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="name" className={labelClass}>Nom Variable (XML)</label>
                                <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} className={`${inputClass} font-mono text-indigo-600`} />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="appearance" className={labelClass}>Apparence (Style)</label>
                            <select name="appearance" id="appearance" value={formData.appearance || ''} onChange={handleChange} className={inputClass}>
                                <option value="">Par défaut</option>
                                {formData.type === 'select_one' && (
                                    <>
                                        <option value="minimal">Liste déroulante (minimal)</option>
                                        <option value="horizontal">Horizontal (Radio)</option>
                                        <option value="horizontal-compact">Horizontal Compact</option>
                                    </>
                                )}
                                {formData.type === 'text' && (
                                    <option value="multiline">Multi-lignes (Zone de texte)</option>
                                )}
                                {formData.type === 'integer' && (
                                    <option value="thousands-sep">Séparateur de milliers</option>
                                )}
                                 {formData.type === 'signature' && (
                                    <option value="draw">Dessin</option>
                                )}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="hint" className={labelClass}>Indice / Aide (Optionnel)</label>
                            <input type="text" id="hint" value={getLocalizedText(formData.hint, defaultLang)} onChange={e => handleLocalizedChange('hint', e.target.value)} className={inputClass} placeholder="Ex: En années révolues" />
                        </div>

                        <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
                            <input type="checkbox" name="required" id="required" checked={formData.required || false} onChange={handleChange} className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                            <label htmlFor="required" className="ml-2 block text-sm font-medium text-gray-700 dark:text-gray-200 cursor-pointer">Réponse Obligatoire</label>
                        </div>
                    </div>
                )}

                {activeTab === 'choices' && hasChoices && (
                    <div className="animate-fadeIn">
                        <div className="space-y-2 mb-3">
                            {formData.choices?.map((choice, index) => (
                                <div key={choice.uid} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/30 p-2 rounded border border-gray-100 dark:border-gray-700">
                                    <div className="text-xs text-gray-400 w-4 text-center">{index + 1}</div>
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        <input 
                                            type="text" 
                                            value={getLocalizedText(choice.label, defaultLang)} 
                                            onChange={e => handleChoiceChange(choice.uid, 'label', e.target.value)} 
                                            placeholder="Libellé affiché" 
                                            className={inputClass} 
                                            autoFocus={index === (formData.choices?.length || 0) - 1}
                                        />
                                        <input 
                                            type="text" 
                                            value={choice.name} 
                                            onChange={e => handleChoiceChange(choice.uid, 'name', e.target.value)} 
                                            placeholder="valeur_xml" 
                                            className={`${inputClass} font-mono text-xs text-gray-500`} 
                                        />
                                    </div>
                                    <button onClick={() => removeChoice(choice.uid)} className="text-gray-400 hover:text-red-500 p-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={addChoice} 
                            className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-50 hover:border-indigo-300 transition-colors flex items-center justify-center gap-2"
                        >
                            <span>+</span> Ajouter une option
                        </button>
                    </div>
                )}

                {activeTab === 'logic' && (
                    <div className="space-y-5 animate-fadeIn">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                            <div className="flex justify-between items-center mb-3">
                                <label htmlFor="relevant" className={`${labelClass} text-blue-800 dark:text-blue-300 mb-0`}>Condition d'affichage (Relevant)</label>
                            </div>
                            
                            <button 
                                onClick={() => setIsLogicBuilderOpen(true)} 
                                className="w-full mb-3 py-2 bg-white dark:bg-gray-800 border border-blue-200 text-blue-600 rounded-md shadow-sm hover:bg-blue-50 flex items-center justify-center gap-2 text-sm font-medium"
                            >
                                <span>🪄</span> Ouvrir l'Assistant Logique
                            </button>

                            <p className="text-[10px] text-blue-600 dark:text-blue-400 mb-2">Ou écrivez la formule manuellement :</p>
                            <input 
                                type="text" 
                                name="relevant" 
                                id="relevant" 
                                value={formData.relevant || ''} 
                                onChange={handleChange} 
                                className={`${inputClass} font-mono bg-white`} 
                                placeholder="${age} > 18" 
                            />
                        </div>

                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                            <label htmlFor="constraint" className={`${labelClass} text-red-800 dark:text-red-300`}>Validation (Constraint)</label>
                            <p className="text-[10px] text-red-600 dark:text-red-400 mb-2">Empêche la saisie si la formule est fausse.</p>
                            <input 
                                type="text" 
                                name="constraint" 
                                id="constraint" 
                                value={formData.constraint || ''} 
                                onChange={handleChange} 
                                className={`${inputClass} font-mono bg-white`} 
                                placeholder=". >= 0 and . <= 120" 
                            />
                            
                            <label htmlFor="constraint_message" className={`${labelClass} mt-3 text-red-800 dark:text-red-300`}>Message d'erreur</label>
                            <input 
                                type="text" 
                                id="constraint_message" 
                                value={getLocalizedText(formData.constraint_message, defaultLang)} 
                                onChange={e => handleLocalizedChange('constraint_message', e.target.value)} 
                                className={`${inputClass} bg-white`}
                                placeholder="La valeur doit être comprise entre 0 et 120."
                            />
                        </div>
                        
                        {formData.type === 'calculate' && (
                             <div>
                                <label htmlFor="calculation" className={labelClass}>Formule de Calcul</label>
                                <input type="text" name="calculation" value={formData.calculation || ''} onChange={handleChange} className={`${inputClass} font-mono`} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Coach en temps réel */}
            <RealtimeCoach />

            {/* Footer Action */}
            <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                <button 
                    onClick={handleUpdate} 
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-transform active:scale-95 flex justify-center items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Appliquer les modifications
                </button>
            </div>

            <LogicBuilderModal 
                isOpen={isLogicBuilderOpen}
                onClose={() => setIsLogicBuilderOpen(false)}
                initialLogic={formData.relevant || ''}
                onApply={(newLogic) => {
                    setFormData(prev => ({ ...prev, relevant: newLogic }));
                    setIsLogicBuilderOpen(false);
                }}
            />
        </div>
    );
};

export default QuestionEditor;
