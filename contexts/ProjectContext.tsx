    import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
    KoboProject, KoboQuestion, FormValues, KoboSettings, Submission, ManagedUser,
    UserRole, QuestionModule, SimulationProfile, KoboFormData, ChatMessage, LogicError, DataCleaningSuggestion
} from '../types';
import { Content } from '@google/genai';
import { demoProject } from '../data/demoProject';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { offlineQueueService } from '../services/offlineQueueService';
import { syncService } from '../services/syncService';
import { detectLogicErrors, generateDataCleaningSuggestions } from '../services/geminiService';
import { exportToXLSForm } from '../services/xlsformExportService';

interface ProjectVersion {
    id: string;
    timestamp: string;
    comment: string;
    formData: KoboFormData;
}

// FIX: Added a global declaration for the __TAURI__ object on the window to inform TypeScript of its existence.
declare global {
    interface Window {
      __TAURI__?: {
        core: {
          invoke: (cmd: string, args?: any) => Promise<any>;
        };
      };
    }
}

// Utilisation de l'API Tauri injectée globalement pour éviter les soucis de build/package
const tauriInvoke = window.__TAURI__?.core.invoke;
const IS_TAURI_AVAILABLE = !!tauriInvoke;
const LOCAL_STORAGE_KEY = 'isma_projects_store';

// --- Nouvelles définitions de type pour le contexte ---
interface ProjectHeader {
    id: string;
    name: string;
    updatedAt: string;
}

interface AppState {
    projects: ProjectHeader[];
    activeProject: KoboProject | null;
    activeProjectId: string | null;
    formValues: FormValues;
    currentQuestionName: string | null;
    userRole: UserRole | null;
    isRoleLocked: boolean;
    isOnline: boolean;
    activeSubmissionId: string | null;
    isInitialized: boolean;
    isLoading: boolean;
    searchTerm: string;
    logicErrors: LogicError[];
    // Nouveaux champs pour Supabase
    currentOrganization: any | null;
    isSupabaseMode: boolean;
}

const isDemoMode = false; // Force real production mode, no demo
console.log('ProjectContext - isDemoMode:', isDemoMode);

const initialState: AppState = {
    projects: [],
    activeProject: null,
    activeProjectId: null,
    formValues: {},
    currentQuestionName: null,
    userRole: null, // Sera initialisé depuis le stockage local
    isRoleLocked: false,
    isOnline: navigator.onLine,
    activeSubmissionId: null,
    isInitialized: false,
    isLoading: true,
    searchTerm: '',
    logicErrors: [],
    currentOrganization: null,
    isSupabaseMode: true,
};


interface ProjectContextType extends Omit<AppState, 'projects' | 'activeProject'> {
    isOnline: boolean;
    // Remplacement des types pour correspondre à la nouvelle logique
    projects: ProjectHeader[];
    activeProject: KoboProject | null;
    currentQuestion: KoboQuestion | null;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    
    // Actions refactorisées pour utiliser le backend Rust
    setUserRole: (role: UserRole | null, accessCode?: string) => Promise<void>;
    createProject: (name: string, formData?: KoboFormData) => Promise<void>;
    loadProject: (project: KoboProject) => Promise<void>;
    setActiveProject: (projectId: string | null) => Promise<void>;
    deleteProject: (projectId: string) => Promise<void>;
    closeProject: () => void;
    
    // Fonctions de mise à jour (maintenant asynchrones)
    updateProject: (updates: Partial<KoboProject>) => Promise<void>;
    updateProjectSettings: (settings: KoboSettings) => Promise<void>;
    setCurrentQuestionName: (name: string | null) => void;
    addQuestion: (question: KoboQuestion, targetQuestionName?: string, position?: 'before' | 'after') => void;
    updateQuestion: (questionName: string, updates: Partial<KoboQuestion>) => void;
    deleteQuestion: (questionName: string) => void;
    reorderQuestion: (questionNameToMove: string, targetQuestionName: string, position: 'before' | 'after') => void;
    batchUpdateQuestions: (updates: { questionName: string, updates: Partial<KoboQuestion> }[]) => void;
    addGroup: (label: string) => void;

    // Undo/Redo
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;

    // Gestion du formulaire
    formValues: FormValues;
    setFormValues: (values: FormValues) => void;
    updateFormValue: (name: string, value: any) => void;
    
