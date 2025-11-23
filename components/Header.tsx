
import React, { useState, useRef } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useNotification } from '../contexts/NotificationContext';
import ProjectSwitcherModal from './ProjectSwitcherModal';
import BrandingSettingsModal from './BrandingSettingsModal';
import RegionalSettingsModal from './RegionalSettingsModal';
import DeploymentModal from './DeploymentModal';
import ImportStatusModal from './ImportStatusModal';
import { importProjectFromWordFile } from '../services/wordImportService';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../hooks/useTranslation';
import { Language } from '../i18n/locales';

interface HeaderProps {
    viewMode: 'designer' | 'collecte' | 'review';
    setViewMode: (mode: 'designer' | 'collecte' | 'review') => void;
    canDesign: boolean;
    canManageUsers: boolean;
    onManageUsers: () => void;
}

const Header: React.FC<HeaderProps> = ({ viewMode, setViewMode, canDesign, onManageUsers, canManageUsers, isSuperAdmin = false }) => {
    const { activeProject, closeProject, loadProject, setActiveProject, setSearchTerm } = useProject();
    const { addNotification } = useNotification();
    const { theme, toggleTheme } = useTheme();
    const { t, language, setLanguage } = useLanguage();
    const [isSwitcherOpen, setSwitcherOpen] = useState(false);
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);
    const [showBrandingModal, setShowBrandingModal] = useState(false);
    const [showRegionalModal, setShowRegionalModal] = useState(false);
    const [showDeploymentModal, setShowDeploymentModal] = useState(false);
    const [importMessage, setImportMessage] = useState<string>('');
    const [searchTerm, setLocalSearchTerm] = useState('');
    const wordFileInputRef = useRef<HTMLInputElement>(null);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setLocalSearchTerm(term);
        setSearchTerm(term);
    };

    const clearSearch = () => {
        setLocalSearchTerm('');
        setSearchTerm('');
    };

    const handleGoHome = () => {
        if (window.confirm(t('confirmCloseProject') || 'Voulez-vous fermer le projet actuel et retourner à l\'accueil?')) {
            closeProject();
        }
    };

    const handleCloseProject = () => {
        if (window.confirm(t('confirmCloseProject'))) {
            closeProject();
        }
    };

    const handleImportWord = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        console.log('Import Word started with file:', file.name, 'size:', file.size);
        setImportMessage(t('notificationImporting') || 'Import en cours...');
        try {
            const { project, warnings } = await importProjectFromWordFile(file, setImportMessage);
            console.log('Project imported successfully:', project.name, 'questions:', project.formData.survey.length);

            if (project.formData.survey.length === 0) {
                throw new Error('Aucune question n\'a pu être extraite du document Word. Vérifiez que le document contient du texte structuré (questions numérotées, sections, etc.).');
            }

            await loadProject(project);
            await setActiveProject(project.id);
            setViewMode('designer'); // Switch to designer mode to show the form
            console.log('Project loaded and set as active. Survey length:', project.formData.survey.length);
            addNotification(t('notificationImportSuccess') || 'Import réussi !', 'success');
            warnings.forEach(w => addNotification(w, 'info'));
            setImportMessage('');

        } catch (error: any) {
            console.error('Import Word error:', error);
            addNotification(`${t('notificationImportError') || 'Erreur d\'import'}: ${error.message}`, 'error');
            setImportMessage('');
        } finally {
            if (wordFileInputRef.current) wordFileInputRef.current.value = "";
        }
    };
    
    const viewModeStyles = "px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-300";
    const activeViewModeStyles = "bg-white/90 dark:bg-gray-700/90 shadow-lg backdrop-blur-sm";
    const inactiveViewModeStyles = "hover:bg-white/50 dark:hover:bg-gray-700/50 hover:shadow-md";


    return (
        <>
            <header className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 border-b dark:border-gray-700 shadow-lg flex-shrink-0 animate-fade-in">
                <div className="flex items-center gap-2">
                    <img
                        src="/ISMA.png"
                        alt="ISMA Afrique Logo"
                        className="h-6 sm:h-8 w-auto mr-2 drop-shadow-sm hover:scale-110 transition-transform duration-200"
                    />
                    <button onClick={handleCloseProject} className="p-2 rounded-lg hover:bg-white/30 dark:hover:bg-gray-700/50 transition-all duration-200 hover:scale-105" title={t('header_goHome')}>
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                    </button>
                    <button 
                        onClick={() => {
                            if (!canDesign) {
                                addNotification("Seuls les designers (admin ou project_manager) peuvent importer des fichiers Word.", 'warning');
                                return;
                            }
                            wordFileInputRef.current?.click();
                        }} 
                        className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${!canDesign ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/30 dark:hover:bg-gray-700/50'}`} 
                        title={!canDesign ? "Seuls les designers peuvent importer" : "Importer un fichier Word"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1-3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <input type="file" ref={wordFileInputRef} onChange={handleImportWord} accept=".docx" style={{ display: 'none' }} />
                    <button onClick={() => setSwitcherOpen(true)} className="px-4 py-2 text-sm font-semibold bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all duration-300 hover:scale-105">
                        {activeProject?.name || '...'}
                    </button>

                    {/* Institutional Branding Button */}
                    {activeProject && (
                        <button
                            onClick={() => setShowBrandingModal(true)}
                            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                            title={t('branding_title') || "Paramètres institutionnels"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}

                    {/* Regional Settings Button */}
                    {activeProject && (
                        <button
                            onClick={() => setShowRegionalModal(true)}
                            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                            title={t('regional_title') || "Paramètres régionaux"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}

                    {/* Deployment Button */}
                    {activeProject && (
                        <button
                            onClick={() => setShowDeploymentModal(true)}
                            className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                            title={t('deployment_title') || "Déployer sur KoboToolbox"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>
                
                <div className="flex items-center gap-2 p-1 bg-white/20 dark:bg-gray-800/50 rounded-xl shadow-inner backdrop-blur-sm">
                    {/* Search Input */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={t('header_searchPlaceholder') || "Rechercher une question..."}
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="pl-10 pr-10 py-1.5 text-sm rounded-md bg-white/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-anthracite-gray dark:text-gray-200 placeholder-gray-500"
                            style={{ minWidth: '200px' }}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchTerm && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1 p-1 bg-white/20 dark:bg-gray-800/50 rounded-xl shadow-inner backdrop-blur-sm">
                        {isSuperAdmin && (
                            <button
                                id="btnAdmin"
                                onClick={() => setViewMode('admin')}
                                className={`${viewModeStyles} ${viewMode === 'admin' ? activeViewModeStyles : inactiveViewModeStyles} hover:shadow-md transition-all duration-300 bg-blue-600 text-white ring-2 ring-white/50 shadow-md`}
                                aria-label="Passer en mode admin"
                            >
                                Admin
                            </button>
                        )}
                        {canDesign && (
                            <button
                                id="btnDesigner"
                                onClick={() => setViewMode('designer')}
                                className={`${viewModeStyles} ${viewMode === 'designer' ? activeViewModeStyles : inactiveViewModeStyles} hover:shadow-md transition-all duration-300`}
                                aria-label="Passer en mode concepteur"
                            >
                                {t('header_designer')}
                            </button>
                        )}
                        <button
                            id="btnCollecte"
                            onClick={() => setViewMode('collecte')}
                            className={`${viewModeStyles} ${viewMode === 'collecte' ? activeViewModeStyles : inactiveViewModeStyles} hover:shadow-md transition-all duration-300`}
                            aria-label="Passer en mode collecte"
                        >
                            {t('header_collecte')}
                        </button>
                        {canDesign && (
                            <button
                                id="btnReview"
                                onClick={() => setViewMode('review')}
                                className={`${viewModeStyles} ${viewMode === 'review' ? activeViewModeStyles : inactiveViewModeStyles} hover:shadow-md transition-all duration-300`}
                                aria-label="Passer en mode tableau de bord"
                            >
                                {t('header_review') || 'Tableau de Bord'}
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                     {canManageUsers && (
                        <button onClick={onManageUsers} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" title={t('userManagement_title')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" /></svg>
                        </button>
                     )}
                     {/* Language Selector */}
                     <div className="relative">
                        <button
                            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-1"
                            title={t('languageSelector')}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-medium uppercase">{language}</span>
                        </button>

                        {showLanguageMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                                <div className="py-1">
                                    {[
                                        { code: 'fr', name: 'language_french' },
                                        { code: 'en', name: 'language_english' },
                                        { code: 'bm', name: 'language_bambara' },
                                        { code: 'ff', name: 'language_fulfulde' },
                                        { code: 'snk', name: 'language_soninke' },
                                        { code: 'dgo', name: 'language_dogon' }
                                    ].map(({ code, name }) => (
                                        <button
                                            key={code}
                                            onClick={() => {
                                                setLanguage(code as Language);
                                                setShowLanguageMenu(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                                language === code ? 'bg-gray-50 dark:bg-gray-700 font-medium' : ''
                                            }`}
                                        >
                                            {t(name)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                     </div>

                     <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                       {theme === 'light' ?
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                          : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm-.707 12.022l.707-.707a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
                       }
                    </button>
                </div>
            </header>
            <ProjectSwitcherModal isOpen={isSwitcherOpen} onClose={() => setSwitcherOpen(false)} />
            <BrandingSettingsModal isOpen={showBrandingModal} onClose={() => setShowBrandingModal(false)} />
            <RegionalSettingsModal isOpen={showRegionalModal} onClose={() => setShowRegionalModal(false)} />
            <DeploymentModal isOpen={showDeploymentModal} onClose={() => setShowDeploymentModal(false)} />
        </>
    );
};
export default Header;