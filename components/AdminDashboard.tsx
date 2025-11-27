import React, { useState, useMemo } from 'react';
import { useProject } from '../contexts/ProjectContext';
import { useLanguage } from '../hooks/useTranslation';
import UserManagementModal from './EnumeratorManagementModal';
import DeploymentModal from './DeploymentModal';
import SecureTransferModal from './SecureTransferModal';
import { useNotification } from '../contexts/NotificationContext';
import IsmaLogo from './IsmaLogo';

// --- Composants UI ---

const KpiCard: React.FC<{ title: string, value: string | number, subtext: string, icon: string, color: string, trend?: string }> = ({ title, value, subtext, icon, color, trend }) => {
    const bgColors: {[key: string]: string} = {
        'indigo': 'bg-indigo-50 text-indigo-600',
        'green': 'bg-green-50 text-green-600',
        'purple': 'bg-purple-50 text-purple-600',
        'orange': 'bg-orange-50 text-orange-600',
        'red': 'bg-red-50 text-red-600'
    };
    const iconClass = bgColors[color] || bgColors['indigo'];

    return (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start justify-between relative overflow-hidden group hover:shadow-md transition-all">
            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-extrabold text-gray-800 dark:text-white">{value}</h3>
                <div className="flex items-center gap-2 mt-2">
                    {trend && (
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {trend}
                        </span>
                    )}
                    <p className="text-xs text-gray-400">{subtext}</p>
                </div>
            </div>
            <div className={`p-3 rounded-lg text-2xl ${iconClass}`}>
                {icon}
            </div>
        </div>
    );
}

