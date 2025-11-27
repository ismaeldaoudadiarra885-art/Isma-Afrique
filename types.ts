
// FIX: Created full content for types.ts to provide all necessary type definitions.
import { Content } from '@google/genai';

export type LocalizedText = { [lang: string]: string } | string | undefined;

export interface KoboChoice {
    uid: string;
    name: string;
    label: LocalizedText;
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
    choices?: KoboChoice[];
    children?: KoboQuestion[]; // Pour les groupes répétitifs ou groupes imbriqués
    appearance?: string; // Style d'affichage (minimal, horizontal, signature, etc.)
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

// NOUVEAU : Métadonnées de sécurité pour chaque soumission
export interface SubmissionMetadata {
    agentId: string;        // Code unique de l'agent (ex: M-839)
    agentName: string;      // Nom lisible (ex: Moussa Diarra)
    agentCode: string;      // Redondance pour affichage rapide
    finalizedAt?: string;   // Date exacte du scellement
    locationAtFinalization?: string; // Coordonnées GPS au moment du scellement (si dispo)
    digitalSignature?: string; // Hash cryptographique du contenu (SHA-256)
}

// NOUVEAU : Données de supervision (Contrôle Qualité)
export interface ReviewData {
    status: 'pending' | 'approved' | 'rejected' | 'flagged';
    reviewerName?: string;
    reviewerNote?: string;
    reviewedAt?: string;
}

export interface Submission {
    id: string;
    timestamp: string;
    data: FormValues;
    status: 'draft' | 'finalized' | 'synced' | 'modified' | 'error';
    metadata?: SubmissionMetadata; // Ajout des métadonnées d'attribution
    review?: ReviewData; // Ajout des données de supervision
}

export type UserRole = 'admin' | 'project_manager' | 'enumerator';

export interface ManagedUser {
    id: string;
    name: string; // Nom complet (concaténation ou display name)
    firstName?: string; // Nouveau : Prénom
    lastName?: string;  // Nouveau : Nom
    organization?: string; // Nouveau : Structure
    email?: string;
    role: UserRole;
    accessCode: string;
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
}

export type FormValues = {
    [key: string]: any;
};

export type AiRole = 'agent_technique' | 'analyste_donnees' | 'architecte_formulaire' | 'auditeur_conformite' | 'mediateur_culturel' | 'assistant_pedagogique' | 'traduc_local';

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
