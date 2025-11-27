
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
    KoboProject, KoboQuestion, FormValues, KoboSettings, Submission, ManagedUser, 
    UserRole, QuestionModule, SimulationProfile, KoboFormData, ChatMessage, LogicError, SubmissionMetadata
} from '../types';
import { Content } from '@google/genai';
import { demoProject } from '../data/demoProject';
import { submitToKobo } from '../services/koboService';
import { storageService } from '../services/storageService';

declare global {
    interface Window {
      __TAURI__?: {
        core: {
          invoke: (cmd: string, args?: any) => Promise<any>;
        };
      };
    }
}

const tauriInvoke = window.__TAURI__?.core.invoke;
const IS_TAURI_AVAILABLE = !!tauriInvoke;
const MASTER_CODE_KEY = 'isma_master_code';
const ADMIN_PASS_KEY = 'isma_admin_password';
const LAST_PROJECT_ID_KEY = 'isma_last_active_project';

interface ProjectHeader {
    id: string;
    name: string;
    updatedAt: string;
    formData?: KoboFormData; // Optional extended props for Admin Dashboard
    submissions?: Submission[];
    managedUsers?: ManagedUser[];
}

interface ProjectState {
    projects: ProjectHeader[];
    activeProject: KoboProject | null;
    formValues: FormValues;
    currentQuestionName: string | null;
    userRole: UserRole | null;
    currentUserName: string | null; 
    currentUserCode: string | null; 
    isRoleLocked: boolean;
    isOnline: boolean;
    activeSubmissionId: string | null;
    isInitialized: boolean;
    isLoading: boolean;
    activeProjectId: string | null;
    masterAccessCode: string; 
    adminPasswordHash: string; 
}

const initialState: ProjectState = {
    projects: [],
    activeProject: null,
    formValues: {},
    currentQuestionName: null,
    userRole: null,
    currentUserName: null, 
    currentUserCode: null,
    isRoleLocked: false,
    isOnline: navigator.onLine,
    activeSubmissionId: null,
    isInitialized: false,
    isLoading: true,
    activeProjectId: null,
    masterAccessCode: '1234',
    adminPasswordHash: 'admin',
};


interface ProjectContextType extends Omit<ProjectState, 'projects' | 'activeProject'> {
    projects: ProjectHeader[];
    activeProject: KoboProject | null;
    currentQuestion: KoboQuestion | null;
    
    setUserRole: (role: UserRole | null, accessCode?: string) => Promise<void>;
    verifyAdminPassword: (password: string) => Promise<boolean>;
    createProject: (name: string, formData?: KoboFormData) => Promise<void>;
    duplicateProject: (projectId: string) => Promise<void>;
    loadProject: (project: KoboProject) => Promise<void>;
    setActiveProject: (projectId: string | null) => Promise<void>;
    deleteProject: (projectId: string) => Promise<void>;
    closeProject: () => void;
    
    updateProject: (updates: Partial<KoboProject>) => Promise<void>;
    updateProjectSettings: (settings: KoboSettings) => Promise<void>;
    setCurrentQuestionName: (name: string | null) => void;
    addQuestion: (question: KoboQuestion, targetQuestionName?: string, position?: 'before' | 'after') => void;
    addQuestionsBatch: (questions: KoboQuestion[]) => void;
    updateQuestion: (questionName: string, updates: Partial<KoboQuestion>) => void;
    deleteQuestion: (questionName: string) => void;
    reorderQuestion: (questionNameToMove: string, targetQuestionName: string, position?: 'before' | 'after') => void;
    batchUpdateQuestions: (updates: { questionName: string, updates: Partial<KoboQuestion> }[]) => void;
    addGroup: (label: string) => void;

    formValues: FormValues;
    setFormValues: (values: FormValues) => void;
    updateFormValue: (name: string, value: any) => void;
    
    logAction: (action: string, details: any, actor?: 'user' | 'ai') => void;
    updateChatHistory: (history: Content[]) => void;
    updateAnalysisChatHistory: (history: any[]) => void;
    activeSubmissionId: string | null;
    setActiveSubmissionId: (id: string | null) => void;
    addSubmission: (submission: Submission) => void;
    updateSubmission: (submission: Submission) => void;
    deleteSubmission: (submissionId: string) => void;
    syncSubmissions: () => Promise<void>;
    uploadSubmissions: (submissions: Submission[]) => Promise<void>;

