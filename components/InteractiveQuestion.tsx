import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';
import { KoboQuestion, FormValues } from '../types';
import { getLocalizedText } from '../utils/localizationUtils';
import { validateConstraint, validateCommonConstraints, evaluateChoiceFilter } from '../utils/formLogic';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../hooks/useTranslation';
import { validationService, ValidationError } from '../services/validationService';
import { mediaService } from '../services/mediaService';

interface InteractiveQuestionProps {
  question: KoboQuestion;
  value: any;
  onChange: (name: string, value: any) => void;
  onQuestionClick?: (questionName: string) => void;
  isSelected?: boolean;
  readOnly?: boolean;
}

const InteractiveQuestion: React.FC<InteractiveQuestionProps> = ({ question, value, onChange, onQuestionClick, isSelected = false, readOnly = false }) => {
    const { formValues, activeProject, setCurrentQuestionName, currentQuestionName } = useProject();
    const inputRef = useRef<HTMLInputElement>(null);
    const defaultLang = activeProject?.formData.settings.default_language || 'fr';

    const [localValue, setLocalValue] = useState(value ?? '');

    useEffect(() => {
        setLocalValue(value ?? '');
    }, [value]);

    const updateParent = useCallback(
        debounce((val: any) => {
            onChange(question.name, val);
        }, 300),
        [onChange, question.name]
    );

    const { t } = useLanguage();

    const { isValid: constraintValid, error: constraintError } = useMemo(() => validateConstraint(question.constraint, localValue, formValues), [question.constraint, localValue, formValues]);
    const { isValid: commonValid, error: commonError } = useMemo(() => validateCommonConstraints(question.type, localValue, question.appearance), [question.type, localValue, question.appearance]);
    const isValid = constraintValid && commonValid;
    const error = constraintError || commonError;
    const constraintMessage = getLocalizedText(question.constraint_message, defaultLang);

    // For cascading selects
    const filteredChoices = useMemo(() => {
        if (question.choices && question.choice_filter) {
            return evaluateChoiceFilter(question.choice_filter, formValues, question.choices);
        }
        return question.choices || [];
    }, [question.choices, question.choice_filter, formValues]);

    // Real-time validation state
    const [gpsLoading, setGpsLoading] = useState(false);

    const surveyRef = useRef(activeProject?.formData.survey || []);

    useEffect(() => {
        surveyRef.current = activeProject?.formData.survey || [];
    }, [activeProject?.formData.survey]);

    // Real-time validation with useMemo to avoid re-render loops
    const validationErrors = useMemo(() => {
        return validationService.validateField(question.name, localValue, surveyRef.current);
    }, [localValue, question.name]);

    // Focus input when selected (only if not readOnly)
    useEffect(() => {
        if (isSelected && !readOnly && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isSelected, readOnly]);

    const handleQuestionClick = useCallback((e: React.MouseEvent) => {
        console.log('Question clicked:', question.name);
        e.stopPropagation();
        if (onQuestionClick) {
            console.log('Calling onQuestionClick with:', question.name);
            onQuestionClick(question.name);
        } else {
            console.log('Calling setCurrentQuestionName with:', question.name);
            setCurrentQuestionName(question.name);
        }
    }, [onQuestionClick, question.name, setCurrentQuestionName]);

    const commonLabel = (
        <label
            htmlFor={question.name}
            className="block text-sm font-medium text-anthracite-gray dark:text-gray-200 flex items-center"
            aria-label={`${getLocalizedText(question.label, defaultLang)}${question.required ? ' (obligatoire)' : ''}`}
        >
            {getLocalizedText(question.label, defaultLang)}
            {question.required && <span className="text-red-earth ml-1 flex items-center" aria-label="obligatoire" title="Champ obligatoire"><span className="text-red-500 mr-1">⚠️</span>*</span>}
        </label>
    );

    const hintText = getLocalizedText(question.hint, defaultLang);
    const commonHint = hintText && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400" aria-describedby={`${question.name}-hint`}>
            {hintText}
        </p>
    );

    // Temporarily disable real-time validation to prevent render loops
    const hasValidationErrors = false;
    const commonErrorDisplay = !isValid && !readOnly && (
        <div className="mt-1 space-y-1" role="alert" aria-live="polite">
            <p className="text-xs text-red-earth" id={`${question.name}-error`} aria-describedby={`${question.name}-error`}>
                {constraintMessage || error || 'Valeur invalide'}
            </p>
        </div>
    );

    const inputClasses = `mt-1 block w-full text-sm rounded-md border-2 shadow-sm focus:border-indigo-deep focus:ring-indigo-deep dark:bg-gray-800 dark:border-gray-600 dark:text-white pointer-events-auto transition-none ${!isValid && !readOnly ? 'border-red-earth focus:border-red-earth focus:ring-red-earth' : ''} ${readOnly ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`;
    const readonlyClasses = `mt-1 block w-full text-sm rounded-md border-gray-200 bg-gray-100 dark:bg-gray-800 dark:border-gray-600 cursor-not-allowed text-gray-500 transition-all duration-200 ${!isValid ? 'border-red-earth animate-pulse' : ''}`;
    const radioCheckboxLabelClasses = "ml-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer";

    switch (question.type) {
        case 'text':
        case 'integer':
        case 'decimal':
        case 'date':
        case 'time':
            const inputMobileClasses = `${inputClasses} min-h-12 p-3 touch-manipulation`;
            return (
                <div className={`cursor-pointer ${isSelected ? 'ring-2 ring-indigo-500 bg-blue-50' : ''}`} onClick={handleQuestionClick} data-question-name={question.name}>
                    {commonLabel}
                    {readOnly ? (
                        <div className={inputMobileClasses.replace('block w-full', 'block w-full p-3 min-h-12 flex items-center')}>
                            {value || <span className="italic text-gray-500">Non rempli</span>}
                        </div>
                    ) : (
                        <input
                            ref={inputRef}
                            type={question.type === 'integer' || question.type === 'decimal' ? 'number' : question.type}
                            name={question.name}
                            id={question.name}
                            value={localValue}
                            placeholder={`Entrez ${getLocalizedText(question.label, defaultLang).toLowerCase()}`}
                            onChange={(e) => {
                                const newValue = e.target.value;
                                setLocalValue(newValue);
                                updateParent(newValue);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className={inputMobileClasses}
                            required={question.required}
                            step={question.type === 'decimal' ? 'any' : undefined}
                            autoFocus={false}
                            disabled={readOnly}
                        />
                    )}
                    {commonHint}
                    {commonErrorDisplay}
                </div>
            );

        case 'select_one':
            const isMinimal = question.appearance?.includes('minimal');
    const selectClasses = `mt-1 block w-full min-h-12 p-3 text-sm rounded-md border-2 shadow-sm focus:border-indigo-deep focus:ring-indigo-deep dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all duration-200 ${!isValid && !readOnly ? 'border-red-earth focus:border-red-earth focus:ring-red-earth animate-pulse' : ''} ${readOnly ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`;
            if (readOnly) {
                return (
                    <fieldset className={`cursor-pointer ${isSelected ? 'ring-2 ring-indigo-500 bg-blue-50' : ''}`} onClick={handleQuestionClick} data-question-name={question.name}>
                        <legend className="text-sm font-medium text-anthracite-gray dark:text-gray-200">{getLocalizedText(question.label, defaultLang)}{question.required && <span className="text-red-earth ml-1">*</span>}</legend>
                        {commonHint}
                        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {value ? getLocalizedText(filteredChoices.find(c => c.name === value)?.label || {}, defaultLang) || value : <span className="italic">Aucune sélection</span>}
                            </span>
                        </div>
                    </fieldset>
                );
            }
            return (
                <fieldset className={`cursor-pointer ${isSelected ? 'ring-2 ring-indigo-500 bg-blue-50' : ''}`} onClick={handleQuestionClick} data-question-name={question.name}>
                    <legend className="text-sm font-medium text-anthracite-gray dark:text-gray-200">{getLocalizedText(question.label, defaultLang)}{question.required && <span className="text-red-earth ml-1">*</span>}</legend>
                    {commonHint}
                    {isMinimal ? (
                        <select
                            name={question.name}
                            value={value || ''}
                            onChange={(e) => onChange(question.name, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className={selectClasses}
                            required={question.required}
                            disabled={readOnly}
                        >
                            <option value="">{t('select_one_placeholder') || 'Sélectionnez une option'}</option>
                            {filteredChoices.map(choice => (
                                <option key={choice.uid} value={choice.name}>
                                    {getLocalizedText(choice.label, defaultLang)}
                                </option>
                            ))}
                        </select>
                    ) : (
                        <div className="mt-2 space-y-2">
                            {filteredChoices.map(choice => (
                                <div key={choice.uid} className="flex items-center">
                                    <input
                                        type="radio"
                                        id={`${question.name}_${choice.name}`}
                                        name={question.name}
                                        value={choice.name}
                                        checked={value === choice.name}
                                        onChange={() => {
                                            onChange(question.name, choice.name);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="focus:ring-indigo-deep h-5 w-5 text-indigo-deep border-gray-300 rounded"
                                    />
                                    <label htmlFor={`${question.name}_${choice.name}`} className={`${radioCheckboxLabelClasses} min-h-12 flex items-center py-2`}>
                                        {choice.image && <img src={choice.image} alt="" className="w-10 h-10 mr-3 object-cover rounded" />}
                                        {getLocalizedText(choice.label, defaultLang)}
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                     {commonErrorDisplay}
                </fieldset>
            );

        case 'select_multiple':
             const selectedValues = (value || '').split(' ').filter(Boolean);
             const handleMultiSelectChange = useCallback((choiceName: string) => {
                 const newValues = selectedValues.includes(choiceName)
                    ? selectedValues.filter(v => v !== choiceName)
                    : [...selectedValues, choiceName];
                 onChange(question.name, newValues.join(' '));
             }, [selectedValues, onChange, question.name]);
             const isMinimalMulti = question.appearance?.includes('minimal');
             if (readOnly) {
                return (
                    <fieldset className={`cursor-pointer ${isSelected ? 'ring-2 ring-indigo-500 bg-blue-50' : ''}`} onClick={handleQuestionClick} data-question-name={question.name}>
                        <legend className="text-sm font-medium text-anthracite-gray dark:text-gray-200">{getLocalizedText(question.label, defaultLang)}{question.required && <span className="text-red-earth ml-1">*</span>}</legend>
                        {commonHint}
                        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {selectedValues.length > 0 ? selectedValues.map(v => getLocalizedText(filteredChoices.find(c => c.name === v)?.label || {}, defaultLang)).join(', ') : <span className="italic">Aucune sélection</span>}
                            </span>
                        </div>
                    </fieldset>
                );
             }
             return (
                 <fieldset className={`cursor-pointer ${isSelected ? 'ring-2 ring-indigo-500 bg-blue-50' : ''}`} onClick={handleQuestionClick} data-question-name={question.name}>
                     <legend className="text-sm font-medium text-anthracite-gray dark:text-gray-200">{getLocalizedText(question.label, defaultLang)}{question.required && <span className="text-red-earth ml-1">*</span>}</legend>
                     {commonHint}
                     {isMinimalMulti ? (
                         <select
                             multiple
                             name={question.name}
                             value={selectedValues}
                             onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                 const options = Array.from(e.target.selectedOptions).map((option: HTMLOptionElement) => option.value);
                                 onChange(question.name, options.join(' '));
                             }}
                             onClick={(e) => e.stopPropagation()}
                             className={`${selectClasses} h-32`}
                             required={question.required}
                             disabled={readOnly}
                         >
                             {filteredChoices.map(choice => (
                                 <option key={choice.uid} value={choice.name}>
                                     {getLocalizedText(choice.label, defaultLang)}
                                 </option>
                             ))}
                         </select>
                     ) : (
                         <div className="mt-2 space-y-2">
                             {filteredChoices.map(choice => (
                                 <div key={choice.uid} className="flex items-center">
                                     <input
                                         type="checkbox"
                                         id={`${question.name}_${choice.name}`}
                                         name={choice.name}
                                         checked={selectedValues.includes(choice.name)}
                                         onChange={() => {
                                             handleMultiSelectChange(choice.name);
                                         }}
                                         onClick={(e) => e.stopPropagation()}
                                         className="focus:ring-indigo-deep h-5 w-5 text-indigo-deep border-gray-300 rounded"
                                     />
                                     <label htmlFor={`${question.name}_${choice.name}`} className={`${radioCheckboxLabelClasses} min-h-12 flex items-center py-2`}>
                                         {choice.image && <img src={choice.image} alt="" className="w-10 h-10 mr-3 object-cover rounded" />}
                                         {getLocalizedText(choice.label, defaultLang)}
                                     </label>
                                 </div>
                             ))}
                         </div>
                     )}
                      {commonErrorDisplay}
                 </fieldset>
             );

        case 'note':
            return <div className={`p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md text-sm cursor-pointer ${isSelected ? 'ring-2 ring-indigo-500 bg-blue-50' : ''}`} onClick={handleQuestionClick} data-question-name={question.name}>{getLocalizedText(question.label, defaultLang)}</div>;

        case 'geopoint':
            if (readOnly) {
                return (
                    <div className={`cursor-pointer ${isSelected ? 'ring-2 ring-indigo-500 bg-blue-50' : ''}`} onClick={handleQuestionClick} data-question-name={question.name}>
                        {commonLabel}
                        <div className={readonlyClasses} style={{ minHeight: '80px', display: 'flex', alignItems: 'center', padding: '8px' }}>
                            {value ? value : <span className="italic">Aucune position saisie</span>}
                        </div>
                        {commonHint}
                    </div>
                );
            }
            return (
                <div className={`cursor-pointer ${isSelected ? 'ring-2 ring-indigo-500 bg-blue-50' : ''}`} onClick={handleQuestionClick} data-question-name={question.name}>
                    {commonLabel}
                    <div className="mt-1 grid grid-cols-2 gap-2">
                        <input
                            type="number"
                            placeholder="Latitude"
                            name={`${question.name}_lat`}
                            id={`${question.name}_lat`}
                            value={(value && value.split(' ')[0]) || ''}
                            onChange={(e) => {
                                const parts = (value || '  ').split(' ');
                                parts[0] = e.target.value;
                                onChange(question.name, parts.join(' '));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className={inputMobileClasses}
                            step="any"
                            autoFocus={false}
                        />
                        <input
                            type="number"
                            placeholder="Longitude"
                            name={`${question.name}_lng`}
                            id={`${question.name}_lng`}
                            value={(value && value.split(' ')[1]) || ''}
                            onChange={(e) => {
                                const parts = (value || '  ').split(' ');
                                parts[1] = e.target.value;
                                onChange(question.name, parts.join(' '));
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className={inputMobileClasses}
                            step="any"
                            autoFocus={false}
                        />
                    </div>
                    <button
                        type="button"
                        className="mt-3 w-full min-h-12 px-4 py-2 text-base bg-indigo-deep text-white rounded-md hover:bg-indigo-deep-light touch-manipulation"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering question selection
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                    (position) => {
                                        const coords = `${position.coords.latitude} ${position.coords.longitude}`;
                                        onChange(question.name, coords);
                                    },
                                    (error) => {
                                        console.error('Erreur de géolocalisation:', error);
                                        // Fallback: utiliser une valeur par défaut ou afficher un message
                                    }
                                );
                            }
                        }}
                    >
                        📍 Obtenir ma position
                    </button>
                    {commonHint}
                    {commonErrorDisplay}
                </div>
            );

        case 'image':
            if (readOnly) {
                return (
                    <div className={`cursor-pointer ${isSelected ? 'ring-2 ring-indigo-500 bg-blue-50' : ''}`} onClick={handleQuestionClick} data-question-name={question.name}>
                        {commonLabel}
                        <div className={readonlyClasses} style={{ minHeight: '40px', display: 'flex', alignItems: 'center', padding: '8px' }}>
                            {value ? 'Image uploadée' : <span className="italic">Aucune image</span>}
                        </div>
                        {value && (
                            <div className="mt-2">
                                <img
                                    src={typeof value === 'object' && value.dataUrl ? value.dataUrl : value}
                                    alt="Image uploadée"
                                    className="max-w-full h-32 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                                />
                            </div>
                        )}
                        {commonHint}
                    </div>
                );
            }
            return (
                <div className={`cursor-pointer ${isSelected ? 'ring-2 ring-indigo-500 bg-blue-50' : ''}`} onClick={handleQuestionClick} data-question-name={question.name}>
                    {commonLabel}
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        name={question.name}
                        id={question.name}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    onChange(question.name, event.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                            }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className={inputClasses}
                        required={question.required}
                    />
                    {value && (
                        <div className="mt-2">
                            <img
                                src={typeof value === 'object' && value.dataUrl ? value.dataUrl : value}
                                alt="Image uploadée"
                                className="max-w-full h-32 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                            />
                            {typeof value === 'object' && value.mediaId && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Media ID: {value.mediaId} {mediaService.getMedia(value.mediaId)?.synced ? '(Synchronisé)' : '(En attente de synchro)'}
                                </p>
                            )}
                        </div>
                    )}
                    {commonHint}
                    {commonErrorDisplay}
                </div>
            );

        default:
            return <div className={`text-sm text-red-500 cursor-pointer ${isSelected ? 'ring-2 ring-indigo-500 bg-blue-50' : ''}`} onClick={handleQuestionClick}>Type de question non supporté: {question.type}</div>;
    }
};

const MemoizedInteractiveQuestion = React.memo(InteractiveQuestion);

export default MemoizedInteractiveQuestion;
