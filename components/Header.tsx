
import React, { useState, useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import ProjectSwitcherModal from './ProjectSwitcherModal';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../hooks/useTranslation';
import IsmaLogo from './IsmaLogo';

interface HeaderProps {
    viewMode: 'designer' | 'collecte' | 'review';
    setViewMode: (mode: 'designer' | 'collecte' | 'review') => void;
    canDesign: boolean;
    canManageUsers: boolean;
    onManageUsers: () => void;
}

const Header: React.FC<HeaderProps> = ({ viewMode, setViewMode, canDesign, onManageUsers, canManageUsers }) => {
    const { activeProject, closeProject, currentUserName, setUserRole, userRole, isOnline } = useProject();
    const { theme, toggleTheme } = useTheme();
    const { t } = useLanguage();
    const [isSwitcherOpen, setSwitcherOpen] = useState(false);
    const [installPrompt, setInstallPrompt] = useState<any>(null);

    // PWA Install Logic
    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = () => {
        if (installPrompt) {
            installPrompt.prompt();
            installPrompt.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                    setInstallPrompt(null);
                }
            });
        }
    };

    const handleHomeClick = () => {
        if (canDesign) {
            // Pour les managers : Ouvrir le menu de gestion (les 4 boutons sont là)
            setSwitcherOpen(true);
        } else {
            // Pour les enquêteurs : Confirmation simple pour déconnexion/changement
            if (window.confirm("Voulez-vous retourner à l'écran de connexion ?")) {
                setUserRole(null);
            }
        }
    };
    
    const viewModeStyles = "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all";
    const activeViewModeStyles = "bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm transform scale-105 border border-gray-200 dark:border-gray-600";
    const inactiveViewModeStyles = "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700/50";

    return (
        <>
            <header className={`flex items-center justify-between px-4 py-3 border-b shadow-sm flex-shrink-0 z-30 ${!isOnline ? 'bg-red-50 border-red-200' : 'bg-gray-100 dark:bg-gray-800 dark:border-gray-700'}`}>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleHomeClick} 
                        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all group active:scale-95"
                        title={canDesign ? "Menu Principal (Projets)" : "Déconnexion"}
                    >
                       <IsmaLogo className="h-8 w-auto" showText={false} />
                       <span className="font-bold text-xs hidden sm:inline text-gray-600 dark:text-gray-300">
                           {canDesign ? "Menu Principal" : "Retour"}
                       </span>
                    </button>

                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

                    <div>
                        <h1 className="font-bold text-gray-800 dark:text-white text-sm leading-tight truncate max-w-[150px] sm:max-w-xs">
                            {activeProject?.name || 'ISMA'}
                        </h1>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 bg-gray-200 dark:bg-gray-700 px-1.5 rounded-full">
                                v{activeProject?.formData.settings.version || '1.0'}
                            </span>
                            {!isOnline && (
                                <span className="text-[10px] font-bold text-red-600 bg-red-100 px-1.5 rounded-full border border-red-200 animate-pulse">
                                    HORS-LIGNE
                                </span>
                            )}
                            {installPrompt && (
                                <button 
                                    onClick={handleInstallClick} 
                                    className="text-[10px] font-bold text-white bg-indigo-600 px-2 py-0.5 rounded-full shadow-sm hover:bg-indigo-700 animate-bounce"
                                >
                                    ⬇️ Installer App
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {canDesign && (
                        <div className="flex bg-gray-200 dark:bg-gray-700/50 p-1 rounded-lg mr-2">
                            <button 
                                onClick={() => setViewMode('designer')}
                                className={`${viewModeStyles} ${viewMode === 'designer' ? activeViewModeStyles : inactiveViewModeStyles}`}
                            >
                                {t('header_designer')}
                            </button>
                            <button 
                                onClick={() => setViewMode('collecte')}
                                className={`${viewModeStyles} ${viewMode === 'collecte' ? activeViewModeStyles : inactiveViewModeStyles}`}
                            >
                                {t('header_collecte')}
                            </button>
                        </div>
                    )}

                    {canManageUsers && (
                        <button 
                            onClick={onManageUsers}
                            className="hidden sm:flex items-center gap-1 px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                            title="Gérer les utilisateurs"
                        >
                            <span>👥</span>
                            <span>Équipe</span>
                        </button>
                    )}

                    <button 
                        onClick={toggleTheme} 
                        className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                        title="Changer le thème"
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>
                    
                    <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs cursor-pointer hover:ring-2 ring-indigo-400 transition-all" title={currentUserName || 'Utilisateur'}>
                        {(currentUserName || 'U').charAt(0).toUpperCase()}
                    </div>
                </div>
            </header>

            <ProjectSwitcherModal isOpen={isSwitcherOpen} onClose={() => setSwitcherOpen(false)} />
        </>
    );
};

export default Header;
