
import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { getAssistance } from '../services/geminiService';
import { handleFunctionCalls } from '../utils/formActionHandler';
import { AiRole, AiRoleInfo } from '../types';
import { AI_ROLES } from '../constants';
import { useLanguage } from '../hooks/useTranslation';
import { Content } from '@google/genai';

// Types for speech recognition and synthesis
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
    isFinal: boolean;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

const ChatAgent: React.FC = () => {
    const projectContext = useProject();
    const { activeProject, currentQuestion, formValues, isOnline, updateChatHistory } = projectContext;
    const { t } = useLanguage();

    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeRoles, setActiveRoles] = useState<AiRole[]>([]);
    const [isFormGenerationMode, setIsFormGenerationMode] = useState(false);
    const [conversationDepth, setConversationDepth] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null);

    const chatHistory = activeProject?.chatHistory || [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);
    
    const handleRoleToggle = (roleId: AiRole) => {
        setActiveRoles(prev => 
            prev.includes(roleId) ? prev.filter(r => r !== roleId) : [...prev, roleId]
        );
    };

    const handleSend = async () => {
        if (!userInput.trim() || isLoading || !activeProject) return;

        const userMessage: Content = { role: 'user', parts: [{ text: userInput }] };
        const updatedHistory = [...chatHistory, userMessage];
        updateChatHistory(updatedHistory);
        setUserInput('');
        setIsLoading(true);
        setConversationDepth(prev => prev + 1);

        try {
            const response = await getAssistance(userInput, updatedHistory, activeRoles, activeProject, currentQuestion || undefined, formValues, isFormGenerationMode, conversationDepth);

            let newHistory = [...updatedHistory];

            if (response.functionCalls && response.functionCalls.length > 0) {
                const confirmations = await handleFunctionCalls(response.functionCalls, projectContext, activeProject, (prompt) => getAssistance(prompt, newHistory, activeRoles, activeProject, undefined, undefined, isFormGenerationMode, conversationDepth));
                const toolResponse: Content = { role: 'model', parts: [{ text: `Actions effectuées: ${confirmations.join(', ')}` }] };
                newHistory.push(toolResponse);
            }

            if(response.text) {
                const aiResponse: Content = { role: 'model', parts: [{ text: response.text }] };
                newHistory.push(aiResponse);
                // Auto-speak AI response
                if ('speechSynthesis' in window) {
                    // Cancel any ongoing speech
                    (window as any).speechSynthesis.cancel();

                    const utterance = new (window as any).SpeechSynthesisUtterance(response.text);
                    utterance.lang = 'fr-FR'; // French
                    utterance.rate = 0.9;
                    utterance.pitch = 1;

                    utterance.onstart = () => setIsSpeaking(true);
                    utterance.onend = () => setIsSpeaking(false);
                    utterance.onerror = () => setIsSpeaking(false);

                    (window as any).speechSynthesis.speak(utterance);
                }
            }

            updateChatHistory(newHistory);

        } catch (error: any) {
            console.error("Error with Gemini API:", error);
            const errorMessage: Content = { role: 'model', parts: [{ text: `Désolé, une erreur est survenue: ${error.message}` }]};
            updateChatHistory([...updatedHistory, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVoiceInput = () => {
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
            } catch (error) {
                console.error('Error starting speech recognition:', error);
            }
        } else if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    };



    return (
        <div className="flex flex-col h-full p-4">
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">{t('aiAgent_personas')}</h3>
                    <button
                        onClick={() => setIsFormGenerationMode(!isFormGenerationMode)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            isFormGenerationMode
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                        title={isFormGenerationMode ? 'Mode génération activé' : 'Activer mode génération de formulaire'}
                    >
                        {isFormGenerationMode ? '🛠️ Génération' : '💬 Édition'}
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {AI_ROLES.map((role: AiRoleInfo) => (
                        <button
                            key={role.id}
                            id={`btnPersona${role.id.charAt(0).toUpperCase() + role.id.slice(1)}`}
                            onClick={() => handleRoleToggle(role.id)}
                            className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 transition-colors ${
                                activeRoles.includes(role.id)
                                ? 'bg-indigo-deep text-white'
                                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                            title={role.description}
                            aria-label={`Activer/désactiver le persona ${role.name}`}
                        >
                           {role.emoji} {role.name}
                        </button>
                    ))}
                </div>
                {isFormGenerationMode && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                        <p className="text-xs text-green-700 dark:text-green-300">
                            Mode génération activé : Discutez naturellement pour construire votre formulaire étape par étape !
                        </p>
                    </div>
                )}
            </div>
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-lg max-w-xs lg:max-w-sm ${
                            msg.role === 'user' 
                            ? 'bg-indigo-deep text-white' 
                            : 'bg-blue-light-ai/20 dark:bg-blue-light-ai/30'
                        }`}>
                           <p className="text-sm">{msg.parts[0].text}</p>
                        </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex justify-start">
                        <div className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700">
                           <div className="animate-pulse flex space-x-1">
                                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                           </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-auto">
                {isOnline ? (
                    <div className="space-y-2">
                        {isFormGenerationMode && (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                💡 Essayez : "Crée-moi un formulaire d'enquête ménage avec âge, sexe et région"
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={isFormGenerationMode ? "Décrivez votre formulaire..." : t('aiAgent_placeholder')}
                                className="flex-1 block text-sm rounded-md border-gray-300 shadow-sm dark:bg-gray-900 dark:border-gray-600 focus:border-indigo-deep focus:ring-indigo-deep"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleVoiceInput}
                                disabled={isLoading}
                                className={`px-3 py-2 text-sm font-medium rounded-md ${
                                    isListening
                                        ? 'bg-red-500 text-white animate-pulse'
                                        : 'bg-green-500 text-white hover:bg-green-600'
                                }`}
                                title={isListening ? 'Arrêter l\'écoute' : 'Commencer l\'écoute vocale'}
                            >
                                {isListening ? '🎤' : '🎙️'}
                            </button>
                            <button onClick={handleSend} disabled={isLoading || !userInput.trim()} className="px-4 py-2 text-sm font-medium text-white bg-indigo-deep rounded-md hover:bg-indigo-deep-dark disabled:opacity-50">
                               {isLoading ? t('aiAgent_sending') : t('aiAgent_send')}
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-sm text-gray-500 p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-md">
                        {t('aiAgent_offline_message')}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ChatAgent;