    // Autres fonctions (à adapter plus tard, pour l'instant locales)
    logAction: (action: string, details: any, actor?: 'user' | 'ai') => void;
    updateChatHistory: (history: Content[]) => void;
    updateAnalysisChatHistory: (history: any[]) => void;
    activeSubmissionId: string | null;
    setActiveSubmissionId: (id: string | null) => void;
    addSubmission: (submission: Submission) => void;
    updateSubmission: (submission: Submission) => void;
    deleteSubmission: (submissionId: string) => void;

    // Fonctions de la v2 (non migrées pour l'instant)
    analysisChatHistory: ChatMessage[];
    glossary: any[];
    isRealtimeCoachEnabled: boolean;
    logicErrors: LogicError[];
    questionLibrary: KoboQuestion[];
    questionModules: QuestionModule[];
    realtimeFeedback: { [key: string]: any };
    simulationProfile: SimulationProfile | null;
    // Nouveaux champs pour Supabase
    currentOrganization: any | null;
    isSupabaseMode: boolean;
    addGlossaryEntry: (entry: any) => void;
    addManagedUser: (user: { name: string; role: UserRole }) => void;
    addModuleToForm: (moduleId: string) => void;
    batchUpdateSubmissions: (updates: any) => void;
    deleteGlossaryEntry: (id: string) => void;
    deleteManagedUser: (id: string) => void;
    deleteModule: (id: string) => void;
    deleteQuestionFromLibrary: (uid: string) => void;
    exportProject: (format: 'json' | 'csv' | 'xlsform') => Promise<void>;
    restoreProjectVersion: (versionId: string) => void;
    saveModule: (module: any) => void;
    saveProjectVersion: (comment: string) => void;
    saveQuestionToLibrary: (question: KoboQuestion) => void;
    setRealtimeCoachEnabled: (enabled: boolean) => void;
    setSimulationProfile: (profile: any) => void;
    updateGlossaryEntry: (id: string, updates: any) => void;
    updateKoboSettings: (settings: any) => void;
    updateProjectConstitution: (constitution: string) => void;
    processOfflineQueue: (projectId: string | null) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(initialState);
    const [webProjectsStore, setWebProjectsStore] = useState<KoboProject[]>([]);
    const isOnline = useOnlineStatus();
    const [syncInProgress, setSyncInProgress] = useState(false);