const ProjectCard: React.FC<{ project: any, isActive: boolean, onClick: () => void, onDelete: (e: any) => void }> = ({ project, isActive, onClick, onDelete }) => (
    <div 
        onClick={onClick}
        className={`relative group cursor-pointer p-5 rounded-xl border-2 transition-all duration-200 flex flex-col h-full ${isActive ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md'}`}
    >
        <div className="flex justify-between items-start mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                {project.icon || '📁'}
            </div>
            {isActive && <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">Actif</span>}
        </div>
        
        <h4 className="font-bold text-gray-800 dark:text-white text-lg mb-1 line-clamp-1">{project.name}</h4>
        <p className="text-xs text-gray-500 mb-4 font-mono">{project.formData?.settings?.form_id || 'ID inconnu'}</p>
        
        <div className="mt-auto flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-3">
            <div className="flex items-center gap-3">
                <span className="flex items-center gap-1" title="Soumissions"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> {project.submissions?.length || 0}</span>
                <span className="flex items-center gap-1" title="Agents"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> {project.managedUsers?.length || 0}</span>
            </div>
            <button onClick={onDelete} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        </div>
    </div>
);

const AdminDashboard: React.FC = () => {
    const { 
        projects, activeProject, setActiveProject, createProject, deleteProject, setUserRole, 
        masterAccessCode, updateMasterAccessCode, verifyAdminPassword, updateAdminPassword 
    } = useProject();
    const { addNotification } = useNotification();
    
    // Modals
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [isDeploymentModalOpen, setDeploymentModalOpen] = useState(false);
    const [isReceiveModalOpen, setReceiveModalOpen] = useState(false);
    
    // Navigation Views
    const [currentView, setCurrentView] = useState<'dashboard' | 'settings'>('dashboard');

    // États Dashboard
    const [newProjectName, setNewProjectName] = useState('');
    const [projectSearch, setProjectSearch] = useState('');
    
    // États Settings (Security)
    const [tempMasterCode, setTempMasterCode] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Initialisation lors de l'ouverture de l'onglet settings
    React.useEffect(() => {
        if (currentView === 'settings') {
            setTempMasterCode(masterAccessCode);
        }
    }, [currentView, masterAccessCode]);

    // --- Calculs Globaux (Sécurisés avec Optional Chaining) ---
    const globalStats = useMemo(() => {
        const totalProjects = projects?.length || 0;
        const activeSubmissions = activeProject?.submissions?.length || 0;
        const totalAgents = activeProject?.managedUsers?.length || 0;
        return { totalProjects, activeSubmissions, totalAgents };
    }, [projects, activeProject]);

    const filteredProjects = useMemo(() => {
        if (!projects) return [];
        return projects.filter(p => p.name?.toLowerCase().includes(projectSearch.toLowerCase()));
    }, [projects, projectSearch]);

    // --- Actions ---

    const handleCreateProject = () => {
        if (!newProjectName.trim()) return;
        createProject(newProjectName);
        setNewProjectName('');
        addNotification("Projet initialisé.", "success");
    };

    const handleDeleteProject = (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        if (window.confirm(`ATTENTION: Supprimer le projet "${name}" est irréversible. Toutes les données seront perdues.\n\nConfirmer ?`)) {
            deleteProject(id);
            addNotification("Projet supprimé.", "info");
        }
    };

    const handleUpdateMasterCode = () => {
        if(tempMasterCode.trim().length < 4) {
            addNotification("Le code maître doit faire au moins 4 caractères.", "error");
            return;
        }
        updateMasterAccessCode(tempMasterCode);
        addNotification("Code Maître mis à jour avec succès.", "success");
    };

    const handleChangeAdminPassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            addNotification("Veuillez remplir tous les champs.", "warning");
            return;
        }
        if (newPassword !== confirmPassword) {
            addNotification("Les nouveaux mots de passe ne correspondent pas.", "error");
            return;
        }
        
        const isValid = await verifyAdminPassword(oldPassword);
        if (!isValid) {
            addNotification("L'ancien mot de passe est incorrect.", "error");
            return;
        }

        updateAdminPassword(newPassword);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        addNotification("Mot de passe administrateur changé !", "success");
    };

    // --- Gestion sécurisée des Modals dépendantes du projet ---
    const handleOpenUserModal = () => {
        if (!activeProject) {
            addNotification("⚠️ Veuillez d'abord sélectionner un projet actif dans la liste pour gérer ses utilisateurs.", "warning");
            return;
        }
        setUserModalOpen(true);
    };

    const handleOpenDeploymentModal = () => {
        if (!activeProject) {
            addNotification("⚠️ Veuillez d'abord sélectionner un projet actif pour configurer son déploiement.", "warning");
            return;
        }
        setDeploymentModalOpen(true);
    };

    // --- Render ---

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 overflow-hidden font-sans">
            
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col z-20 shadow-lg">
                {/* Branding */}
                <div className="p-6 border-b dark:border-gray-700 bg-indigo-700 text-white">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="bg-white/20 rounded-lg flex items-center justify-center border border-white/30 p-1">
                            <IsmaLogo className="h-8 w-8 text-white" showText={false} variant="light" />
                        </div>
                        <h1 className="text-lg font-bold tracking-tight">ISMA ADMIN</h1>
                    </div>
                    <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-medium">Administration Centrale</p>
                </div>
                
                {/* Menu Principal */}
                <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                    <div>
                        <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Opérations</p>
                        <button 
                            onClick={() => setCurrentView('dashboard')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            <span className="text-lg">📊</span> Tableau de Bord
                        </button>
                    </div>

                    <div>
                        <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                            Outils Projet {activeProject ? <span className="text-green-500">●</span> : ''}
                        </p>
                        <div className="space-y-1">
                            <button 
                                onClick={handleOpenUserModal} 
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeProject ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' : 'text-gray-400 cursor-not-allowed opacity-60'}`}
                            >
                                <span className="text-lg">👥</span> Créer Badge Agent
                            </button>
                            <button 
                                onClick={handleOpenDeploymentModal} 
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeProject ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' : 'text-gray-400 cursor-not-allowed opacity-60'}`}
                            >
                                <span className="text-lg">☁️</span> Configurer Kobo
                            </button>
                        </div>
                        {!activeProject && (
                            <p className="px-3 mt-2 text-[10px] text-orange-500 italic">
                                Sélectionnez un projet pour activer ces outils.
                            </p>
                        )}
                    </div>

                    <div>
                        <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Configuration</p>
                        <button 
                            onClick={() => setCurrentView('settings')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'settings' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                            <span className="text-lg">🛡️</span> Paramètres & Sécurité
                        </button>
                    </div>
                </nav>

                <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-3 mb-3 px-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-mono text-gray-500">Système v2.5 Stable</span>
                    </div>
                    <button onClick={() => setUserRole(null)} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative bg-gray-50 dark:bg-gray-900">
                
                {/* Top Bar */}
                <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-8 py-4 flex justify-between items-center shadow-sm z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {currentView === 'dashboard' ? 'Vue d\'ensemble' : 'Centre de Sécurité'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">Connecté en tant qu'Administrateur Principal</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setReceiveModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-md transition-transform active:scale-95">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            Scanner Données (QR)
                        </button>
                    </div>
                </header>

                {/* VIEW: DASHBOARD */}
                {currentView === 'dashboard' && (
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 animate-fadeIn">
                        {/* 1. KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <KpiCard title="Projets Actifs" value={globalStats.totalProjects} subtext="Enquêtes en cours" icon="📂" color="indigo" />
                            <KpiCard title="Données Collectées" value={globalStats.activeSubmissions} subtext="Formulaires reçus" icon="📊" color="green" trend={activeProject ? "+ Actif" : undefined}/>
                            <KpiCard title="Agents Terrain" value={globalStats.totalAgents} subtext="Utilisateurs gérés" icon="👥" color="purple" />
                            <KpiCard title="Sécurité" value="OK" subtext="Système stable" icon="🛡️" color="orange" />
                        </div>

                        {/* 2. Projects Section */}
                        <div>
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                        <span>🚀</span> Projets & Opérations
                                    </h3>
                                </div>
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder="Rechercher..." 
                                            value={projectSearch}
                                            onChange={e => setProjectSearch(e.target.value)}
                                            className="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64 shadow-sm"
                                        />
                                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                    <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                                        <input 
                                            type="text" 
                                            placeholder="Nom du projet..." 
                                            value={newProjectName}
                                            onChange={(e) => setNewProjectName(e.target.value)}
                                            className="pl-3 pr-2 py-2 text-sm outline-none bg-transparent w-48"
                                        />
                                        <button onClick={handleCreateProject} className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors">
                                            + Créer
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {filteredProjects.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
                                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl opacity-50">✨</div>
                                    <h4 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Aucun projet trouvé</h4>
                                    <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">Commencez par créer une nouvelle opération.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredProjects.map(project => (
                                        <ProjectCard 
                                            key={project.id} 
                                            project={project} 
                                            isActive={activeProject?.id === project.id} 
                                            onClick={() => setActiveProject(project.id)}
                                            onDelete={(e) => handleDeleteProject(e, project.id, project.name)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* VIEW: SETTINGS (SECURITY) */}
                {currentView === 'settings' && (
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 animate-slideIn">
                        <div className="max-w-4xl mx-auto space-y-8">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* 1. Code Maître Enquêteur */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="p-5 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                        <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                            <span>🔑</span> Code Maître (Terrain)
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">Code de secours universel pour les enquêteurs (ex: 1234).</p>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Code Actuel / Nouveau</label>
                                            <input 
                                                type="text" 
                                                value={tempMasterCode} 
                                                onChange={e => setTempMasterCode(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-lg font-mono text-lg tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                        <button onClick={handleUpdateMasterCode} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                                            Mettre à jour le Code Maître
                                        </button>
                                    </div>
                                </div>

                                {/* 2. Mot de Passe Administrateur */}
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <div className="p-5 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                        <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                            <span>🛡️</span> Mot de Passe Administrateur
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">Protège l'accès à ce tableau de bord.</p>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mot de passe actuel</label>
                                            <input 
                                                type="password" 
                                                value={oldPassword} 
                                                onChange={e => setOldPassword(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                                placeholder="••••••"
                                            />
                                        </div>
                                        <hr className="border-gray-100" />
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nouveau mot de passe</label>
                                            <input 
                                                type="password" 
                                                value={newPassword} 
                                                onChange={e => setNewPassword(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                                placeholder="••••••"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmer nouveau</label>
                                            <input 
                                                type="password" 
                                                value={confirmPassword} 
                                                onChange={e => setConfirmPassword(e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                                placeholder="••••••"
                                            />
                                        </div>
                                        <button onClick={handleChangeAdminPassword} className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">
                                            Changer le mot de passe
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </main>

            {/* Modales */}
            <UserManagementModal isOpen={isUserModalOpen} onClose={() => setUserModalOpen(false)} />
            <DeploymentModal isOpen={isDeploymentModalOpen} onClose={() => setDeploymentModalOpen(false)} />
            <SecureTransferModal 
                isOpen={isReceiveModalOpen} 
                onClose={() => setReceiveModalOpen(false)} 
                mode="receiver" 
                onTransferComplete={() => addNotification("Transfert réussi", "success")}
            />
        </div>
    );
};

export default AdminDashboard;