    analysisChatHistory: ChatMessage[];
    glossary: any[];
    isRealtimeCoachEnabled: boolean;
    logicErrors: LogicError[];
    questionLibrary: KoboQuestion[];
    questionModules: QuestionModule[];
    realtimeFeedback: { [key: string]: any };
    simulationProfile: SimulationProfile | null;
    addGlossaryEntry: (entry: any) => void;
    addManagedUser: (user: { firstName: string; lastName: string; role: UserRole; email?: string; organization?: string }) => string; 
    addModuleToForm: (moduleId: string) => void;
    batchUpdateSubmissions: (updates: any) => void;
    deleteGlossaryEntry: (id: string) => void;
    deleteManagedUser: (id: string) => void;
    deleteModule: (id: string) => void;
    deleteQuestionFromLibrary: (uid: string) => void;
    exportProject: (format: 'json' | 'csv') => Promise<void>;
    restoreProjectVersion: (versionId: string) => void;
    saveModule: (module: any) => void;
    saveProjectVersion: (comment: string) => void;
    saveQuestionToLibrary: (question: KoboQuestion) => void;
    setRealtimeCoachEnabled: (enabled: boolean) => void;
    setSimulationProfile: (profile: any) => void;
    updateGlossaryEntry: (id: string, updates: any) => void;
    updateKoboSettings: (settings: any) => void;
    updateProjectConstitution: (constitution: string) => void;
    updateMasterAccessCode: (newCode: string) => void;
    updateAdminPassword: (newPassword: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<ProjectState>(initialState);
    const [dbProjects, setDbProjects] = useState<KoboProject[]>([]);

    // --- GESTION DE LA CONNEXION (ONLINE/OFFLINE) ---
    useEffect(() => {
        const handleOnline = () => setState(s => ({ ...s, isOnline: true }));
        const handleOffline = () => setState(s => ({ ...s, isOnline: false }));

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const refreshProjectList = useCallback(async () => {
        if (IS_TAURI_AVAILABLE) {
            try {
                const projects = await tauriInvoke('get_projects');
                setState(s => ({ ...s, projects: projects as ProjectHeader[] }));
            } catch (error) {
                console.error("Failed to get projects:", error);
            }
        } else {
            // WEB MODE : Load from IndexedDB
            const projects = await storageService.getAllProjects();
            setDbProjects(projects);
            const projectHeaders = projects.map(p => ({ 
                id: p.id, 
                name: p.name, 
                updatedAt: p.updatedAt,
                formData: p.formData,
                submissions: p.submissions,
                managedUsers: p.managedUsers
            }));
            setState(s => ({...s, projects: projectHeaders }));
        }
    }, []);
    
    const saveActiveProject = useCallback(async (project: KoboProject | null) => {
        if (!project) return;
        
        // Update updated_at
        const projectToSave = { ...project, updatedAt: new Date().toISOString() };

        if (IS_TAURI_AVAILABLE) {
            try {
                await tauriInvoke('save_project', { projectData: projectToSave });
                await refreshProjectList(); 
            } catch (error) {
                console.error("Failed to save project:", error);
            }
        } else {
            // WEB MODE : Save to IndexedDB
            await storageService.saveProject(projectToSave);
            
            // Optimisation : Mise à jour de l'état local sans recharger toute la DB
            setDbProjects(prev => {
                const idx = prev.findIndex(p => p.id === projectToSave.id);
                if (idx >= 0) {
                    const copy = [...prev];
                    copy[idx] = projectToSave;
                    return copy;
                }
                return [...prev, projectToSave];
            });
        }
    }, [refreshProjectList]);

    // Auto-save Effect : Save active project when it changes (Debounced)
    useEffect(() => {
        if (state.activeProject && !IS_TAURI_AVAILABLE) {
            const timer = setTimeout(() => {
                storageService.saveProject(state.activeProject!);
            }, 2000); // Sauvegarde auto après 2 secondes d'inactivité
            return () => clearTimeout(timer);
        }
    }, [state.activeProject]);

    const setActiveProject = useCallback(async (projectId: string | null) => {
        setState(s => ({ ...s, isLoading: true, activeProject: null, activeSubmissionId: null, formValues: {}, currentQuestionName: null }));
        
        if (!projectId) {
            setState(s => ({...s, isLoading: false, activeProject: null, activeProjectId: null}));
            localStorage.removeItem(LAST_PROJECT_ID_KEY);
            return;
        }

        localStorage.setItem(LAST_PROJECT_ID_KEY, projectId);

        if (IS_TAURI_AVAILABLE) {
            try {
                const projectDetails = await tauriInvoke('load_project_details', { projectId });
                setState(s => ({ ...s, activeProject: projectDetails as KoboProject, isLoading: false, activeProjectId: projectId }));
            } catch (error) {
                console.error(`Failed to load project ${projectId}:`, error);
                setState(s => ({ ...s, isLoading: false }));
            }
        } else {
            // WEB MODE: Load directly from IndexedDB for correctness
            const projectDetails = await storageService.getProject(projectId);
            if (projectDetails) {
                 setState(s => ({ ...s, activeProject: projectDetails, isLoading: false, activeProjectId: projectId }));
            } else {
                 console.error(`Web mode: Failed to load project ${projectId}`);
                 setState(s => ({ ...s, isLoading: false }));
            }
        }
    }, []);

    // --- ACTIONS ---

    const loadProject = useCallback(async (project: KoboProject) => {
        // Sauvegarde immédiate
        if (IS_TAURI_AVAILABLE) {
            try {
                await tauriInvoke('create_project', { projectData: project });
                await refreshProjectList();
                await setActiveProject(project.id);
            } catch (e) {
                console.error("Failed to save imported project:", e);
            }
        } else {
            await storageService.saveProject(project);
            await refreshProjectList();
            await setActiveProject(project.id);
        }
    }, [setActiveProject, refreshProjectList]);

    const loginWithAccessCode = useCallback(async (accessCode: string): Promise<boolean> => {
        setState(s => ({ ...s, isLoading: true }));
        let projectList: KoboProject[] = [];

        if (IS_TAURI_AVAILABLE) {
             const projectHeaders = (await tauriInvoke('get_projects')) as ProjectHeader[];
             for (const h of projectHeaders) {
                 try {
                     const p = await tauriInvoke('load_project_details', { projectId: h.id }) as KoboProject;
                     projectList.push(p);
                 } catch(e) {}
             }
        } else {
             projectList = await storageService.getAllProjects();
        }

        if (accessCode === state.masterAccessCode) {
            let targetProject = projectList.length > 0 ? projectList[0] : null;

            if (!targetProject) {
                // Si aucun projet, on charge la démo et on la sauvegarde
                const demo = JSON.parse(JSON.stringify(demoProject));
                await loadProject(demo);
                targetProject = demo; 
            }

            setState(s => ({
                ...s,
                activeProject: targetProject,
                userRole: 'enumerator',
                currentUserName: 'Agent Test (Master)',
                currentUserCode: 'MASTER-KEY',
                isRoleLocked: true,
                isLoading: false,
                activeProjectId: targetProject?.id || null
            }));
            
            localStorage.setItem('userRole', 'enumerator');
            localStorage.setItem('isRoleLocked', 'true');
            localStorage.setItem('currentUserName', 'Agent Test (Master)');
            localStorage.setItem('currentUserCode', 'MASTER-KEY');
            return true;
        }

        for (const projectDetails of projectList) {
            const user = projectDetails.managedUsers?.find(u => u.accessCode === accessCode);
            if (user) {
                setState(s => ({
                    ...s,
                    activeProject: projectDetails,
                    userRole: user.role,
                    currentUserName: user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.name,
                    currentUserCode: user.accessCode,
                    isRoleLocked: true,
                    isLoading: false,
                    activeProjectId: projectDetails.id
                }));
                localStorage.setItem('userRole', user.role);
                localStorage.setItem('isRoleLocked', 'true');
                localStorage.setItem('currentUserName', user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.name);
                localStorage.setItem('currentUserCode', user.accessCode);
                return true;
            }
        }
        setState(s => ({ ...s, isLoading: false }));
        return false;
    }, [loadProject, state.masterAccessCode]);

    // --- INITIALIZATION (RUNS ONCE) ---
    useEffect(() => {
        let isMounted = true;
        async function initialize() {
            const storedMasterCode = localStorage.getItem(MASTER_CODE_KEY);
            const storedAdminPass = localStorage.getItem(ADMIN_PASS_KEY);
            
            if (isMounted) {
                setState(s => ({ 
                    ...s, 
                    masterAccessCode: storedMasterCode || '1234',
                    adminPasswordHash: storedAdminPass || 'admin'
                }));
            }

            if (IS_TAURI_AVAILABLE) {
                // ... Tauri init logic ...
                try {
                    const projects = await tauriInvoke('get_projects');
                    if (isMounted) setState(s => ({ ...s, projects: projects as ProjectHeader[] }));
                } catch(e) {}
            } else {
                console.log("Web mode initialization: IndexedDB");
                try {
                    // Migration unique si nécessaire
                    await storageService.migrateFromLocalStorage();
                    
                    // Chargement des projets
                    const projects = await storageService.getAllProjects();
                    setDbProjects(projects);
                    
                    const projectHeaders = projects.map(p => ({ 
                        id: p.id, 
                        name: p.name, 
                        updatedAt: p.updatedAt,
                        formData: p.formData,
                        submissions: p.submissions,
                        managedUsers: p.managedUsers
                    }));
                    if (isMounted) setState(s => ({...s, projects: projectHeaders }));

                    // Reprise de session (Re-ouverture du dernier projet)
                    const lastProjectId = localStorage.getItem(LAST_PROJECT_ID_KEY);
                    const savedRole = localStorage.getItem('userRole') as UserRole;
                    
                    if (lastProjectId && savedRole) {
                        const project = await storageService.getProject(lastProjectId);
                        if (project) {
                            if (isMounted) {
                                setState(s => ({
                                    ...s,
                                    activeProject: project,
                                    activeProjectId: project.id,
                                    userRole: savedRole,
                                    currentUserName: localStorage.getItem('currentUserName'),
                                    currentUserCode: localStorage.getItem('currentUserCode'),
                                    isRoleLocked: localStorage.getItem('isRoleLocked') === 'true',
                                }));
                            }
                        }
                    } else if (savedRole === 'admin') {
                         if (isMounted) setState(s => ({ ...s, userRole: 'admin' }));
                    }

                } catch (e) {
                     console.error("Web mode initialization error:", e);
                } finally {
                    if (isMounted) setState(s => ({...s, isInitialized: true, isLoading: false }));
                }
            }
        }
        initialize();
        return () => { isMounted = false; };
    }, []);

    // --- Actions Implementations ---

    const updateMasterAccessCode = (newCode: string) => {
        localStorage.setItem(MASTER_CODE_KEY, newCode);
        setState(s => ({ ...s, masterAccessCode: newCode }));
    };

    const updateAdminPassword = (newPassword: string) => {
        localStorage.setItem(ADMIN_PASS_KEY, newPassword);
        setState(s => ({ ...s, adminPasswordHash: newPassword }));
    };

    const verifyAdminPassword = async (password: string): Promise<boolean> => {
        return password === state.adminPasswordHash;
    };

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
            } catch (e) { console.error(e); }
        } else {
            await storageService.saveProject(newProject);
            await refreshProjectList();
            await setActiveProject(newProject.id);
        }
    };