    // Undo/Redo state
    const [history, setHistory] = useState<KoboProject[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const activeProjectRef = useRef<KoboProject | null>(null);
    useEffect(() => {
        activeProjectRef.current = state.activeProject;
    }, [state.activeProject]);

    // Auto-run logic errors detection when formData changes
    useEffect(() => {
        const runLogicAudit = async () => {
            if (state.activeProject) {
                try {
                    const errors = await detectLogicErrors(state.activeProject);
                    setState(prev => ({ ...prev, logicErrors: errors }));
                    // Update project with errors for persistence
                    if (modifyActiveProject) {
                        modifyActiveProject(p => ({ ...p, logicErrors: errors }));
                    }
                } catch (e) {
                    console.error('Auto logic audit failed:', e);
                    setState(prev => ({ ...prev, logicErrors: [] }));
                }
            }
        };
        runLogicAudit();
    }, [state.activeProject?.formData]);

    // Update history when activeProject changes (e.g., after modifications)
    useEffect(() => {
        if (state.activeProject) {
            const currentProject = state.activeProject;
            // Only add to history if it's a new state (not undo/redo)
            if (historyIndex < history.length - 1) {
                // Undo/Redo in progress, truncate future
                setHistory(prev => [...prev.slice(0, historyIndex + 1), currentProject]);
                setHistoryIndex(historyIndex + 1);
            } else {
                // New action, add to history (limit to 50 steps)
                setHistory(prev => {
                    const newHistory = [...prev.slice(-49), currentProject];
                    setHistoryIndex(newHistory.length - 1);
                    return newHistory;
                });
            }
        }
    }, [state.activeProject, historyIndex, history.length]);

    const undo = useCallback(() => {
        if (historyIndex > 0 && state.activeProject) {
            const previousIndex = historyIndex - 1;
            setState(prev => ({
                ...prev,
                activeProject: history[previousIndex]
            }));
            setHistoryIndex(previousIndex);
        }
    }, [historyIndex, history, state.activeProject]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1 && state.activeProject) {
            const nextIndex = historyIndex + 1;
            setState(prev => ({
                ...prev,
                activeProject: history[nextIndex]
            }));
            setHistoryIndex(nextIndex);
        }
    }, [historyIndex, history, state.activeProject]);

    const canUndo = historyIndex > 0;
    const canRedo = historyIndex < history.length - 1;

    const refreshProjectList = useCallback(async () => {
        if (IS_TAURI_AVAILABLE) {
            try {
                const projects = await tauriInvoke('get_projects');
                setState(s => ({ ...s, projects: projects as ProjectHeader[] }));
            } catch (error) {
                console.error("Failed to get projects:", error);
            }
        } else {
            // In web mode, projects are managed manually, no auto-refresh needed
            console.log("Project list refresh handled manually in web mode.");
        }
    }, []);
    
    const saveProjectsToLocalStorage = (projects: KoboProject[]) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
        } catch (e) {
            console.error("Failed to save projects to localStorage", e);
        }
    };
    
    const saveActiveProject = useCallback(async (project: KoboProject | null) => {
        if (!project) return;
        if (IS_TAURI_AVAILABLE) {
            try {
                await tauriInvoke('save_project', { projectData: project });
                await refreshProjectList(); // Met à jour la liste avec la nouvelle date de modification
            } catch (error) {
                console.error("Failed to save project:", error);
            }
        } else {
            const updatedStore = webProjectsStore.map(p => p.id === project.id ? project : p);
            if (!updatedStore.find(p => p.id === project.id)) {
                updatedStore.push(project);
            }
            setWebProjectsStore(updatedStore);
            saveProjectsToLocalStorage(updatedStore);
            const projectHeaders = updatedStore.map(({ id, name, updatedAt }) => ({ id, name, updatedAt }));
            setState(s => ({ ...s, projects: projectHeaders }));
        }
    }, [refreshProjectList, webProjectsStore]);

    const loginWithAccessCode = useCallback(async (accessCode: string): Promise<boolean> => {
        setState(s => ({ ...s, isLoading: true }));
        let projectList: KoboProject[] = [];

        if (IS_TAURI_AVAILABLE) {
            const projectHeaders = (await tauriInvoke('get_projects')) as ProjectHeader[];
             for (const projectHeader of projectHeaders) {
                try {
                    const projectDetails: KoboProject = await tauriInvoke('load_project_details', { projectId: projectHeader.id });
                    projectList.push(projectDetails);
                } catch (e) {
                    console.error(`Error loading project ${projectHeader.id} during login scan`, e);
                }
            }
        } else {
             projectList = webProjectsStore;
        }

        for (const projectDetails of projectList) {
            const user = projectDetails.managedUsers?.find(u => u.accessCode === accessCode);
            if (user) {
                setState(s => ({
                    ...s,
                    activeProject: projectDetails,
                    userRole: user.role,
                    isRoleLocked: true,
                    isLoading: false,
                    activeProjectId: projectDetails.id
                }));
                localStorage.setItem('userRole', user.role);
                localStorage.setItem('isRoleLocked', 'true');
                return true;
            }
        }
        setState(s => ({ ...s, isLoading: false }));
        return false;
    }, [webProjectsStore]);

    // Removed demo-specific useEffect

    useEffect(() => {
        async function initialize() {
            setState(s => ({ ...s, isLoading: true }));
            if (IS_TAURI_AVAILABLE) {
                try {
                    await refreshProjectList();
                    const storedRole = localStorage.getItem('userRole') as UserRole | null;
                    const storedIsLocked = localStorage.getItem('isRoleLocked') === 'true';
                    if (storedRole) {
                        setState(s => ({ ...s, userRole: storedRole, isRoleLocked: storedIsLocked }));
                    } else {
                        setState(s => ({ ...s, userRole: 'admin', isRoleLocked: false }));
                    }
                } catch(e) {
                    console.error("Initialization error:", e);
                }
            } else {
                console.log("Tauri API not found, running in web mode.");
                try {
                    const storedProjects = localStorage.getItem(LOCAL_STORAGE_KEY);
                    let projects = storedProjects ? JSON.parse(storedProjects) : [];
                    const projectHeaders = projects.map(({ id, name, updatedAt }) => ({ id, name, updatedAt }));
                    setState(s => ({ ...s, projects: projectHeaders }));
                    
                    // Real mode: clear local storage for fresh login, set userRole to null to show LoginScreen
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('isRoleLocked');
                    setState(s => ({ ...s, userRole: null, isRoleLocked: false, isSupabaseMode: true }));
                    console.log('Real mode: cleared local storage, userRole set to null for login screen');
                    
                    // Load demo project if not present, but do not auto-activate or auto-login
                    const demo = demoProject;
                    if (!projects.find(p => p.id === demo.id)) {
                        projects = [...projects, demo];
                        setWebProjectsStore(projects);
                        saveProjectsToLocalStorage(projects);
                        const demoHeaders = projects.map(({ id, name, updatedAt }) => ({ id, name, updatedAt }));
                        setState(s => ({ ...s, projects: demoHeaders }));
                    }
                    setWebProjectsStore(projects);
                } catch (e) {
                     console.error("Web mode initialization error:", e);
                }
            }
            setState(s => ({ ...s, isInitialized: true, isLoading: false }));
        }
        initialize();
    }, []); // Run only once on mount

    // --- Actions refactorisées ---
    const setActiveProject = useCallback(async (projectId: string | null) => {
        console.log('setActiveProject called with:', projectId);
        setState(s => ({ ...s, isLoading: true, activeProject: null, activeSubmissionId: null, formValues: {}, currentQuestionName: null, activeProjectId: null }));
        if (!projectId) {
            console.log('No projectId provided, clearing active project');
            setState(s => ({...s, isLoading: false, activeProjectId: null}));
            return;
        }
        if (IS_TAURI_AVAILABLE) {
            try {
                const projectDetails = await tauriInvoke('load_project_details', { projectId });
                console.log('Loaded project from Tauri:', projectDetails);
                setState(s => ({ ...s, activeProject: projectDetails as KoboProject, isLoading: false, activeProjectId: projectId }));
            } catch (error) {
                console.error(`Failed to load project ${projectId}:`, error);
                setState(s => ({ ...s, isLoading: false, activeProjectId: null }));
            }
        } else {
            const projectDetails = webProjectsStore.find(p => p.id === projectId);
            console.log('Loaded project from web store:', projectDetails);
            if (projectDetails) {
                 setState(s => ({ ...s, activeProject: projectDetails, isLoading: false, activeProjectId: projectId }));
            } else {
                 console.error(`Web mode: Failed to load project ${projectId}`);
                 setState(s => ({ ...s, isLoading: false, activeProjectId: null }));
            }
        }
    }, [webProjectsStore]);

    const loadProject = useCallback(async (project: KoboProject) => {
        console.log('loadProject called with:', project);
        if (IS_TAURI_AVAILABLE) {
            try {
                await tauriInvoke('create_project', { projectData: project });
                await refreshProjectList();
                await setActiveProject(project.id);
            } catch (e) {
                console.error("Failed to save imported project:", e);
            }
        } else {
            console.log("Importing project in web mode.");
            const newStore = [...webProjectsStore.filter(p => p.id !== project.id), project];
            setWebProjectsStore(newStore);
            saveProjectsToLocalStorage(newStore);
            const projectHeaders = newStore.map(({ id, name, updatedAt }) => ({ id, name, updatedAt }));
            setState(s => ({
                ...s,
                projects: projectHeaders,
                activeProject: project,
                activeProjectId: project.id,
                isLoading: false,
            }));
            console.log('Project loaded and set as active in web mode');
        }
    }, [webProjectsStore, refreshProjectList, setActiveProject]);

    const createProject = async (name: string, formData?: KoboFormData) => {
        const newProject: KoboProject = {
            id: uuidv4(),
            name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            formData: formData || {
                settings: { form_title: name, form_id: name.toLowerCase().replace(/\s+/g, '_') || 'new_form', version: '1', default_language: 'fr' },
                survey: [], choices: [],
            },
            auditLog: [{ id: uuidv4(), timestamp: new Date().toISOString(), actor: 'user', action: 'create_project', details: { name } }],
            chatHistory: [], analysisChatHistory: [], versions: [], glossary: [], submissions: [], managedUsers: [],
            questionLibrary: [], questionModules: [], isRealtimeCoachEnabled: true, realtimeFeedback: {},
        };
        if (IS_TAURI_AVAILABLE) {
            try {
                await tauriInvoke('create_project', { projectData: newProject });
                await refreshProjectList();
                await setActiveProject(newProject.id);
            } catch (e) {
                console.error("Failed to create project:", e);
            }
        } else {
            const newStore = [...webProjectsStore, newProject];
            setWebProjectsStore(newStore);
            saveProjectsToLocalStorage(newStore);
            const projectHeaders = newStore.map(({ id, name, updatedAt }) => ({ id, name, updatedAt }));
            setState(s => ({ ...s, projects: projectHeaders }));
            await setActiveProject(newProject.id);
        }
    };
    
    const deleteProject = async (projectId: string) => {
        if (IS_TAURI_AVAILABLE) {
            try {
                await tauriInvoke('delete_project', { projectId });
                if (state.activeProject?.id === projectId) {
                    await setActiveProject(null);
                }
                await refreshProjectList();
            } catch (e) {
                console.error("Failed to delete project:", e);
            }
        } else {
            const newStore = webProjectsStore.filter(p => p.id !== projectId);
            setWebProjectsStore(newStore);
            saveProjectsToLocalStorage(newStore);
            const projectHeaders = newStore.map(({ id, name, updatedAt }) => ({ id, name, updatedAt }));
            setState(s => ({ ...s, projects: projectHeaders }));
            if (state.activeProject?.id === projectId) {
                await setActiveProject(null);
            }
        }
    };
    
    const updateProject = useCallback(async (updates: Partial<KoboProject>) => {
        if (!state.activeProject) return;
        const updatedProject = { 
            ...(state.activeProject as KoboProject),
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        setState(s => ({...s, activeProject: updatedProject}));
        await saveActiveProject(updatedProject);
    }, [state.activeProject, saveActiveProject]);

    // --- Logique locale ou à migrer ---
    const modifyActiveProject = (modifier: (p: KoboProject) => KoboProject) => {
        if (!state.activeProject) return;
        const updated = modifier(state.activeProject);
        setState(s => ({ ...s, activeProject: updated }));
        // Utiliser un debounce ou un bouton de sauvegarde explicite pour éviter trop d'écritures disque
        saveActiveProject(updated);
    }

     const addManagedUser = (user: { name: string; role: UserRole }) => {
        modifyActiveProject(p => {
            const newUser: ManagedUser = {
                id: uuidv4(),
                name: user.name,
                role: user.role,
                accessCode: `${user.name.substring(0, 3).toLowerCase()}-${Math.floor(100 + Math.random() * 900)}`
            };
            return { ...p, managedUsers: [...(p.managedUsers || []), newUser] };
        });
    };

    const deleteManagedUser = (userId: string) => {
        modifyActiveProject(p => {
            return { ...p, managedUsers: (p.managedUsers || []).filter(u => u.id !== userId) };
        });
    };
    
    const addQuestion = (question: KoboQuestion, targetQuestionName?: string, position?: 'before' | 'after') => {
        modifyActiveProject(p => {
            const survey = [...p.formData.survey];
            if (targetQuestionName && position) {
                const index = survey.findIndex(q => q.name === targetQuestionName);
                if (index > -1) survey.splice(position === 'before' ? index : index + 1, 0, question);
                else survey.push(question);
            } else {
                survey.push(question);
            }
            return { ...p, formData: { ...p.formData, survey } };
        });
    };
    
    const updateQuestion = (questionName: string, updates: Partial<KoboQuestion>) => {
        modifyActiveProject(p => {
            const survey = p.formData.survey.map(q => q.name === questionName ? { ...q, ...updates } : q);
            return { ...p, formData: { ...p.formData, survey } };
        });
    };
    
    const deleteQuestion = (questionName: string) => {
        modifyActiveProject(p => {
            const survey = p.formData.survey.filter(q => q.name !== questionName);
            return { ...p, formData: { ...p.formData, survey } };
        });
        if (state.currentQuestionName === questionName) {
            setState(s => ({...s, currentQuestionName: null}));
        }
    };

    // La logique des fonctions restantes suit ce même modèle :
    // 1. Appeler `modifyActiveProject`.
    // 2. Lui passer une fonction qui prend le projet actuel et retourne le projet modifié.
    // 3. `modifyActiveProject` met à jour l'état local *et* sauvegarde le projet complet dans la base de données.
    
    // Pour l'instant, je vais laisser les autres fonctions comme placeholders.
    const placeholderFn = (...args: any[]) => console.warn("Function not implemented in this context:", args);

    const processOfflineQueue = useCallback(async (projectId: string | null) => {
        if (!projectId || !isOnline) {
            return;
        }

        const actions = offlineQueueService.getQueueForProject(projectId);
        if (actions.length === 0) {
            return;
        }

        setSyncInProgress(true);
        let changesMade = false;

        try {
            for (const action of actions) {
                try {
                    if (IS_TAURI_AVAILABLE) {
                        switch (action.type) {
                            case 'add_submission':
                                await tauriInvoke('add_submission', { projectId, submission: action.data });
                                break;
                            case 'update_submission':
                                await tauriInvoke('update_submission', { projectId, submission: action.data });
                                break;
                            case 'delete_submission':
                                await tauriInvoke('delete_submission', { projectId, submissionId: action.data.id });
                                break;
                            default:
                                continue;
                        }
                    } else {
                        // Web mode: apply changes locally
                        modifyActiveProject(p => {
                            const submissions = p.submissions || [];
                            let updatedSubmissions = submissions;
                            switch (action.type) {
                                case 'add_submission':
                                    updatedSubmissions = [...submissions, action.data];
                                    break;
                                case 'update_submission':
                                    updatedSubmissions = submissions.map(s => s.id === action.data.id ? action.data : s);
                                    break;
                                case 'delete_submission':
                                    updatedSubmissions = submissions.filter(s => s.id !== action.data.id);
                                    break;
                            }
                            return { ...p, submissions: updatedSubmissions };
                        });
                        if (state.activeProject) {
                            const project = state.activeProject as KoboProject;
                            await saveActiveProject(project);
                        }
                    }
                    offlineQueueService.removeFromQueue(action.id);
                    changesMade = true;
                } catch (error) {
                    console.error(`Failed to process offline action ${action.id}:`, error);
                }
            }
            // Refresh the active project only if changes were made
            if (changesMade) {
                await setActiveProject(projectId);
            }
        } finally {
            setSyncInProgress(false);
        }
    }, [isOnline, setSyncInProgress, IS_TAURI_AVAILABLE, tauriInvoke, offlineQueueService, modifyActiveProject, saveActiveProject, state.activeProject, setActiveProject]);

    // Separate effect for processing offline queue when online status or activeProjectId changes
    useEffect(() => {
        if (isOnline && state.activeProjectId && state.isInitialized) {
            processOfflineQueue(state.activeProjectId);
        }
    }, [isOnline, state.activeProjectId, state.isInitialized, processOfflineQueue]);

    const setSearchTerm = useCallback((term: string) => {
        setState(s => Object.assign({}, s, { searchTerm: term }));
    }, []);

    const setFormValues = useCallback((values: FormValues) => {
        setState(s => Object.assign({}, s, { formValues: values }));
    }, []);

    const updateFormValue = useCallback((name: string, value: any) => {
        setState(prevState => ({
            ...prevState,
            formValues: {
                ...prevState.formValues,
                [name]: value
            }
        }));
    }, []);

    const setActiveSubmissionId = useCallback((id: string | null) => {
        setState(s => Object.assign({}, s, { activeSubmissionId: id }));
    }, []);

    const setCurrentQuestionName = useCallback((name: string | null) => {
        setState(s => Object.assign({}, s, { currentQuestionName: name }));
    }, []);

    const closeProject = useCallback(() => {
        setState(s => Object.assign({}, s, { activeProject: null, activeProjectId: null }));
    }, []);

    const setUserRole = useCallback(async (role: UserRole | null, accessCode?: string) => {
        if (accessCode) {
            const success = await loginWithAccessCode(accessCode);
            if (!success) {
                throw new Error("Invalid access code");
            }
        } else {
            localStorage.setItem('userRole', role || '');
            localStorage.setItem('isRoleLocked', 'false');
            setState(s => Object.assign({}, s, { userRole: role, activeProject: null, activeProjectId: null }));
            // Removed auto-load demoProject to show WelcomeScreen first for import/creation options
        }
    }, [loginWithAccessCode, loadProject, demoProject]);

    const updateProjectSettings = useCallback(async (settings: KoboSettings) => {
        if (state.activeProject) {
            const currentFormData = state.activeProject.formData as KoboFormData;
            const newFormData = Object.assign({}, currentFormData, { settings });
            await updateProject({ formData: newFormData });
        }
    }, [state.activeProject, updateProject]);

    const reorderQuestion = useCallback((qNameToMove: string, targetQName: string, position: 'before' | 'after') => {
        modifyActiveProject(p => {
            const survey = [...p.formData.survey];
            const moveIndex = survey.findIndex(q => q.name === qNameToMove);
            const targetIndex = survey.findIndex(q => q.name === targetQName);
            if (moveIndex === -1 || targetIndex === -1) return p;
            const [questionToMove] = survey.splice(moveIndex, 1);
            const newTargetIndex = survey.findIndex(q => q.name === targetQName);
            survey.splice(position === 'before' ? newTargetIndex : newTargetIndex + 1, 0, questionToMove);
            return Object.assign({}, p, { formData: Object.assign({}, p.formData, { survey }) });
        });
    }, [modifyActiveProject]);

    const batchUpdateQuestions = useCallback((updates: { questionName: string; updates: Partial<KoboQuestion> }[]) => {
        modifyActiveProject(p => {
            const updatesMap = new Map(updates.map(u => [u.questionName, u.updates]));
            const survey = p.formData.survey.map(q => updatesMap.has(q.name) ? Object.assign({}, q, updatesMap.get(q.name)) : q);
            return Object.assign({}, p, { formData: Object.assign({}, p.formData, { survey }) });
        });
    }, [modifyActiveProject]);

    const logAction = useCallback((action: string, details: any, actor: 'user' | 'ai' = 'user') => {
        modifyActiveProject(p => Object.assign({}, p, { auditLog: [...(p.auditLog || []), { id: uuidv4(), timestamp: new Date().toISOString(), actor, action, details }] }));
    }, [modifyActiveProject]);

    const updateChatHistory = useCallback((history: Content[]) => {
        modifyActiveProject(p => Object.assign({}, p, { chatHistory: history }));
    }, [modifyActiveProject]);

    const updateAnalysisChatHistory = useCallback((history: any[]) => {
        modifyActiveProject(p => Object.assign({}, p, { analysisChatHistory: history }));
    }, [modifyActiveProject]);

    const addSubmission = useCallback((submission: Submission) => {
        if (!isOnline && state.activeProject) {
            offlineQueueService.addToQueue({
                type: 'add_submission',
                data: submission,
                projectId: state.activeProject.id,
            });
            modifyActiveProject(p => Object.assign({}, p, { submissions: [...(p.submissions || []), Object.assign({}, submission, { status: 'queued' })] }));
        } else {
            modifyActiveProject(p => Object.assign({}, p, { submissions: [...(p.submissions || []), submission] }));
        }
    }, [isOnline, state.activeProject, offlineQueueService, modifyActiveProject]);

    const updateSubmission = useCallback((submission: Submission) => {
        if (!isOnline && state.activeProject) {
            offlineQueueService.addToQueue({
                type: 'update_submission',
                data: submission,
                projectId: state.activeProject.id,
            });
            modifyActiveProject(p => Object.assign({}, p, { submissions: (Array.isArray(p.submissions) ? p.submissions : []).map(s => s.id === submission.id ? Object.assign({}, submission, { status: 'queued' }) : s) }));
        } else {
            modifyActiveProject(p => Object.assign({}, p, { submissions: (Array.isArray(p.submissions) ? p.submissions : []).map(s => s.id === submission.id ? submission : s) }));
        }
    }, [isOnline, state.activeProject, offlineQueueService, modifyActiveProject]);

    const deleteSubmission = useCallback((id: string) => {
        if (!isOnline && state.activeProject) {
            offlineQueueService.addToQueue({
                type: 'delete_submission',
                data: { id },
                projectId: state.activeProject.id,
            });
            modifyActiveProject(p => Object.assign({}, p, { submissions: (p.submissions || []).filter(s => s.id !== id) }));
        } else {
            modifyActiveProject(p => Object.assign({}, p, { submissions: (p.submissions || []).filter(s => s.id !== id) }));
        }
    }, [isOnline, state.activeProject, offlineQueueService, modifyActiveProject]);

    const exportProject = useCallback(async (format: 'json' | 'csv') => {
        if (!state.activeProject) return;
        if (IS_TAURI_AVAILABLE) {
            const filePath = await tauriInvoke('export_project_data', { projectData: state.activeProject, exportFormat: format === 'csv' ? 'csv_submissions' : 'json' });
            alert(`Projet exporté vers : ${filePath}`);
        } else {
            if (format === 'json') {
                const jsonString = JSON.stringify(state.activeProject, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${state.activeProject.name}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                alert("L'export CSV n'est disponible que dans l'application de bureau.");
            }
        }
    }, [state.activeProject, IS_TAURI_AVAILABLE, tauriInvoke]);

    const restoreProjectVersion = useCallback(async (versionId: string) => {
        if (!state.activeProject) return;
        const version = state.activeProject.versions?.find(v => v.id === versionId);
        if (version) {
            setState(prev => {
                if (!prev.activeProject) return prev;
                return Object.assign({}, prev, {
                    activeProject: Object.assign({}, prev.activeProject, {
                        formData: version.formData
                    })
                });
            });
        }
    }, [state.activeProject]);

    const saveProjectVersion = useCallback(async (comment?: string) => {
        if (!state.activeProject) return;
        const version: ProjectVersion = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            comment: comment || 'Sauvegarde automatique',
            formData: state.activeProject.formData
        };
        modifyActiveProject(p => Object.assign({}, p, {
            versions: [...(p.versions || []), version]
        }));
    }, [state.activeProject, modifyActiveProject]);

    const addGroup = useCallback((label: string) => {
        // Placeholder implementation for adding a group
        console.warn("addGroup not implemented:", label);
    }, []);

    console.log('ProjectContext - providing isSupabaseMode:', state.isSupabaseMode);
    const contextValue = useMemo(() => ({
        projects: state.projects,
        activeProject: state.activeProject,
        activeProjectId: state.activeProjectId,
        formValues: state.formValues,
        currentQuestionName: state.currentQuestionName,
        userRole: state.userRole,
        isRoleLocked: state.isRoleLocked,
        isOnline,
        activeSubmissionId: state.activeSubmissionId,
        isInitialized: state.isInitialized,
        isLoading: state.isLoading,
        searchTerm: state.searchTerm,
        isSupabaseMode: state.isSupabaseMode,
        currentOrganization: state.currentOrganization,
        currentQuestion: state.activeProject?.formData.survey.find(q => q.name === state.currentQuestionName) || null,
        setSearchTerm,
        setUserRole,
        createProject,
        loadProject,
        setActiveProject,
        deleteProject,
        closeProject,
        updateProject,
        updateProjectSettings,
        setCurrentQuestionName,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        reorderQuestion,
        batchUpdateQuestions,
        addGroup,
        setFormValues,
        updateFormValue,
        setActiveSubmissionId,
        logAction,
        updateChatHistory,
        updateAnalysisChatHistory,
        addSubmission,
        updateSubmission,
        deleteSubmission,
        undo,
        redo,
        canUndo,
        canRedo,
        analysisChatHistory: state.activeProject?.analysisChatHistory || [],
        glossary: [],
        isRealtimeCoachEnabled: true,
        logicErrors: [],
        questionLibrary: [],
        questionModules: [],
        realtimeFeedback: {},
        simulationProfile: null,
        syncInProgress: false,
        processOfflineQueue,
        addGlossaryEntry: placeholderFn,
        addManagedUser,
        addModuleToForm: placeholderFn,
        batchUpdateSubmissions: placeholderFn,
        deleteGlossaryEntry: placeholderFn,
        deleteManagedUser,
        deleteModule: placeholderFn,
        deleteQuestionFromLibrary: placeholderFn,
        exportProject,
        restoreProjectVersion,
        saveModule: placeholderFn,
        saveProjectVersion,
        saveQuestionToLibrary: placeholderFn,
        setRealtimeCoachEnabled: placeholderFn,
        setSimulationProfile: placeholderFn,
        updateGlossaryEntry: placeholderFn,
        updateKoboSettings: placeholderFn,
        updateProjectConstitution: placeholderFn,
    }), [
        state.projects, state.activeProject, state.activeProjectId, state.formValues, state.currentQuestionName,
        state.userRole, state.isRoleLocked, isOnline, state.activeSubmissionId, state.isInitialized,
        state.isLoading, state.searchTerm, state.isSupabaseMode, state.currentOrganization, setSearchTerm, setUserRole, createProject, loadProject, setActiveProject, deleteProject, closeProject,
        updateProject, updateProjectSettings, setCurrentQuestionName, addQuestion, updateQuestion,
        deleteQuestion, reorderQuestion, batchUpdateQuestions, addGroup, setFormValues,
        updateFormValue, setActiveSubmissionId, logAction, updateChatHistory, updateAnalysisChatHistory,
        addSubmission, updateSubmission, deleteSubmission, undo, redo, canUndo, canRedo, processOfflineQueue, placeholderFn,
        addManagedUser, exportProject, restoreProjectVersion, saveProjectVersion
    ]);

    return (
        <ProjectContext.Provider value={contextValue}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};
