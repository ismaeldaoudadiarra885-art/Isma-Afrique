
import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { getDataAnalysisInsight } from '../services/geminiService';
import { ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useLanguage } from '../hooks/useTranslation';

const DataAnalysisChat: React.FC = () => {
    const { activeProject, updateAnalysisChatHistory } = useProject();
    const { t } = useLanguage();
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const chatHistory = activeProject?.analysisChatHistory || [];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleSend = async () => {
        if (!userInput.trim() || isLoading || !activeProject) return;

        const userMessage: ChatMessage = { id: uuidv4(), sender: 'user', text: userInput };
        const loadingMessage: ChatMessage = { id: uuidv4(), sender: 'ai', text: '', isLoading: true };
        
        updateAnalysisChatHistory([...chatHistory, userMessage, loadingMessage]);
        setUserInput('');
        setIsLoading(true);

        try {
            const responseText = await getDataAnalysisInsight(userInput, activeProject);
            const aiResponse: ChatMessage = { id: uuidv4(), sender: 'ai', text: responseText };
            updateAnalysisChatHistory([...chatHistory, userMessage, aiResponse]);
        } catch (error: any) {
            const errorMessage: ChatMessage = { id: uuidv4(), sender: 'ai', text: `Erreur: ${error.message}` };
            updateAnalysisChatHistory([...chatHistory, userMessage, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full p-4">
            <h3 className="text-lg font-semibold mb-4">{t('dataChat_title')}</h3>
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                {chatHistory.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-lg max-w-md ${
                            msg.sender === 'user' 
                            ? 'bg-indigo-deep text-white' 
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}>
                           {msg.isLoading ? (
                               <div className="animate-pulse flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                               </div>
                           ) : (
                               <div className="prose prose-sm dark:prose-invert max-w-full" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}/>
                           )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-auto">
                 <div className="flex gap-2">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={t('dataChat_placeholder')}
                        className="flex-1 block text-sm rounded-md border-gray-300 shadow-sm dark:bg-gray-900 dark:border-gray-600 focus:border-indigo-deep focus:ring-indigo-deep"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading || !userInput.trim()} className="px-4 py-2 text-sm font-medium text-white bg-indigo-deep rounded-md hover:bg-indigo-deep-dark disabled:opacity-50">
                       {t('dataChat_sendMessage')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataAnalysisChat;