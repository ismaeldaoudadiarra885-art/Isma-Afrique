
import React, { useState, useMemo } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { getLocalizedText } from '../utils/localizationUtils';

const MediaGallery: React.FC = () => {
    const { activeProject } = useProject();
    const [filterAgent, setFilterAgent] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [selectedMedia, setSelectedMedia] = useState<any | null>(null); // Pour la Lightbox

    const mediaItems = useMemo(() => {
        if (!activeProject) return [];
        const { submissions, formData } = activeProject;
        const defaultLang = formData.settings.default_language || 'default';
        const items: any[] = [];

        // Identifier les questions de type média
        const mediaQuestions = formData.survey.filter(q => ['image', 'audio', 'signature'].includes(q.type));

        submissions.forEach(sub => {
            mediaQuestions.forEach(q => {
                const value = sub.data[q.name];
                if (value && typeof value === 'string' && value.startsWith('data:')) {
                    items.push({
                        id: `${sub.id}_${q.name}`,
                        submissionId: sub.id,
                        type: q.type, // image, audio, signature
                        data: value,
                        label: getLocalizedText(q.label, defaultLang),
                        agent: sub.metadata?.agentName || 'Inconnu',
                        date: sub.timestamp,
                        questionName: q.name
                    });
                }
            });
        });

        return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [activeProject]);

    const filteredItems = useMemo(() => {
        return mediaItems.filter(item => {
            const matchAgent = filterAgent === 'all' || item.agent === filterAgent;
            const matchType = filterType === 'all' || item.type === filterType;
            return matchAgent && matchType;
        });
    }, [mediaItems, filterAgent, filterType]);

    const uniqueAgents = Array.from(new Set(mediaItems.map(i => i.agent)));

    if (!activeProject) return null;

    return (
        <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900">
            {/* Filtres */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 shadow-sm flex flex-wrap gap-4 items-center">
                <h3 className="font-bold text-gray-800 dark:text-white mr-4">Galerie Média</h3>
                
                <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                    className="text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 p-1.5"
                >
                    <option value="all">Tous les types</option>
                    <option value="image">Photos</option>
                    <option value="audio">Audio</option>
                    <option value="signature">Signatures</option>
                </select>

                <select 
                    value={filterAgent} 
                    onChange={(e) => setFilterAgent(e.target.value)}
                    className="text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 p-1.5"
                >
                    <option value="all">Tous les agents</option>
                    {uniqueAgents.map(agent => (
                        <option key={agent} value={agent}>{agent}</option>
                    ))}
                </select>

                <div className="ml-auto text-xs text-gray-500">
                    {filteredItems.length} éléments trouvés
                </div>
            </div>

            {/* Grille */}
            <div className="flex-1 overflow-y-auto p-4">
                {filteredItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <span className="text-4xl mb-2">🖼️</span>
                        <p>Aucun média trouvé.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredItems.map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => item.type !== 'audio' && setSelectedMedia(item)}
                                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col ${item.type !== 'audio' ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                            >
                                <div className="aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center relative group">
                                    {item.type === 'image' || item.type === 'signature' ? (
                                        <img 
                                            src={item.data} 
                                            alt={item.label} 
                                            className={`max-h-full max-w-full object-contain ${item.type === 'signature' ? 'p-4 opacity-80' : ''}`} 
                                        />
                                    ) : (
                                        <div className="w-full p-4">
                                            <audio controls src={item.data} className="w-full" />
                                        </div>
                                    )}
                                    
                                    {/* Overlay Type Icon */}
                                    <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded text-xs">
                                        {item.type === 'image' && '📷'}
                                        {item.type === 'audio' && '🎤'}
                                        {item.type === 'signature' && '✍️'}
                                    </div>
                                </div>
                                
                                <div className="p-3 text-xs">
                                    <p className="font-bold text-gray-800 dark:text-gray-200 truncate" title={item.label}>{item.label}</p>
                                    <p className="text-gray-500 font-mono truncate" title={item.questionName}>{item.questionName}</p>
                                    <div className="mt-2 flex justify-between items-center text-gray-400">
                                        <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded truncate max-w-[80px]">{item.agent}</span>
                                        <span>{new Date(item.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox (Plein écran) */}
            {selectedMedia && (
                <div 
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedMedia(null)}
                >
                    <button className="absolute top-4 right-4 text-white p-2 bg-white/20 rounded-full hover:bg-white/30">✕</button>
                    
                    <div className="max-w-4xl max-h-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <img 
                            src={selectedMedia.data} 
                            alt={selectedMedia.label} 
                            className={`max-h-[80vh] max-w-full object-contain rounded-lg ${selectedMedia.type === 'signature' ? 'bg-white p-4' : ''}`}
                        />
                        <div className="mt-4 text-white text-center">
                            <h3 className="text-xl font-bold">{selectedMedia.label}</h3>
                            <p className="text-gray-300 text-sm mt-1">
                                Agent: {selectedMedia.agent} • {new Date(selectedMedia.date).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaGallery;
