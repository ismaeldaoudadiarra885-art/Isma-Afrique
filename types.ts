// FIX: Created full content for types.ts to provide all necessary type definitions.
import { Content } from '@google/genai';

export type LocalizedText = { [lang: string]: string } | string | undefined;

export interface KoboChoice {
    uid: string;
    name: string;
    label: LocalizedText;
    image?: string; // For image choices in select_one/select_multiple questions
}

export interface KoboQuestion {
    uid: string;
    type: string;
    name: string;
    label: LocalizedText;
    hint?: LocalizedText;
    required?: boolean;
    relevant?: string;
    constraint?: string;
    constraint_message?: LocalizedText;
    calculation?: string;
    appearance?: string;
    list_name?: string;
    choice_filter?: string;
    choices?: KoboChoice[];
}

export interface KoboSettings {
    form_title: string;
    form_id: string;
    version: string;
    default_language: string;
    languages?: string[];
}

export interface KoboFormData {
    settings: KoboSettings;
    survey: KoboQuestion[];
    choices: any[]; // Deprecated, choices are inline in questions
}

export interface AuditLogEntry {
    id: string;
    timestamp: string;
    actor: 'user' | 'ai';
    action: string;
    details: any;
}

export interface ProjectVersion {
    id: string;
    timestamp: string;
    comment: string;
    formData: KoboFormData;
}

export interface GlossaryEntry {
    id: string;
    term: string;
    definition_fr: string;
    explanation_bm: string;
    category: 'XLSForm' | 'Technique' | 'Culturel';
    level: 'terrain' | 'analyste' | 'institutionnel';
    example_local?: string;
    user_annotation?: string;
}

export interface Submission {
    id: string;
    timestamp: string;
    data: FormValues;
    meta?: {
        device_id?: string;
        gps?: { lat: number; lng: number };
    };
    status: 'draft' | 'synced' | 'modified' | 'error' | 'queued';
    validationStatus?: 'pending' | 'validated' | 'rejected' | 'auto_flagged';
    validatedBy?: string;
    validationTimestamp?: string;
}

export type UserRole = 'admin' | 'project_manager' | 'enumerator' | 'supervisor' | 'super_admin';

export interface ManagedUser {
    id: string;
    name: string;
    role: UserRole;
    accessCode: string;
}

// Enhanced organization types
export interface Organization {
    id: string;
    name: string;
    description?: string;
    admin_email: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    settings: {
        max_projects: number;
        max_users: number;
        features_enabled: string[];
    };
}

export interface OrganizationUser {
    id: string;
    organization_id: string;
    user_id: string;
    name?: string;
    email?: string;
    role: 'admin' | 'project_manager' | 'enumerator' | 'supervisor';
    access_code: string;
    is_active: boolean;
    created_at: string;
    last_login?: string;
    created_by?: string;
}

export interface PerformanceMetrics {
    enumeratorId: string;
    submissionCount: number;
    errorRate: number;
    avgCompletionTime?: number;
}

export interface QuestionModule {
    id: string;
    name: string;
    description: string;
    questions: KoboQuestion[];
}

export interface SimulationProfile {
    id: string;
    name: string;
    description: string;
    emoji: string;
    persona: string;
}

export interface KoboProject {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    createdAt: string;
    updatedAt: string;
    formData: KoboFormData;
    auditLog: AuditLogEntry[];
    chatHistory: Content[];
    analysisChatHistory: ChatMessage[];
    versions: ProjectVersion[];
    glossary: GlossaryEntry[];
    submissions: Submission[];
    managedUsers: ManagedUser[];
    koboServerUrl?: string;
    koboApiToken?: string;
    koboAssetUid?: string;
    projectConstitution?: string;
    questionLibrary: KoboQuestion[];
    questionModules: QuestionModule[];
    simulationProfile?: SimulationProfile | null;
    isRealtimeCoachEnabled: boolean;
    realtimeFeedback: { [questionName: string]: { message: string, status: 'info' | 'warning' } };

    // Institutional branding
    institutionalBranding?: {
        logo?: string;
        institutionName?: string;
        ministerialCode?: string;
        partnerInfo?: string;
    };

    // Regional settings
    regionalSettings?: {
        region?: string;
        culturalContext?: string;
        localTerms?: string[];
    };
}

export type FormValues = {
    [key: string]: any;
};

export type AiRole = 'agent_technique' | 'analyste_donnees' | 'architecte_formulaire' | 'auditeur_conformite' | 'mediateur_culturel' | 'assistant_pedagogique' | 'traduc_local' | 'auditeur_securite' | 'integrateur_systeme' | 'optimisateur_performance' | 'specialiste_culturel_malien' | 'testeur_automatique';

export interface AiRoleInfo {
    id: AiRole;
    name: string;
    description: string;
    emoji: string;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    isLoading?: boolean;
}

export interface LogicError {
    questionName: string;
    questionLabel: string;
    logicType: 'relevant' | 'constraint' | 'circular_dependency' | 'undefined_variable';
    expression?: string;
    error: string;
}

export interface DataCleaningSuggestion {
    id: string;
    submissionId: string;
    questionName: string;
    originalValue: any;
    suggestedValue: any;
    reason: string;
    status: 'pending' | 'accepted' | 'rejected';
}

// For projectReducer state
export interface AppState {
    projects: KoboProject[];
    activeProjectId: string | null;
    formValues: FormValues;
    currentQuestionName: string | null;
    userRole: UserRole | null;
    isRoleLocked: boolean;
    isOnline: boolean;
    activeSubmissionId: string | null;
    isInitialized: boolean;
}
