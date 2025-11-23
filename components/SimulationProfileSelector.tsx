import React, { useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { simulationProfiles } from '../data/simulationProfiles';
import { SimulationProfile } from '../types';

interface SimulationProfileSelectorProps {
    onSelect: (profile: SimulationProfile | null) => void;
}

const SimulationProfileSelector: React.FC<SimulationProfileSelectorProps> = ({ onSelect }) => {
    const { simulationProfile, setSimulationProfile } = useProject();
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (profile: SimulationProfile | null) => {
        setSimulationProfile(profile);
        onSelect(profile);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded-md"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg">{simulationProfile?.emoji || '👤'}</span>
                    <span className="text-sm font-medium">{simulationProfile?.name || 'Aucun profil sélectionné'}</span>
                </div>
                 <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && (
                <ul className="absolute bottom-full mb-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-10 max-h-60 overflow-y-auto" role="listbox">
                    <li role="option" aria-selected={!simulationProfile}>
                        <button onClick={() => handleSelect(null)} className="w-full text-left flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <span className="text-lg">👤</span>
                            <span className="text-sm">Aucun profil</span>
                        </button>
                    </li>
                    {simulationProfiles.map(profile => (
                        <li key={profile.id} role="option" aria-selected={simulationProfile?.id === profile.id}>
                            <button
                                onClick={() => handleSelect(profile)}
                                className="w-full text-left flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <span className="text-lg">{profile.emoji}</span>
                                <div>
                                    <p className="text-sm font-medium">{profile.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{profile.description}</p>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SimulationProfileSelector;