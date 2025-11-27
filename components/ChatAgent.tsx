
import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { getAssistance } from '../services/geminiService';
import { handleFunctionCalls } from '../utils/formActionHandler';
import { AiRole, AiRoleInfo } from '../types';
import { AI_ROLES } from '../constants';
import { useLanguage } from '../hooks/useTranslation';
import { Content } from '@google/genai';

const ChatAgent: React.FC = () => {
    const projectContext = useProject();
    const { activeProject, currentQuestion, formValues, isOnline, updateChatHistory } = projectContext;
    const { t } = useLanguage();

    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [activeRoles, setActiveRoles] = useState<AiRole[]>(['agent_technique', 'architecte_formulaire']);
    const [showPersonaConfig, setShowPersonaConfig] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const chatHistory = activeProject?.chatHistory || [];

    // Suggestions intelligentes basées sur la dernière question ou le contexte
    const [suggestions, setSuggestions] = useState<string[]>([
        "Ajoute une section 'Identification'",
        "Vérifie la logique du formulaire",
        "Traduis les questions en Bambara",
        "Ajoute une note de fin"
    ]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isLoading]);
    
    // Mise à jour des suggestions contextuelles
    useEffect(() => {
        if (currentQuestion) {
            setSuggestions([
                `Rends "${currentQuestion.name}" obligatoire`,
                `Ajoute une condition (relevant) à "${currentQuestion.name}"`,
                `Ajoute une question 'Autre' après`,
                "Vérifie les fautes d'orthographe"
            ]);
        } else if (activeProject?.formData.survey.length === 0) {
            setSuggestions([
                "Génère un questionnaire de santé complet",
                "Crée une structure pour un recensement",
                "Ajoute les questions de géolocalisation",
            ]);
        }
    }, [currentQuestion, activeProject?.formData.survey.length]);

    const handleRoleToggle = (roleId: AiRole) => {
        setActiveRoles(prev => 
            prev.includes(roleId) ? prev.filter(r => r !== roleId) : [...prev, roleId]
        );
    };

    const executePrompt = async (text: string) => {
        if (!text.trim() || isLoading || !activeProject) return;
        
        const userMessage: Content = { role: 'user', parts: [{ text: text }] };
        const updatedHistory = [...chatHistory, userMessage];
        updateChatHistory(updatedHistory);
        setUserInput('');
        setIsLoading(true);
        setLoadingStatus("Analyse de la demande...");

        try {
            setLoadingStatus("Consultation des experts (IA)...");
            const response = await getAssistance(text, updatedHistory, activeRoles, activeProject, currentQuestion || undefined, formValues);
            
            let newHistory = [...updatedHistory];

            if (response.functionCalls && response.functionCalls.length > 0) {
                setLoadingStatus(`Exécution de ${response.functionCalls.length} actions...`);
                const confirmations = await handleFunctionCalls(response.functionCalls, projectContext, activeProject, (prompt) => getAssistance(prompt, newHistory, activeRoles, activeProject));
                
                // Formater proprement les actions pour l'affichage
                if (confirmations.length > 0) {
                    const toolResponse: Content = { 
                        role: 'model', 
                        parts: [{ text: `✅ **Actions effectuées :**\n${confirmations.map(c => `- ${c}`).join('\n')}` }] 
                    };
                    newHistory.push(toolResponse);
                }
            }

            if(response.text) {
                const aiResponse: Content = { role: 'model', parts: [{ text: response.text }] };
                newHistory.push(aiResponse);
            }
            
            updateChatHistory(newHistory);

        } catch (error: any) {
            console.error("Error with Gemini API:", error);
            const errorMessage: Content = { role: 'model', parts: [{ text: `⚠️ **Erreur :** Une erreur est survenue: ${error.message}` }]};
            updateChatHistory([...updatedHistory, errorMessage]);
        } finally {
            setIsLoading(false);
            setLoadingStatus('');
        }
    };

    const handleSend = () => executePrompt(userInput);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900/50">
            {/* Header Configuration Personas */}
            <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm z-10">
                <button 
                    onClick={() => setShowPersonaConfig(!showPersonaConfig)}
                    className="w-full flex justify-between items-center p-3 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <span className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Équipe IA ({activeRoles.length} experts)
                    </span>
                    <svg className={`w-4 h-4 transition-transform ${showPersonaConfig ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                
                {showPersonaConfig && (
                    <div className="p-3 grid grid-cols-2 gap-2 animate-fadeIn border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        {AI_ROLES.map((role: AiRoleInfo) => (
                            <button 
                                key={role.id}
                                onClick={() => handleRoleToggle(role.id)}
                                className={`px-2 py-1.5 text-xs rounded-md flex items-center gap-1.5 transition-all border ${
                                    activeRoles.includes(role.id)
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-700 dark:text-indigo-300 shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 opacity-70'
                                }`}
                                title={role.description}
                            >
                               <span className="text-base">{role.emoji}</span>
                               <span className="truncate">{role.name}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Zone de Chat */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {chatHistory.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-60">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-3xl mb-3">
                            🤖
                        </div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Je suis votre Architecte de Formulaire.</p>
                        <p className="text-xs text-gray-500 mt-1">Je peux créer, modifier, traduire et auditer pour vous.</p>
                    </div>
                )}

                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                            {/* Avatar */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-sm mt-1 ${
                                msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-700 text-indigo-600 border border-gray-200 dark:border-gray-600'
                            }`}>
                                {msg.role === 'user' ? 'Moi' : 'IA'}
                            </div>

                            {/* Bulle */}
                            <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'
                            }`}>
                               <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed whitespace-pre-wrap break-words">
                                   {msg.parts[0].text}
                               </div>
                            </div>
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex w-full justify-start animate-fadeIn">
                        <div className="flex max-w-[85%] flex-row gap-2">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-xs shadow-sm text-indigo-600">
                                IA
                            </div>
                            <div className="p-3 rounded-2xl rounded-tl-none bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
                               <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <div className="flex space-x-1">
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                                    </div>
                                    <span>{loadingStatus}</span>
                               </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions & Saisie */}
            <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 p-2">
                {/* Smart Chips */}
                {!isLoading && suggestions.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-1 px-1 scrollbar-thin">
                        {suggestions.map((s, i) => (
                            <button 
                                key={i}
                                onClick={() => executePrompt(s)}
                                className="flex-shrink-0 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors whitespace-nowrap"
                            >
                                ✨ {s}
                            </button>
                        ))}
                    </div>
                )}

                {isOnline ? (
                    <div className="relative">
                        <textarea
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder={t('aiAgent_placeholder')}
                            className="w-full pl-4 pr-12 py-3 text-sm bg-gray-100 dark:bg-gray-900 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 rounded-xl resize-none shadow-inner transition-all focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
                            rows={1}
                            style={{minHeight: '44px', maxHeight: '120px'}}
                            disabled={isLoading}
                        />
                        <button 
                            onClick={handleSend} 
                            disabled={isLoading || !userInput.trim()} 
                            className="absolute right-2 bottom-2 p-1.5 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 transition-colors shadow-sm"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                           </svg>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" /></svg>
                        {t('aiAgent_offline_message')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatAgent;
