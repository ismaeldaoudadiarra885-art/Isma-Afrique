import React, { useState, useEffect } from 'react';
import { supabaseService, Organization, OrganizationUser, AuditLog, supabase } from '../services/supabaseClient';
import { useLanguage } from '../hooks/useTranslation';
import UserCreationModal from './UserCreationModal';
import { searchUsers, filterUsersByRole, filterUsersByStatus, sendWelcomeEmail } from '../utils/userUtils';
import { exportToXLSForm } from '../services/xlsformExportService';

const AdminPanel: React.FC = () => {
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const [orgUsers, setOrgUsers] = useState<OrganizationUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCreateOrg, setShowCreateOrg] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedOrgForUser, setSelectedOrgForUser] = useState<string>('');
    const [newOrgData, setNewOrgData] = useState({
        name: '',
        description: '',
        admin_email: '',
        max_projects: 10,
        max_users: 50
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'project_manager' | 'enumerator'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<OrganizationUser[]>([]);
    const { t } = useLanguage();

    // Mode démo : données fictives
    const isDemoMode = (import.meta as any).env?.VITE_DEMO_MODE === 'true';

    console.log('AdminPanel mounted, isDemoMode:', isDemoMode);
    console.log('Initial organizations:', organizations);

    useEffect(() => {
        console.log('Demo useEffect running, isDemoMode:', isDemoMode);
        if (isDemoMode) {
            // Données de démo
            const demoOrgs: Organization[] = [
                {
                    id: 'demo-org-1',
                    name: 'ONG Humanitaire Internationale',
                    description: 'Aide humanitaire en Afrique',
                    admin_email: 'contact@ong-humanitaire.org',
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    settings: {
                        max_projects: 5,
                        max_users: 20,
                        features_enabled: ['projects', 'users', 'analytics']
                    }
                },
                {
                    id: 'demo-org-2',
                    name: 'Association Développement Durable',
                    description: 'Projets de développement durable',
                    admin_email: 'info@dev-durable.org',
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    settings: {
                        max_projects: 3,
                        max_users: 15,
                        features_enabled: ['projects', 'users']
                    }
                }
            ];
            console.log('Setting demo organizations');
            setOrganizations(demoOrgs);
        } else {
            console.log('Loading organizations from Supabase');
            loadOrganizations();
        }
    }, [isDemoMode]);

useEffect(() => {
    console.log('Second useEffect running, isDemoMode:', isDemoMode);
    if (!isDemoMode) {
        loadOrganizations();
    }
}, [isDemoMode]);

    const loadOrganizations = async () => {
        try {
            setIsLoading(true);
            const orgs = await supabaseService.getOrganizations();
            setOrganizations(orgs);
        } catch (error) {
            console.error('Error loading organizations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadOrganizationUsers = async (orgId: string) => {
        if (isDemoMode) {
            // Demo users based on orgId
            const demoUsers: OrganizationUser[] = [
                {
                    id: 'user1',
                    user_id: 'demo-user1',
                    organization_id: orgId,
                    name: 'Jean Dupont',
                    email: 'jean@ong.org',
                    role: 'project_manager' as const,
                    access_code: 'jdu123',
                    is_active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 'user2',
                    user_id: 'demo-user2',
                    organization_id: orgId,
                    name: 'Marie Martin',
                    email: 'marie@ong.org',
                    role: 'enumerator' as const,
                    access_code: 'mma456',
                    is_active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 'user3',
                    user_id: 'demo-user3',
                    organization_id: orgId,
                    name: 'Pierre Lefevre',
                    email: 'pierre@ong.org',
                    role: 'admin' as const,
                    access_code: 'ple789',
                    is_active: false,
                    created_at: new Date().toISOString()
                }
            ];
            setOrgUsers(demoUsers);
            console.log('Loaded demo users for org:', orgId);
        } else {
            try {
                const users = await supabaseService.getOrganizationUsers(orgId);
                setOrgUsers(users);
            } catch (error) {
                console.error('Error loading organization users:', error);
            }
        }
    };

    const handleCreateOrganization = async () => {
        if (isDemoMode) {
            const newOrg: Organization = {
                id: `demo-org-${Date.now()}`,
                name: newOrgData.name,
                description: newOrgData.description,
                admin_email: newOrgData.admin_email,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                settings: {
                    max_projects: newOrgData.max_projects,
                    max_users: newOrgData.max_users,
                    features_enabled: ['projects', 'users', 'analytics']
                }
            };
            setOrganizations(prev => [...prev, newOrg]);
            setShowCreateOrg(false);
            setNewOrgData({
                name: '',
                description: '',
                admin_email: '',
                max_projects: 10,
                max_users: 50
            });
            alert('Organisation créée en mode démo!');
            console.log('Created demo org:', newOrg);
        } else {
            try {
                setIsLoading(true);
                const orgData = {
                    name: newOrgData.name,
                    description: newOrgData.description,
                    admin_email: newOrgData.admin_email,
                    is_active: true,
                    settings: {
                        max_projects: newOrgData.max_projects,
                        max_users: newOrgData.max_users,
                        features_enabled: ['projects', 'users', 'analytics']
                    }
                };

                await supabaseService.createOrganization(orgData);
                await loadOrganizations();
                setShowCreateOrg(false);
                setNewOrgData({
                    name: '',
                    description: '',
                    admin_email: '',
                    max_projects: 10,
                    max_users: 50
                });
            } catch (error) {
                console.error('Error creating organization:', error);
                alert('Erreur lors de la création de l\'organisation');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleToggleOrgStatus = async (org: Organization) => {
        if (isDemoMode) {
            setOrganizations(prev => prev.map(o => 
                o.id === org.id ? { ...o, is_active: !o.is_active } : o
            ));
            console.log('Toggled org status locally:', org.id);
        } else {
            try {
                await supabaseService.updateOrganization(org.id, {
                    is_active: !org.is_active
                });
                await loadOrganizations();
            } catch (error) {
                console.error('Error updating organization:', error);
            }
        }
    };

    const handleCreateUser = async (userData: Partial<OrganizationUser>) => {
        if (isDemoMode) {
            const newUser: OrganizationUser = {
                id: `demo-user-${Date.now()}`,
                user_id: `demo-${userData.name || 'user'}-${Date.now()}`,
                organization_id: selectedOrgForUser,
                name: userData.name || 'N/A',
                email: userData.email || 'N/A',
                role: userData.role || 'enumerator',
                access_code: `demo-${Math.random().toString(36).substring(7).toUpperCase()}`,
                is_active: true,
                created_at: new Date().toISOString()
            };
            setOrgUsers(prev => [...prev, newUser]);
            console.log('Created demo user:', newUser);
            alert(`Utilisateur créé en mode démo!\nNom: ${newUser.name}\nEmail: ${newUser.email}\nCode d'accès: ${newUser.access_code}\n\nUtilisez ce code pour connexion en démo.`);
        } else {
            try {
                const createdUser = await supabaseService.createOrganizationUser(userData);
                await loadOrganizationUsers(selectedOrgForUser);

                // Send welcome email via Supabase Edge Function
                try {
                    const { data, error } = await supabase.functions.invoke('send-welcome-email', {
                        body: {
                            user: createdUser,
                            accessCode: createdUser.access_code
                        }
                    });

                    if (error) {
                        console.error('Erreur envoi email:', error);
                        // Continue with success message even if email fails
                    } else {
                        console.log('Email de bienvenue envoyé:', createdUser.email);
                    }
                } catch (emailError) {
                    console.error('Erreur envoi email:', emailError);
                    // Continue with success message even if email fails
                }

                alert(`Utilisateur créé avec succès!\nNom: ${userData.name || 'N/A'}\nEmail: ${userData.email || 'N/A'}\nCode d'accès: ${createdUser.access_code}\n\nUn email de bienvenue a été envoyé avec les instructions de connexion.`);
            } catch (error) {
                console.error('Error creating user:', error);
                throw error;
            }
        }
    };

    const handleOpenUserModal = (orgId: string) => {
        setSelectedOrgForUser(orgId);
        setShowUserModal(true);
    };

    const handleExportUsers = (orgId: string) => {
        if (orgUsers.length === 0) {
            alert('Aucun utilisateur à exporter');
            return;
        }

        const csvContent = [
            ['Nom', 'Rôle', 'Code d\'Accès', 'Actif'],
            ...orgUsers.map(user => [
                user.user_id || 'N/A',
                user.role,
                user.access_code,
                user.is_active ? 'Oui' : 'Non'
            ])
        ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `utilisateurs_${orgId}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportOrgProjects = (orgId: string) => {
        // En mode démo, créer un projet exemple pour l'export
        if (isDemoMode) {
            const demoProject = {
                id: 'demo-project',
                name: `Projet ${orgId}`,
                description: 'Projet de démonstration',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                formData: {
                    settings: {
                        form_title: `Formulaire ${orgId}`,
                        form_id: `form_${orgId}`,
                        version: '1.0',
                        default_language: 'fr'
                    },
                    survey: [
                        {
                            uid: 'q1',
                            type: 'text',
                            name: 'nom',
                            label: { fr: 'Quel est votre nom ?' },
                            required: true
                        },
                        {
                            uid: 'q2',
                            type: 'select_one',
                            name: 'sexe',
                            label: { fr: 'Quel est votre sexe ?' },
                            list_name: 'sexe_options'
                        }
                    ],
                    choices: [
                        { list_name: 'sexe_options', name: 'homme', label: { fr: 'Homme' } },
                        { list_name: 'sexe_options', name: 'femme', label: { fr: 'Femme' } }
                    ]
                },
                auditLog: [],
                chatHistory: [],
                analysisChatHistory: [],
                versions: [],
                glossary: [],
                submissions: [],
                managedUsers: [],
                questionLibrary: [],
                questionModules: [],
                isRealtimeCoachEnabled: true,
                realtimeFeedback: {}
            };

            // Utiliser le service d'export XLSForm
            exportToXLSForm(demoProject, `projets_${orgId}.xlsx`);
        } else {
            alert('Export XLSForm disponible uniquement en mode démo pour le moment');
        }
    };

    // Enhanced user management functions
    const handleBulkUpdateStatus = async (userIds: string[], isActive: boolean) => {
        if (isDemoMode) {
            setOrgUsers(prev => prev.map(user => 
                userIds.includes(user.id) ? { ...user, is_active: isActive } : user
            ));
            console.log(`Bulk updated status to ${isActive ? 'active' : 'inactive'} for users:`, userIds);
        } else {
            try {
                await supabaseService.bulkUpdateUsers(userIds, { is_active: isActive });
                await loadOrganizationUsers(selectedOrg?.id || '');
            } catch (error) {
                console.error('Error updating user status:', error);
            }
        }
    };

    const handleBulkUpdateRole = async (userIds: string[], newRole: string) => {
        if (isDemoMode) {
            setOrgUsers(prev => prev.map(user => 
                userIds.includes(user.id) ? { ...user, role: newRole as any } : user
            ));
            console.log(`Bulk updated role to ${newRole} for users:`, userIds);
        } else {
            try {
                await supabaseService.bulkUpdateUsers(userIds, { role: newRole as any });
                await loadOrganizationUsers(selectedOrg?.id || '');
            } catch (error) {
                console.error('Error updating user role:', error);
            }
        }
    };

    const handleDeleteUsers = async (userIds: string[]) => {
        if (!confirm(`Êtes-vous sûr de vouloir supprimer ${userIds.length} utilisateur(s) ?`)) return;

        if (isDemoMode) {
            setOrgUsers(prev => prev.filter(user => !userIds.includes(user.id)));
            console.log('Deleted demo users:', userIds);
            alert('Utilisateurs supprimés en mode démo!');
        } else {
            try {
                await supabaseService.deleteUsers(userIds);
                await loadOrganizationUsers(selectedOrg?.id || '');
            } catch (error) {
                console.error('Error deleting users:', error);
            }
        }
    };

    // Apply filters and search
    useEffect(() => {
        if (orgUsers.length > 0) {
            let filtered = searchUsers(orgUsers, searchQuery);
            filtered = filterUsersByRole(filtered, roleFilter);
            filtered = filterUsersByStatus(filtered, statusFilter);
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers([]);
        }
    }, [orgUsers, searchQuery, roleFilter, statusFilter]);

    console.log('Rendering AdminPanel, organizations length:', organizations.length, 'isLoading:', isLoading);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Panel Administrateur
                    </h1>
                    <button
                        onClick={() => setShowCreateOrg(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                    >
                        Nouvelle Organisation
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {isLoading && (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {/* Modal Création Organisation */}
                {showCreateOrg && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">Nouvelle Organisation</h2>
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder="Nom de l'organisation"
                                    value={newOrgData.name}
                                    onChange={(e) => setNewOrgData({...newOrgData, name: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                                <input
                                    type="text"
                                    placeholder="Description"
                                    value={newOrgData.description}
                                    onChange={(e) => setNewOrgData({...newOrgData, description: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                                <input
                                    type="email"
                                    placeholder="Email administrateur"
                                    value={newOrgData.admin_email}
                                    onChange={(e) => setNewOrgData({...newOrgData, admin_email: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="number"
                                        placeholder="Max projets"
                                        value={newOrgData.max_projects}
                                        onChange={(e) => setNewOrgData({...newOrgData, max_projects: parseInt(e.target.value)})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max utilisateurs"
                                        value={newOrgData.max_users}
                                        onChange={(e) => setNewOrgData({...newOrgData, max_users: parseInt(e.target.value)})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>
                            <div className="flex space-x-3 mt-6">
                                <button
                                    onClick={() => setShowCreateOrg(false)}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleCreateOrganization}
                                    disabled={isLoading}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                                >
                                    Créer
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Liste des Organisations */}
                <div className="space-y-4">
                    {organizations.map((org) => (
                        <div key={org.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {org.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {org.description}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Admin: {org.admin_email}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        org.is_active
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    }`}>
                                        {org.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <button
                                        onClick={() => handleToggleOrgStatus(org)}
                                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                                            org.is_active
                                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                                : 'bg-green-600 hover:bg-green-700 text-white'
                                        }`}
                                    >
                                        {org.is_active ? 'Désactiver' : 'Activer'}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    <span>Projets: {org.settings?.max_projects || 0} max</span>
                                    <span className="ml-4">Utilisateurs: {org.settings?.max_users || 0} max</span>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => {
                                            setSelectedOrg(org);
                                            loadOrganizationUsers(org.id);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                                    >
                                        Gérer Utilisateurs
                                    </button>
                                    <button
                                        onClick={() => handleOpenUserModal(org.id)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm"
                                    >
                                        + Utilisateur
                                    </button>
                                    {orgUsers.length > 0 && (
                                        <button
                                            onClick={() => handleExportUsers(org.id)}
                                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm"
                                        >
                                            Export CSV
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleExportOrgProjects(org.id)}
                                        className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-md text-sm"
                                    >
                                        Export XLSForm
                                    </button>
                                </div>
                            </div>

                            {/* Utilisateurs de l'organisation */}
                            {selectedOrg?.id === org.id && (
                                <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                                    {/* Recherche et Filtres */}
                                    <div className="mb-4 space-y-3">
                                        <div className="flex flex-wrap gap-3">
                                            <input
                                                type="text"
                                                placeholder="Rechercher utilisateurs..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="flex-1 min-w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                            />
                                            <select
                                                value={roleFilter}
                                                onChange={(e) => setRoleFilter(e.target.value as any)}
                                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="all">Tous les rôles</option>
                                                <option value="admin">Admin</option>
                                                <option value="project_manager">Manager</option>
                                                <option value="supervisor">Superviseur</option>
                                                <option value="enumerator">Enquêteur</option>
                                            </select>
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="all">Tous les statuts</option>
                                                <option value="active">Actif</option>
                                                <option value="inactive">Inactif</option>
                                            </select>
                                        </div>

                                        {/* Actions groupées */}
                                        {selectedUsers.length > 0 && (
                                            <div className="flex flex-wrap gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                                <span className="text-sm text-blue-700 dark:text-blue-300">
                                                    {selectedUsers.length} utilisateur(s) sélectionné(s)
                                                </span>
                                                <button
                                                    onClick={() => handleBulkUpdateStatus(selectedUsers, true)}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md"
                                                >
                                                    Activer
                                                </button>
                                                <button
                                                    onClick={() => handleBulkUpdateStatus(selectedUsers, false)}
                                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md"
                                                >
                                                    Désactiver
                                                </button>
                                                <button
                                                    onClick={() => handleBulkUpdateRole(selectedUsers, 'enumerator')}
                                                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-md"
                                                >
                                                    Rôle Enquêteur
                                                </button>
                                                <button
                                                    onClick={() => handleBulkUpdateRole(selectedUsers, 'project_manager')}
                                                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-md"
                                                >
                                                    Rôle Manager
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUsers(selectedUsers)}
                                                    className="px-3 py-1 bg-red-800 hover:bg-red-900 text-white text-sm rounded-md"
                                                >
                                                    Supprimer
                                                </button>
                                                <button
                                                    onClick={() => setSelectedUsers([])}
                                                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-md"
                                                >
                                                    Désélectionner
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-md font-medium">
                                            Utilisateurs ({filteredUsers.length}/{orgUsers.length})
                                        </h4>
                                        <div className="flex space-x-2">
                                            {orgUsers.length > 0 && (
                                                <button
                                                    onClick={() => handleExportUsers(org.id)}
                                                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm"
                                                >
                                                    Export CSV
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setSelectedUsers(filteredUsers.map(u => u.id))}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                                            >
                                                Tout sélectionner
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {(filteredUsers.length > 0 ? filteredUsers : orgUsers).map((user) => (
                                            <div key={user.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded">
                                                <div className="flex items-center space-x-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsers.includes(user.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedUsers([...selectedUsers, user.id]);
                                                            } else {
                                                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                                            }
                                                        }}
                                                        className="rounded"
                                                    />
                                                    <div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="font-medium">{user.name || user.user_id}</span>
                                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                                user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                                                user.role === 'project_manager' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-green-100 text-green-800'
                                                            }`}>
                                                                {user.role === 'admin' ? 'Admin' :
                                                                 user.role === 'project_manager' ? 'Manager' : 'Enquêteur'}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            Email: {user.email || 'N/A'} | Code: {user.access_code}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                                        user.is_active
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                    }`}>
                                                        {user.is_active ? 'Actif' : 'Inactif'}
                                                    </span>
                                                    <button
                                                        onClick={() => handleBulkUpdateStatus([user.id], !user.is_active)}
                                                        className={`px-2 py-1 rounded text-xs ${
                                                            user.is_active
                                                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                                                : 'bg-green-600 hover:bg-green-700 text-white'
                                                        }`}
                                                    >
                                                        {user.is_active ? 'Désactiver' : 'Activer'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {orgUsers.length === 0 && (
                                            <p className="text-sm text-gray-500 text-center py-4">Aucun utilisateur</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <UserCreationModal
                                isOpen={showUserModal}
                                onClose={() => setShowUserModal(false)}
                                onCreateUser={handleCreateUser}
                                organizationId={selectedOrgForUser}
                            />
                        </div>
                    ))}

                    {organizations.length === 0 && !isLoading && (
                        <div className="text-center py-8 text-gray-500">
                            <p>Aucune organisation trouvée</p>
                            <button
                                onClick={() => setShowCreateOrg(true)}
                                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                            >
                                Créer la première organisation
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
