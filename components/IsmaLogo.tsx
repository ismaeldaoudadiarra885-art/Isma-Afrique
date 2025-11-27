
import React from 'react';

interface IsmaLogoProps {
    className?: string;
    showText?: boolean;
    variant?: 'light' | 'dark' | 'color';
}

const IsmaLogo: React.FC<IsmaLogoProps> = ({ className = "w-12 h-12", showText = true, variant = 'color' }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <svg viewBox="0 0 100 100" className="h-full w-auto flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Fond Circulaire (Optionnel, pour icône d'app) */}
                <defs>
                    <linearGradient id="ismaGradient" x1="0" y1="0" x2="100" y2="100">
                        <stop offset="0%" stopColor="#4F46E5" /> {/* Indigo-600 */}
                        <stop offset="100%" stopColor="#3730A3" /> {/* Indigo-800 */}
                    </linearGradient>
                    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                        <feOffset dx="1" dy="2" result="offsetblur"/>
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.3"/>
                        </feComponentTransfer>
                        <feMerge> 
                            <feMergeNode/>
                            <feMergeNode in="SourceGraphic"/> 
                        </feMerge>
                    </filter>
                </defs>

                {/* Forme du Logo : Un graphique stylisé formant un "S" et "M" abstraits dans un bouclier */}
                <path d="M20 20 H80 V80 H20 Z" fill="none" /> {/* Bounding box debug */}
                
                {/* Barres de données (Représentant la statistique) */}
                <rect x="25" y="45" width="12" height="35" rx="2" fill="#F59E0B" filter="url(#dropShadow)" /> {/* Barre Orange (Or) */}
                <rect x="44" y="30" width="12" height="50" rx="2" fill="url(#ismaGradient)" filter="url(#dropShadow)" /> {/* Barre Indigo */}
                <rect x="63" y="15" width="12" height="65" rx="2" fill="#10B981" filter="url(#dropShadow)" /> {/* Barre Verte (Croissance) */}

                {/* Arche de protection (Souveraineté) */}
                <path d="M15 50 C 15 20, 85 20, 85 50 V 85 H 15 V 50" stroke="currentColor" strokeWidth="6" strokeLinecap="round" className={variant === 'dark' ? 'text-white' : 'text-indigo-900 dark:text-white'} fill="none" opacity="0.2" />
                
                {/* Point focal (Afrique/Localisation) */}
                <circle cx="82" cy="18" r="6" fill="#EF4444" />
            </svg>
            
            {showText && (
                <div className="flex flex-col justify-center">
                    <span className={`font-black tracking-tighter leading-none ${variant === 'light' ? 'text-white' : 'text-indigo-900 dark:text-white'}`} style={{fontSize: '120%'}}>
                        ISMA
                    </span>
                    <span className={`text-[0.4em] uppercase tracking-[0.2em] font-bold ${variant === 'light' ? 'text-indigo-200' : 'text-indigo-500 dark:text-indigo-300'}`}>
                        Afrique
                    </span>
                </div>
            )}
        </div>
    );
};

export default IsmaLogo;
