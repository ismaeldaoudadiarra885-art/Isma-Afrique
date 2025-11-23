
import React, { useState, useEffect, useRef } from 'react';
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
import OnboardingWizard from './components/OnboardingWizard';
import AdminPanel from './components/AdminPanel';

const App: React.FC = () => {
    const { activeProject, userRole, isInitialized, isLoading, activeSubmissionId, setFormValues, isSupabaseMode } = useProject();
    const [viewMode, setViewMode] = useState<'designer' | 'collecte' | 'review' | 'admin'>('admin');
    const [isUserModalOpen, setUserModalOpen] = useState(false);

    console.log('App mounted - VITE_DEMO_MODE:', (import.meta as any).env?.VITE_DEMO_MODE);
    console.log('App - viewMode:', viewMode, 'isSupabaseMode:', isSupabaseMode, 'userRole:', userRole);

    useEffect(() => {
        if (viewMode === 'collecte' && activeSubmissionId && activeProject) {
            const activeSub = (activeProject.submissions || []).find(s => s.id === activeSubmissionId);
            if (activeSub) {
                setFormValues(activeSub.data);
            } else {
                setFormValues({});
            }
        }
    }, [activeSubmissionId, viewMode, setFormValues, activeProject]);

    if (!isInitialized || isLoading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-white-off dark:bg-gray-900">Chargement de la base de données souveraine...</div>;
    }

    if (!userRole) {
        return <LoginScreen />;
    }

    const canDesign = userRole === 'admin' || userRole === 'project_manager' || userRole === 'super_admin';
    const canManageUsers = userRole === 'admin' || userRole === 'super_admin';
    const isSuperAdmin = userRole === 'super_admin'; // Nouveau rôle pour l'admin global

    // Check for admin mode after userRole is set
    console.log('Checking admin condition - viewMode:', viewMode, 'isSupabaseMode:', isSupabaseMode, 'isSuperAdmin:', isSuperAdmin);
    if (viewMode === 'admin' && isSupabaseMode && isSuperAdmin) {
        console.log('Rendering AdminPanel');
        return (
            <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 text-anthracite-gray dark:text-gray-200 font-sans transition-all duration-500">
                <Header viewMode={viewMode} setViewMode={setViewMode} canDesign={canDesign} onManageUsers={() => setUserModalOpen(true)} canManageUsers={canManageUsers} isSuperAdmin={isSuperAdmin} />
                <div className="flex flex-1 overflow-hidden">
                    <AdminPanel />
                </div>
            </div>
        );
    } else {
        console.log('Not rendering AdminPanel - conditions not met');
    }

    if (!activeProject) {
        return <WelcomeScreen />;
    }

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 text-anthracite-gray dark:text-gray-200 font-sans transition-all duration-500">
            <Header viewMode={viewMode} setViewMode={setViewMode} canDesign={canDesign} onManageUsers={() => setUserModalOpen(true)} canManageUsers={canManageUsers} isSuperAdmin={isSuperAdmin} />
            <div className="flex flex-1 overflow-hidden">
                {viewMode === 'review' && canDesign ? (
                    <FullFormView />
                ) : (
                    <>
                        {viewMode === 'designer' && canDesign && <LeftSidebar />}
                        {viewMode === 'collecte' && <CollecteSidebar />}
                        
                        <main className="flex-1 flex overflow-hidden">
                            {/* Designer View */}
                            {viewMode === 'designer' && <FormPreview />}
                            
                            {/* Collecte View - Single screen for both roles */}
                            {viewMode === 'collecte' && <FormPreview isCollecteOnly={true} />}
                        </main>
                        
                        {viewMode === 'designer' && canDesign && <RightSidebar />}
                    </>
                )}
            </div>
            {canManageUsers && <EnumeratorManagementModal isOpen={isUserModalOpen} onClose={() => setUserModalOpen(false)} />}
        </div>
    );
};

export default App;