    const duplicateProject = async (projectId: string) => {
        let sourceProject: KoboProject | undefined;
        
        if (IS_TAURI_AVAILABLE) {
            try {
                sourceProject = await tauriInvoke('load_project_details', { projectId });
            } catch (error) { console.error(error); }
        } else {
            sourceProject = await storageService.getProject(projectId);
        }

        if (!sourceProject) return;

        const newName = `${sourceProject.name} (Copie)`;
        
        const newProject: KoboProject = {
            ...JSON.parse(JSON.stringify(sourceProject)),
            id: uuidv4(),
            name: newName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            submissions: [], 
            managedUsers: sourceProject.managedUsers?.map(u => ({...u, id: uuidv4()})) || [],
            koboAssetUid: undefined,
            auditLog: [{ id: uuidv4(), timestamp: new Date().toISOString(), actor: 'user', action: 'duplicate_project', details: { sourceId: projectId } }],
            chatHistory: [],
            analysisChatHistory: [],
            versions: []
        };
        
        if (newProject.formData?.settings) {
            newProject.formData.settings.form_title = newName;
            newProject.formData.settings.form_id = `${newProject.formData.settings.form_id}_copy_${Math.floor(Math.random()*1000)}`;
        }

        if (IS_TAURI_AVAILABLE) {
            try {
                await tauriInvoke('create_project', { projectData: newProject });
                await refreshProjectList();
            } catch (e) { console.error(e); }
        } else {
            await storageService.saveProject(newProject);
            await refreshProjectList();
        }
    };
    
