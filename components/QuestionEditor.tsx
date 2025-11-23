

import React, { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { KoboQuestion, KoboChoice } from '../types';
import { getLocalizedText, setLocalizedText } from '../utils/localizationUtils';
import { v4 as uuidv4 } from 'uuid';
import LogicBuilderModal from './LogicBuilderModal';
import { useLanguage } from '../hooks/useTranslation';
import { useNotification } from '../contexts/NotificationContext';

const QuestionEditor: React.FC = () => {
    const { activeProject, currentQuestion, updateQuestion, deleteQuestion } = useProject();
    const { t } = useLanguage();
    const { addNotification } = useNotification();
    const [formData, setFormData] = useState<Partial<KoboQuestion>>({});
    const [isLogicBuilderOpen, setIsLogicBuilderOpen] = useState(false);
    
    const defaultLang = activeProject?.formData.settings.default_language || 'fr';

    useEffect(() => {
        if (currentQuestion) {
            setFormData(currentQuestion);
        }
    }, [currentQuestion]);

    if (!currentQuestion || !activeProject) {
        return <div className="p-4 text-sm text-center">{/* Handled in RightSidebar */}</div>;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const finalValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;
        
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleLocalizedChange = (field: 'label' | 'hint' | 'constraint_message', value: string) => {
        const newLocalizedText = setLocalizedText(formData[field], defaultLang, value);
        setFormData(prev => ({ ...prev, [field]: newLocalizedText }));
    };

    const handleChoiceChange = (uid: string, field: 'name' | 'label' | 'image', value: string) => {
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
        const newChoice: KoboChoice = { uid: uuidv4(), name: `choix_${(formData.choices?.length || 0) + 1}`, label: { [defaultLang]: 'Nouveau Choix' } };
        setFormData(prev => ({ ...prev, choices: [...(prev.choices || []), newChoice] }));
    };
    
    const removeChoice = (uid: string) => {
        setFormData(prev => ({ ...prev, choices: prev.choices?.filter(c => c.uid !== uid) }));
    };

    const handleUpdate = () => {
        if (window.confirm(t('confirmSaveChanges'))) {
            updateQuestion(currentQuestion.name, formData);
            addNotification(t('notification_questionSaved', { questionName: currentQuestion.name }), 'success');
        }
    };
    
    const handleDelete = () => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer la question "${currentQuestion.name}" ?`)) {
            deleteQuestion(currentQuestion.name);
        }
    };

    const inputClass = "block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-deep focus:ring-indigo-deep dark:bg-gray-700 dark:border-gray-600";
    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

    return (
        <>
            <div className="p-4 space-y-4">
                <div>
                    <label htmlFor="label" className={labelClass}>Libellé</label>
                    <input type="text" id="label" value={getLocalizedText(formData.label, defaultLang)} onChange={e => handleLocalizedChange('label', e.target.value)} className={inputClass} />
                </div>
                <div>
                    <label htmlFor="name" className={labelClass}>Nom de Variable</label>
                    <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleChange} className={`${inputClass} font-mono`} />
                </div>
                <div>
                    <label htmlFor="type" className={labelClass}>Type</label>
                    <select name="type" id="type" value={formData.type || ''} onChange={handleChange} className={inputClass}>
                        {/* Basic types */}
                        <option value="text">Texte</option>
                        <option value="integer">Nombre Entier</option>
                        <option value="decimal">Nombre Décimal</option>
                        <option value="date">Date</option>
                        <option value="time">Heure</option>
                        <option value="geopoint">Point GPS</option>
                        {/* Choice types */}
                        <option value="select_one">Sélection Unique</option>
                        <option value="select_multiple">Sélection Multiple</option>
                        {/* Other types */}
                        <option value="note">Note</option>
                        <option value="image">Image</option>
                        <option value="begin_group">Début de Groupe</option>
                        <option value="end_group">Fin de Groupe</option>
                    </select>
                </div>
                
                {(formData.type === 'select_one' || formData.type === 'select_multiple') && (
                    <div>
                        <h4 className={labelClass}>Choix de réponse</h4>
                        <div className="mt-2 space-y-2">
                            {formData.choices?.map(choice => (
                                <div key={choice.uid} className="space-y-2 p-3 border border-gray-200 dark:border-gray-600 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <input type="text" value={choice.name} onChange={e => handleChoiceChange(choice.uid, 'name', e.target.value)} placeholder="name" className={`${inputClass} w-1/3 font-mono`} />
                                        <input type="text" value={getLocalizedText(choice.label, defaultLang)} onChange={e => handleChoiceChange(choice.uid, 'label', e.target.value)} placeholder="label" className={`${inputClass} w-2/3`} />
                                        <button onClick={() => removeChoice(choice.uid)} className="text-red-earth hover:text-red-earth/80 p-1">🗑️</button>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Image (optionnel)</label>
                                        <input type="text" value={choice.image || ''} onChange={e => handleChoiceChange(choice.uid, 'image', e.target.value)} placeholder="URL de l'image" className={`${inputClass} w-full`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={addChoice} className="mt-2 text-sm text-indigo-deep hover:underline">+ Ajouter un choix</button>
                    </div>
                )}
                
                <div>
                    <label htmlFor="hint" className={labelClass}>Indice / Aide</label>
                    <textarea id="hint" value={getLocalizedText(formData.hint, defaultLang)} onChange={e => handleLocalizedChange('hint', e.target.value)} className={inputClass} rows={2} />
                </div>

                <div>
                    <div className="flex items-center">
                        <input type="checkbox" name="required" id="required" checked={formData.required || false} onChange={handleChange} className="h-4 w-4 text-indigo-deep rounded border-gray-300 focus:ring-indigo-deep" />
                        <label htmlFor="required" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">Obligatoire</label>
                    </div>
                </div>

                <hr className="dark:border-gray-600"/>
                <h3 className="text-base font-semibold">Logique Avancée</h3>

                <div>
                    <label htmlFor="relevant" className={labelClass}>Condition de Pertinence (relevant)</label>
                    <div className="flex items-center gap-1">
                        <input type="text" name="relevant" id="relevant" value={formData.relevant || ''} onChange={handleChange} className={`${inputClass} font-mono flex-grow`} placeholder="Ex: ${age} > 18" />
                        <button onClick={() => setIsLogicBuilderOpen(true)} title={t('logicBuilder_helper_button')} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                           🪄
                        </button>
                    </div>
                </div>

                <div>
                    <label htmlFor="constraint" className={labelClass}>Contrainte de Validation (constraint)</label>
                    <input type="text" name="constraint" id="constraint" value={formData.constraint || ''} onChange={handleChange} className={`${inputClass} font-mono`} placeholder="Ex: . > 0 and . < 100" />
                </div>
                <div>
                    <label htmlFor="constraint_message" className={labelClass}>Message de Contrainte</label>
                    <input type="text" id="constraint_message" value={getLocalizedText(formData.constraint_message, defaultLang)} onChange={e => handleLocalizedChange('constraint_message', e.target.value)} className={inputClass} />
                </div>

                <div className="flex justify-between items-center pt-4">
                    <button onClick={handleDelete} className="px-4 py-2 text-sm font-medium text-red-earth bg-red-earth/10 hover:bg-red-earth/20 rounded-md">Supprimer</button>
                    <button onClick={handleUpdate} className="px-4 py-2 text-sm font-medium text-white bg-indigo-deep rounded-md hover:bg-indigo-deep-dark">Sauvegarder</button>
                </div>

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
        </>
    );
};

export default QuestionEditor;