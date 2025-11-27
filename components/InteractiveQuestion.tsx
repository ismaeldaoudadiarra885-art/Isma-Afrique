
import React, { useState, useEffect, useRef } from 'react';
import { KoboQuestion } from '../types';
import { getLocalizedText } from '../utils/localizationUtils';
import { validateConstraint } from '../utils/formLogic';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../hooks/useTranslation';

interface InteractiveQuestionProps {
  question: KoboQuestion;
  value: any;
  onChange: (name: string, value: any) => void;
  activeLang?: string;
  isWizardMode?: boolean; // Mode "Gros doigts" activé
  onAutoAdvance?: () => void; // Trigger pour passer à la suite
}

const InteractiveQuestion: React.FC<InteractiveQuestionProps> = ({ question, value, onChange, activeLang, isWizardMode = false, onAutoAdvance }) => {
    const { formValues, activeProject } = useProject();
    const [gpsLoading, setGpsLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    // Repeat Group State
    const [isAddingRepeat, setIsAddingRepeat] = useState(false);
    const [tempRepeatValues, setTempRepeatValues] = useState<any>({});
    const [repeatStep, setRepeatStep] = useState(0);

    if (!question) return null;

    const defaultLang = activeLang || activeProject?.formData.settings.default_language || 'fr';

    const { isValid, error } = validateConstraint(question.constraint, value, formValues);
    const constraintMessage = getLocalizedText(question.constraint_message, defaultLang);
    const appearance = question.appearance || '';
    
    // Styling constants
    const labelClass = isWizardMode 
        ? "block text-xl font-bold text-gray-900 dark:text-white mb-3 leading-tight" 
        : "block text-sm font-medium text-anthracite-gray dark:text-gray-200 mb-1";
        
    const hintClass = isWizardMode
        ? "mb-6 text-sm text-gray-500 dark:text-gray-400 italic border-l-4 border-indigo-200 pl-3"
        : "mb-2 text-xs text-gray-500 dark:text-gray-400 italic";

    const inputClass = isWizardMode
        ? "block w-full text-lg rounded-xl border-gray-300 shadow-sm focus:border-indigo-600 focus:ring-indigo-600 dark:bg-gray-800 dark:border-gray-600 p-4 border-2 transition-all"
        : "block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-indigo-deep focus:ring-indigo-deep dark:bg-gray-700 dark:border-gray-600 p-2 border transition-colors";

    const commonLabel = (
        <label htmlFor={question.name} className={labelClass}>
            {getLocalizedText(question.label, defaultLang)}
            {question.required && <span className="text-red-500 ml-1">*</span>}
        </label>
    );

    const hintText = getLocalizedText(question.hint, defaultLang);
    const commonHint = hintText && (
        <div className={hintClass}>{hintText}</div>
    );
    
    const commonError = !isValid && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-shake">
            <span className="text-red-500 text-lg">⚠️</span>
            <p className="text-sm text-red-600 font-semibold">
                {constraintMessage || error || 'Valeur invalide'}
            </p>
        </div>
    );

    // Handlers
    const handleGpsCapture = () => {
        if (!navigator.geolocation) {
            alert("La géolocalisation n'est pas supportée par votre appareil.");
            return;
        }
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, altitude, accuracy } = position.coords;
                const odkString = `${latitude} ${longitude} ${altitude || 0} ${accuracy}`;
                onChange(question.name, odkString);
                setGpsLoading(false);
            },
            (error) => {
                console.error("GPS Error", error);
                alert(`Erreur GPS: ${error.message}`);
                setGpsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onChange(question.name, reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // --- Audio Recording Logic ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                // Convert to base64 for storage in JSON (not ideal for large files but works for demo/offline)
                const reader = new FileReader();
                reader.onloadend = () => onChange(question.name, reader.result);
                reader.readAsDataURL(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            alert("Impossible d'accéder au microphone. Vérifiez les permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // --- Signature Logic ---
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const rect = canvas.getBoundingClientRect();
        // Support Touch and Mouse
        const clientX = ('touches' in e) ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = ('touches' in e) ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        e.preventDefault(); // Prevent scrolling while signing
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = ('touches' in e) ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = ('touches' in e) ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
        e.preventDefault();
    };

    const stopDrawing = () => {
        if (!isDrawing || !canvasRef.current) return;
        setIsDrawing(false);
        const canvas = canvasRef.current;
        onChange(question.name, canvas.toDataURL()); // Save as Base64 image
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            onChange(question.name, '');
        }
    };

    // --- RENDERERS ---

    switch (question.type) {
        case 'text':
            return (
                <div className="mb-4 animate-fadeIn">
                    {commonLabel}
                    {commonHint}
                    <textarea
                        name={question.name}
                        id={question.name}
                        value={value ?? ''}
                        onChange={(e) => onChange(question.name, e.target.value)}
                        className={inputClass}
                        required={question.required}
                        rows={appearance === 'multiline' || isWizardMode ? 4 : 2}
                        placeholder="Tapez votre réponse ici..."
                    />
                    {commonError}
                </div>
            );
        case 'integer':
        case 'decimal':
            return (
                <div className="mb-4 animate-fadeIn">
                    {commonLabel}
                    {commonHint}
                    <div className="relative">
                        <input
                            type="number"
                            name={question.name}
                            id={question.name}
                            value={value ?? ''}
                            onChange={(e) => onChange(question.name, e.target.value)}
                            className={inputClass}
                            required={question.required}
                            step={question.type === 'decimal' ? 'any' : '1'}
                            placeholder="0"
                        />
                        {appearance === 'thousands-sep' && value && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">
                                {Number(value).toLocaleString()}
                            </div>
                        )}
                    </div>
                    {commonError}
                </div>
            );
        case 'date':
            return (
                <div className="mb-4 animate-fadeIn">
                    {commonLabel}
                    {commonHint}
                    <input
                        type="date"
                        name={question.name}
                        id={question.name}
                        value={value ?? ''}
                        onChange={(e) => onChange(question.name, e.target.value)}
                        className={inputClass}
                        required={question.required}
                    />
                    {commonError}
                </div>
            );
        case 'time':
            return (
                <div className="mb-4 animate-fadeIn">
                    {commonLabel}
                    {commonHint}
                    <input
                        type="time"
                        name={question.name}
                        id={question.name}
                        value={value ?? ''}
                        onChange={(e) => onChange(question.name, e.target.value)}
                        className={inputClass}
                        required={question.required}
                    />
                    {commonError}
                </div>
            );
        
        case 'geopoint':
            return (
                <div className="mb-4 animate-fadeIn">
                    {commonLabel}
                    {commonHint}
                    <button 
                        onClick={handleGpsCapture} 
                        disabled={gpsLoading}
                        className={`w-full py-6 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${value ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-indigo-300 hover:bg-indigo-50'}`}
                    >
                        <span className="text-4xl mb-2">{gpsLoading ? '📡' : (value ? '✅' : '📍')}</span>
                        <span className={`font-bold ${value ? 'text-green-700' : 'text-indigo-600'}`}>
                            {gpsLoading ? 'Acquisition satellite...' : (value ? 'Localisation enregistrée' : 'Toucher pour localiser')}
                        </span>
                        {value && <span className="text-xs text-gray-500 font-mono mt-2">{value}</span>}
                    </button>
                    {commonError}
                </div>
            );

        case 'image':
            return (
                <div className="mb-4 animate-fadeIn">
                    {commonLabel}
                    {commonHint}
                    <div className="space-y-3">
                        <label className={`w-full cursor-pointer flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed transition-colors ${value ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                            {value ? (
                                <img src={value} alt="Preview" className="h-full object-contain rounded-lg" />
                            ) : (
                                <>
                                    <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <span className="text-sm font-medium text-gray-600">Prendre une photo</span>
                                </>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleImageCapture}
                                className="hidden"
                            />
                        </label>
                        {value && (
                            <button 
                                onClick={() => onChange(question.name, '')}
                                className="w-full py-2 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-50"
                            >
                                Supprimer la photo
                            </button>
                        )}
                    </div>
                    {commonError}
                </div>
            );

        case 'audio':
            return (
                <div className="mb-4 animate-fadeIn">
                    {commonLabel}
                    {commonHint}
                    <div className="flex flex-col items-center gap-4 p-6 border-2 border-gray-200 rounded-xl bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
                        {value ? (
                            <div className="w-full animate-fadeIn">
                                <audio src={value} controls className="w-full mb-4" />
                                <button onClick={() => onChange(question.name, '')} className="text-sm text-red-500 hover:text-red-700 font-medium w-full text-center border border-red-200 rounded-lg py-2">
                                    Supprimer et réenregistrer
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-95 ${isRecording ? 'bg-red-600 animate-pulse ring-4 ring-red-200' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                                {isRecording ? (
                                    <div className="w-8 h-8 bg-white rounded-sm"></div>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                )}
                            </button>
                        )}
                        <p className={`text-sm font-bold ${isRecording ? 'text-red-600' : 'text-gray-500'}`}>
                            {isRecording ? "Enregistrement en cours... (Appuyez pour arrêter)" : (value ? "Audio enregistré" : "Appuyez pour enregistrer")}
                        </p>
                    </div>
                    {commonError}
                </div>
            );

        case 'signature':
            return (
                <div className="mb-4 animate-fadeIn">
                    {commonLabel}
                    {commonHint}
                    <div className="border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white overflow-hidden relative touch-none shadow-sm">
                        {value ? (
                            <div className="relative bg-white">
                                <img src={value} alt="Signature" className="w-full h-48 object-contain" />
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold">Signé</span>
                                    <button 
                                        onClick={() => onChange(question.name, '')}
                                        className="bg-white border border-red-200 text-red-600 px-2 py-1 rounded text-xs shadow-sm hover:bg-red-50"
                                    >
                                        Recommencer
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <canvas
                                    ref={canvasRef}
                                    width={window.innerWidth > 400 ? 400 : 300}
                                    height={200}
                                    className="w-full h-48 cursor-crosshair bg-white"
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                />
                                {!isDrawing && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <p className="text-gray-300 text-xl font-bold uppercase tracking-widest opacity-50">Signez ici</p>
                                    </div>
                                )}
                                <div className="absolute bottom-2 right-2">
                                    <button onClick={clearSignature} className="text-xs text-gray-500 hover:text-red-500 bg-gray-100 px-2 py-1 rounded border">Effacer</button>
                                </div>
                            </>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">Utilisez votre doigt ou un stylet</p>
                    {commonError}
                </div>
            );

        case 'select_one':
            // Logique d'Apparence
            const isMinimal = appearance === 'minimal';
            const isHorizontal = appearance === 'horizontal' || appearance === 'horizontal-compact';
            const shouldUseDropdown = (question.choices && question.choices.length > 5 && !isHorizontal) || isMinimal;

            return (
                <div className="mb-4 animate-fadeIn">
                    {commonLabel}
                    {commonHint}
                    
                    {shouldUseDropdown ? (
                        // MODE DROPDOWN
                        <div className="relative">
                            <select
                                value={value || ''}
                                onChange={(e) => {
                                    onChange(question.name, e.target.value);
                                    if (onAutoAdvance && e.target.value) onAutoAdvance();
                                }}
                                className={inputClass + " appearance-none"}
                            >
                                <option value="">-- Sélectionner une option --</option>
                                {question.choices?.map(choice => (
                                    <option key={choice.uid} value={choice.name}>
                                        {getLocalizedText(choice.label, defaultLang)}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                        </div>
                    ) : (
                        // MODE CARTES / RADIOS
                        <div className={`grid gap-3 ${isHorizontal ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'}`}>
                            {question.choices?.map(choice => {
                                const isSelected = value === choice.name;
                                return (
                                    <div 
                                        key={choice.uid} 
                                        onClick={() => {
                                            onChange(question.name, choice.name);
                                            if (onAutoAdvance) onAutoAdvance();
                                        }}
                                        className={`
                                            cursor-pointer relative p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4
                                            ${isSelected 
                                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-md transform scale-[1.01]' 
                                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 hover:bg-gray-50'
                                            }
                                            ${isHorizontal ? 'flex-col text-center justify-center gap-2' : ''}
                                        `}
                                    >
                                        <div className={`
                                            w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                            ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-400'}
                                        `}>
                                            {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                        </div>
                                        <span className={`text-base font-medium ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-700 dark:text-gray-200'}`}>
                                            {getLocalizedText(choice.label, defaultLang)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                     {commonError}
                </div>
            );

        case 'select_multiple':
             const selectedValues = (value || '').split(' ').filter(Boolean);
             const handleMultiSelectChange = (choiceName: string) => {
                 const newValues = selectedValues.includes(choiceName)
                    ? selectedValues.filter((v: string) => v !== choiceName)
                    : [...selectedValues, choiceName];
                 onChange(question.name, newValues.join(' '));
             };
             
             const isHorizontalMulti = appearance === 'horizontal' || appearance === 'horizontal-compact';

             return (
                 <div className="mb-4 animate-fadeIn">
                     {commonLabel}
                     {commonHint}
                     <div className={`grid gap-3 ${isHorizontalMulti ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1'}`}>
                         {question.choices?.map(choice => {
                             const isSelected = selectedValues.includes(choice.name);
                             return (
                                <div 
                                    key={choice.uid} 
                                    onClick={() => handleMultiSelectChange(choice.name)}
                                    className={`
                                        cursor-pointer relative p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4
                                        ${isSelected 
                                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm' 
                                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50'
                                        }
                                        ${isHorizontalMulti ? 'flex-col text-center justify-center gap-2' : ''}
                                    `}
                                >
                                     <div className={`
                                        w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                                        ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-400'}
                                    `}>
                                        {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                    <span className={`text-base font-medium ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-700 dark:text-gray-200'}`}>
                                        {getLocalizedText(choice.label, defaultLang)}
                                    </span>
                                 </div>
                             );
                         })}
                     </div>
                      {commonError}
                 </div>
             );

        case 'note':
            return (
                <div className="mb-6 p-5 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-xl shadow-sm">
                    <div className="flex items-start gap-3">
                        <span className="text-2xl">ℹ️</span>
                        <div className="text-base text-blue-900 dark:text-blue-200 leading-relaxed">
                            {getLocalizedText(question.label, defaultLang)}
                        </div>
                    </div>
                </div>
            );
        
        case 'begin_group':
            // Rendu visuel d'une section (pour le wizard)
            return (
                <div className="mb-8 text-center animate-slideIn">
                    <div className="inline-block p-4 bg-indigo-100 dark:bg-indigo-900 rounded-full mb-3">
                        <span className="text-3xl">📂</span>
                    </div>
                    <h2 className="text-2xl font-bold text-indigo-900 dark:text-white mb-2">
                        {getLocalizedText(question.label, defaultLang)}
                    </h2>
                    <div className="h-1 w-24 bg-indigo-500 mx-auto rounded-full"></div>
                    <p className="text-gray-500 mt-2">Nouvelle section</p>
                    
                    {onAutoAdvance && (
                        <button onClick={onAutoAdvance} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-md hover:bg-indigo-700">
                            Commencer la section
                        </button>
                    )}
                </div>
            );

        case 'begin_repeat':
            // --- REPEAT GROUP LOGIC (Nested Wizard) ---
            const currentList = Array.isArray(value) ? value : [];
            
            // --- Rendu Modal / Sub-Wizard ---
            if (isAddingRepeat) {
                const children = question.children || [];
                const currentSubQuestion = children[repeatStep];
                const isSubEnd = repeatStep >= children.length;

                const handleSubNext = () => {
                    if (repeatStep < children.length) {
                        setRepeatStep(prev => prev + 1);
                    }
                };

                const handleSubPrev = () => {
                    if (repeatStep > 0) setRepeatStep(prev => prev - 1);
                };

                const handleSubFinish = () => {
                    const newList = [...currentList, tempRepeatValues];
                    onChange(question.name, newList);
                    setIsAddingRepeat(false);
                    setTempRepeatValues({});
                    setRepeatStep(0);
                };

                return (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                                <h3 className="font-bold">{getLocalizedText(question.label, defaultLang)} (Ajout)</h3>
                                <button onClick={() => setIsAddingRepeat(false)} className="text-white/80 hover:text-white">✕</button>
                            </div>
                            
                            <div className="flex-1 p-6 overflow-y-auto">
                                {!isSubEnd && currentSubQuestion ? (
                                    <div className="animate-fadeIn">
                                        <div className="mb-2 flex justify-between text-xs text-gray-400 uppercase font-bold">
                                            <span>Question {repeatStep + 1} / {children.length}</span>
                                        </div>
                                        <InteractiveQuestion 
                                            question={currentSubQuestion}
                                            value={tempRepeatValues[currentSubQuestion.name]}
                                            onChange={(name, val) => setTempRepeatValues((prev: any) => ({...prev, [name]: val}))}
                                            isWizardMode={true}
                                            activeLang={activeLang}
                                            onAutoAdvance={() => setTimeout(handleSubNext, 300)}
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-5xl mb-4">✅</div>
                                        <h4 className="text-xl font-bold mb-2">Saisie terminée</h4>
                                        <p className="text-gray-500 mb-6">Voulez-vous ajouter cet élément à la liste ?</p>
                                        <button onClick={handleSubFinish} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700">
                                            Confirmer l'ajout
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 flex justify-between">
                                <button 
                                    onClick={handleSubPrev} 
                                    disabled={repeatStep === 0}
                                    className="px-4 py-2 rounded-lg text-gray-600 bg-gray-200 disabled:opacity-50"
                                >
                                    Précédent
                                </button>
                                {!isSubEnd && (
                                    <button 
                                        onClick={handleSubNext}
                                        className="px-4 py-2 rounded-lg text-white bg-indigo-600"
                                    >
                                        Suivant
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            }

            // --- Rendu Liste Principale ---
            return (
                <div className="mb-6 animate-fadeIn">
                    {commonLabel}
                    {commonHint}
                    
                    <div className="space-y-3 mb-4">
                        {currentList.map((item: any, idx: number) => (
                            <div key={idx} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm flex justify-between items-center">
                                <div>
                                    <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-gray-500">#{idx + 1}</span>
                                    <span className="ml-2 font-medium text-gray-800 dark:text-white">
                                        {/* Try to find a meaningful label from the first value */}
                                        {Object.values(item)[0] as string || 'Élément'}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => {
                                        const newList = currentList.filter((_: any, i: number) => i !== idx);
                                        onChange(question.name, newList);
                                    }}
                                    className="text-red-500 p-2 hover:bg-red-50 rounded-full"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                        {currentList.length === 0 && (
                            <div className="p-6 text-center border-2 border-dashed border-gray-300 rounded-xl text-gray-400">
                                Aucune donnée saisie
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => setIsAddingRepeat(true)}
                        className="w-full py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 flex items-center justify-center gap-2 transition-colors"
                    >
                        <span className="text-xl">+</span> Ajouter un élément
                    </button>
                </div>
            );
            
        default:
            return <div className="mb-4 p-4 text-sm text-red-500 bg-red-50 rounded-xl border border-red-200">Type non supporté dans le wizard: {question.type}</div>;
    }
};

export default InteractiveQuestion;