    const deleteProject = async (projectId: string) => {
        if (IS_TAURI_AVAILABLE) {
            try {
                await tauriInvoke('delete_project', { projectId });
                if (state.activeProject?.id === projectId) await setActiveProject(null);
                await refreshProjectList();
            } catch (e) { console.error(e); }
        } else {
            await storageService.deleteProject(projectId);
            if (state.activeProject?.id === projectId) await setActiveProject(null);
            await refreshProjectList();
        }
    };
    
    const updateProject = useCallback(async (updates: Partial<KoboProject>) => {
        if (!state.activeProject) return;
        const updatedProject = { 
            ...state.activeProject, 
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        // Optimistic UI update
        setState(s => ({...s, activeProject: updatedProject}));
        // Background save (debounced by effect, but direct calls are safer for critical updates)
        // Note: For critical updates like this, we might want to bypass debounce or force save
        // But since useEffect handles activeProject changes, it will pick it up.
    }, [state.activeProject]);

    const modifyActiveProject = (modifier: (p: KoboProject) => KoboProject) => {
        if (!state.activeProject) return;
        const updated = modifier(state.activeProject);
        setState(s => ({ ...s, activeProject: updated }));
        // The useEffect will handle the save
    }

     const addManagedUser = (user: { firstName: string; lastName: string; role: UserRole; email?: string; organization?: string }) => {
        const nameForCode = user.lastName || user.firstName || 'USR';
        const prefix = nameForCode.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
        const suffix = Math.floor(100 + Math.random() * 900);
        const generatedCode = `${prefix}-${suffix}`;
        
        modifyActiveProject(p => {
            const newUser: ManagedUser = {
                id: uuidv4(),
                firstName: user.firstName,
                lastName: user.lastName,
                name: `${user.firstName} ${user.lastName}`.trim(), 
                organization: user.organization,
                email: user.email,
                role: user.role,
                accessCode: generatedCode
            };
            return { ...p, managedUsers: [...(p.managedUsers || []), newUser] };
        });
        
        return generatedCode;
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

    const addQuestionsBatch = (questions: KoboQuestion[]) => {
        if (!questions || questions.length === 0) return;
        modifyActiveProject(p => {
            const survey = [...p.formData.survey, ...questions];
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
    
    const addSubmission = (submission: Submission) => modifyActiveProject(p => {
        const enrichedSubmission: Submission = {
            ...submission,
            metadata: {
                ...submission.metadata, 
                agentId: state.currentUserCode || 'unknown',
                agentName: state.currentUserName || 'Inconnu',
                agentCode: state.currentUserCode || 'UNK',
            }
        };
        return { ...p, submissions: [...(p.submissions || []), enrichedSubmission] };
    });

    const updateSubmission = (submission: Submission) => modifyActiveProject(p => {
        return { ...p, submissions: (p.submissions || []).map(s => s.id === submission.id ? submission : s)};
    });

    const syncSubmissions = async () => {
        if (!state.activeProject?.koboApiToken || !state.activeProject?.koboAssetUid || !state.activeProject?.koboServerUrl) {
            throw new Error("Configuration Kobo incomplète. Veuillez déployer le projet ou configurer les paramètres de déploiement.");
        }
        
        const { koboServerUrl, koboAssetUid, koboApiToken } = state.activeProject;
        const cleanServerUrl = koboServerUrl.replace(/\/$/, '');
        const apiUrl = `${cleanServerUrl}/api/v2/assets/${koboAssetUid}/data.json`;
        
        try {
            const response = await fetch(apiUrl, {
                headers: { 'Authorization': `Token ${koboApiToken}` }
            });
            
            if (!response.ok) {
                throw new Error(`Échec de la connexion Kobo (${response.status}). Vérifiez vos droits ou l'URL.`);
            }
            
            const rawData = await response.json();
            const results = rawData.results || [];
            
            const newSubmissions: Submission[] = results.map((r: any) => {
                const agentName = r.meta_agent_name || r.username || r._submitted_by || 'Inconnu (Kobo)';
                
                return {
                    id: String(r._id),
                    timestamp: r._submission_time || new Date().toISOString(),
                    data: r,
                    status: 'synced',
                    metadata: {
                        agentId: agentName,
                        agentName: agentName,
                        agentCode: 'KOBO',
                        finalizedAt: r._submission_time,
                    }
                };
            });
            
            modifyActiveProject(p => {
                const existingMap = new Map(p.submissions.map(s => [s.id, s]));
                newSubmissions.forEach(sub => {
                    if (!existingMap.has(sub.id) || existingMap.get(sub.id)?.status !== 'synced') {
                        existingMap.set(sub.id, sub);
                    }
                });

                return { 
                    ...p, 
                    submissions: Array.from(existingMap.values()),
                    updatedAt: new Date().toISOString()
                };
            });
        } catch (error: any) {
            console.error("Erreur Sync:", error);
            throw new Error(`Erreur réseau: ${error.message}`);
        }
    };

    const uploadSubmissions = async (submissionsToUpload: Submission[]) => {
        if (!state.activeProject?.koboApiToken || !state.activeProject?.koboAssetUid || !state.activeProject?.koboServerUrl) {
            throw new Error("Configuration Kobo incomplète.");
        }
        
        const { koboServerUrl, koboAssetUid, koboApiToken } = state.activeProject;
        const successIds: string[] = [];
        const failedIds: string[] = [];

        const uploadPromises = submissionsToUpload.map(async (submission) => {
            try {
                const dataToSend = {
                    ...submission.data,
                    meta_agent_name: submission.metadata?.agentName || state.currentUserName || 'Inconnu',
                    meta_agent_code: submission.metadata?.agentCode || state.currentUserCode || 'UNK'
                };
                await submitToKobo(dataToSend, koboServerUrl, koboAssetUid, koboApiToken);
                successIds.push(submission.id);
                return { status: 'fulfilled', id: submission.id };
            } catch (e) {
                failedIds.push(submission.id);
                console.error(`Failed to upload submission ${submission.id}`, e);
                return { status: 'rejected', id: submission.id, reason: e };
            }
        });

        await Promise.allSettled(uploadPromises);

        if (successIds.length > 0) {
            modifyActiveProject(p => {
                return {
                    ...p,
                    submissions: p.submissions.map(s => 
                        successIds.includes(s.id) ? { ...s, status: 'synced' } : s
                    )
                };
            });
        }

        if (failedIds.length > 0) {
            throw new Error(`${failedIds.length} envoi(s) ont échoué. ${successIds.length} réussi(s). Vérifiez votre connexion.`);
        }
    };

    const placeholderFn = (...args: any[]) => console.warn("Function not implemented in this context:", args);
    
    return (
        <ProjectContext.Provider value={{
            ...state,
            currentQuestion: useMemo(() => state.activeProject?.formData.survey.find(q => q.name === state.currentQuestionName) || null, [state.activeProject, state.currentQuestionName]),
            setUserRole: async (role, accessCode) => { 
                if (accessCode) {
                    const success = await loginWithAccessCode(accessCode);
                    if (!success) {
                        throw new Error("Code d'accès invalide");
                    }
                } else {
                    localStorage.setItem('userRole', role || '');
                    localStorage.setItem('isRoleLocked', 'false');
                    if (!role) {
                        localStorage.removeItem('currentUserName');
                        localStorage.removeItem('currentUserCode');
                        // On garde lastActiveProjectId au cas où, ou on l'enlève selon préférence de sécu
                        // localStorage.removeItem(LAST_PROJECT_ID_KEY); 
                    }
                    setState(s => ({ 
                        ...s, 
                        userRole: role, 
                        currentUserName: role ? s.currentUserName : null,
                        currentUserCode: role ? s.currentUserCode : null,
                        isRoleLocked: false, 
                        activeProject: null, 
                        activeProjectId: null 
                    }));
                }
            },
            verifyAdminPassword,
            createProject,
            duplicateProject,
            loadProject,
            setActiveProject,
            closeProject: () => {
                 setState(s => ({...s, activeProject: null, activeProjectId: null}));
                 localStorage.removeItem(LAST_PROJECT_ID_KEY);
            },
            updateProject,
            updateProjectSettings: async (settings) => {
                if(state.activeProject) updateProject({ formData: { ...state.activeProject.formData, settings: settings }})
            },
            setCurrentQuestionName: (name) => setState(s => ({ ...s, currentQuestionName: name })),
            addQuestion,
            addQuestionsBatch,
            updateQuestion,
            deleteQuestion,
            reorderQuestion: (qNameToMove, targetQName, position) => {
                 modifyActiveProject(p => {
                    const survey = [...p.formData.survey];
                    const moveIndex = survey.findIndex(q => q.name === qNameToMove);
                    const targetIndex = survey.findIndex(q => q.name === targetQName);
                    if (moveIndex === -1 || targetIndex === -1) return p;
                    const [questionToMove] = survey.splice(moveIndex, 1);
                    const newTargetIndex = survey.findIndex(q => q.name === targetQName);
                    survey.splice(position === 'before' ? newTargetIndex : newTargetIndex + 1, 0, questionToMove);
                    return { ...p, formData: { ...p.formData, survey } };
                });
            },
            batchUpdateQuestions: (updates: { questionName: string, updates: Partial<KoboQuestion> }[]) => {
                modifyActiveProject(p => {
                    const updatesMap = new Map<string, Partial<KoboQuestion>>(updates.map(u => [u.questionName, u.updates]));
                    const survey = p.formData.survey.map(q => {
                        const u = updatesMap.get(q.name);
                        if (u) {
                             return { ...q, ...u };
                        }
                        return q;
                    });
                    return { ...p, formData: { ...p.formData, survey } };
                });
            },
            addGroup: (label: string) => { /* Placeholder */},
            setFormValues: (values) => setState(s => ({ ...s, formValues: values })),
            updateFormValue: (name, value) => setState(s => ({...s, formValues: {...s.formValues, [name]: value }})),
            setActiveSubmissionId: (id) => setState(s => ({ ...s, activeSubmissionId: id })),
            logAction: (action: string, details: any, actor: 'user' | 'ai' = 'user') => modifyActiveProject(p => ({ ...p, auditLog: [...(p.auditLog || []), { id: uuidv4(), timestamp: new Date().toISOString(), actor, action, details }]})),
            updateChatHistory: (history) => modifyActiveProject(p => ({ ...p, chatHistory: history })),
            updateAnalysisChatHistory: (history) => modifyActiveProject(p => ({ ...p, analysisChatHistory: history })),
            addSubmission,
            updateSubmission,
            deleteSubmission: (id) => modifyActiveProject(p => ({ ...p, submissions: (p.submissions || []).filter(s => s.id !== id)})),
            syncSubmissions,
            uploadSubmissions,
            analysisChatHistory: state.activeProject?.analysisChatHistory || [],
            glossary: [],
            isRealtimeCoachEnabled: true,
            logicErrors: [],
            questionLibrary: [],
            questionModules: [],
            realtimeFeedback: {},
            simulationProfile: null,
            addGlossaryEntry: placeholderFn,
            addManagedUser,
            addModuleToForm: placeholderFn,
            batchUpdateSubmissions: placeholderFn,
            deleteGlossaryEntry: placeholderFn,
            deleteManagedUser,
            deleteModule: placeholderFn,
            deleteQuestionFromLibrary: placeholderFn,
            exportProject: async (format) => {
                if (!state.activeProject) return;
                if(IS_TAURI_AVAILABLE) {
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
                        alert("L'export CSV n'est disponible que via l'application de bureau.");
                    }
                }
            },
            restoreProjectVersion: (versionId) => {
                 if (!state.activeProject) return;
                 const version = state.activeProject.versions.find(v => v.id === versionId);
                 if (version) {
                     modifyActiveProject(p => ({...p, formData: version.formData}));
                 }
            },
            saveModule: placeholderFn,
            saveProjectVersion: (comment) => {
                if (!state.activeProject) return;
                const newVersion = {
                    id: uuidv4(),
                    timestamp: new Date().toISOString(),
                    comment,
                    formData: JSON.parse(JSON.stringify(state.activeProject.formData)) // Deep copy
                };
                modifyActiveProject(p => ({ ...p, versions: [...p.versions, newVersion] }));
            },
            saveQuestionToLibrary: (question) => {
                 modifyActiveProject(p => ({ ...p, questionLibrary: [...p.questionLibrary, question] }));
            },
            setRealtimeCoachEnabled: (enabled) => modifyActiveProject(p => ({ ...p, isRealtimeCoachEnabled: enabled })),
            setSimulationProfile: (profile) => modifyActiveProject(p => ({ ...p, simulationProfile: profile })),
            updateGlossaryEntry: placeholderFn,
            updateKoboSettings: (settings) => {
                modifyActiveProject(p => ({
                    ...p, 
                    koboServerUrl: settings.serverUrl, 
                    koboApiToken: settings.apiToken, 
                    koboAssetUid: settings.assetUid
                }));
            },
            updateProjectConstitution: (constitution) => modifyActiveProject(p => ({ ...p, projectConstitution: constitution })),
            updateMasterAccessCode,
            updateAdminPassword
        }}>
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
