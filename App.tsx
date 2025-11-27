
import React, { useState, useEffect } from 'react';
import { useProject } from './contexts/ProjectContext';
import Header from './components/Header';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import FormPreview from './components/FormPreview';
import WelcomeScreen from './components/WelcomeScreen';
import LoginScreen from './components/LoginScreen';
import CollecteSidebar from './components/CollecteSidebar';
import DataView from './components/DataView';
import FullFormView from './components/FullFormView';
import EnumeratorManagementModal from './components/EnumeratorManagementModal';
import AdminDashboard from './components/AdminDashboard';
import HelpGuideModal from './components/HelpGuideModal';

const App: React.FC = () => {
    const { activeProject, userRole, isInitialized, isLoading, activeSubmissionId, setFormValues, projects } = useProject();
    const [viewMode, setViewMode] = useState<'designer' | 'collecte' | 'review'>('designer');
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    // Force le mode collecte pour les enquêteurs UNIQUEMENT
    useEffect(() => {
        if (userRole === 'enumerator') {
            setViewMode('collecte');
        } else if (userRole === 'project_manager') {
            if (viewMode === 'collecte' && !activeProject) {
                 // No op
            }
        } else if (!userRole) {
            setViewMode('designer');
        }
    }, [userRole, activeProject?.id]);

    useEffect(() => {
        if (viewMode === 'collecte' && activeProject) {
            const activeSub = activeProject.submissions.find(s => s.id === activeSubmissionId);
            setFormValues(activeSub ? activeSub.data : {});
        }
    }, [activeSubmissionId, viewMode, activeProject, setFormValues]);

    // Global Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F1') {
                e.preventDefault();
                setIsHelpOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!isInitialized || isLoading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-white-off dark:bg-gray-900 text-anthracite-gray dark:text-gray-200">
            <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-10 w-10 text-indigo-deep" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p>Initialisation du système ISMA...</p>
            </div>
        </div>;
    }

    if (!userRole) {
        return <LoginScreen />;
    }

    if (userRole === 'admin') {
        return <AdminDashboard />;
    }

    if (!activeProject) {
        return <WelcomeScreen />;
    }

    const canDesign = userRole === 'project_manager' || userRole === 'admin';
    const canManageUsers = userRole === 'project_manager'; 

    return (
        <div className="flex flex-col h-screen bg-white-off dark:bg-gray-900 text-anthracite-gray dark:text-gray-200 font-sans">
            <Header viewMode={viewMode} setViewMode={setViewMode} canDesign={canDesign} onManageUsers={() => setUserModalOpen(true)} canManageUsers={canManageUsers} />
            <div className="flex flex-1 overflow-hidden">
                {viewMode === 'review' && canDesign ? (
                    <FullFormView />
                ) : (
                    <>
                        {viewMode === 'designer' && canDesign && <LeftSidebar />}
                        {viewMode === 'collecte' && canDesign && <CollecteSidebar />}
                        
                        <main className="flex-1 flex overflow-hidden relative">
                            {viewMode === 'designer' && canDesign && <FormPreview />}
                            
                            {viewMode === 'collecte' && !canDesign && (
                                <div className="w-full h-full flex justify-center bg-gray-100 dark:bg-gray-900">
                                    <div className="w-full max-w-md h-full bg-white dark:bg-gray-800 shadow-2xl overflow-hidden flex flex-col">
                                        <FormPreview isCollecteOnly={true} />
                                    </div>
                                </div>
                            )}
                            
                            {viewMode === 'collecte' && canDesign && (
                                <>
                                    <div className="flex-1 border-r dark:border-gray-700 overflow-y-auto hidden md:block">
                                        <DataView />
                                    </div>
                                    <div className="flex-1 bg-gray-100 dark:bg-gray-900 flex justify-center p-4">
                                         <DeviceFrameWrapper>
                                            <FormPreview isCollecteOnly={true} />
                                         </DeviceFrameWrapper>
                                    </div>
                                </>
                            )}
                        </main>
                        
                        {viewMode === 'designer' && canDesign && <RightSidebar />}
                    </>
                )}
            </div>
            {canManageUsers && <EnumeratorManagementModal isOpen={isUserModalOpen} onClose={() => setUserModalOpen(false)} />}
            
            {/* Bouton d'aide flottant pour les nouveaux utilisateurs */}
            {canDesign && (
                <button 
                    onClick={() => setIsHelpOpen(true)}
                    className="fixed bottom-6 right-6 w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center font-bold z-50 transition-transform hover:scale-110"
                    title="Aide & Documentation (F1)"
                >
                    ?
                </button>
            )}
            <HelpGuideModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        </div>
    );
};

const DeviceFrameWrapper: React.FC<{children: React.ReactNode}> = ({children}) => (
    <div className="h-full flex items-center justify-center">
        {children}
    </div>
)

export default App;
