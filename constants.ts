
// FIX: Corrected import path for `types`.
import { AiRoleInfo, KoboQuestion } from './types';
import { v4 as uuidv4 } from 'uuid';

export const AI_ROLES: AiRoleInfo[] = [
  {
    id: 'agent_technique',
    name: 'Agent Technique',
    description: 'Aide à la construction technique du formulaire (logique, contraintes, calculs).',
    emoji: '🛠️'
  },
  {
    id: 'analyste_donnees',
    name: 'Analyste',
    description: 'Aide à structurer les questions pour une analyse de données future.',
    emoji: '📊'
  },
  {
    id: 'architecte_formulaire',
    name: 'Architecte Formulaire',
    description: 'Propose des améliorations structurelles (groupes, logiques, pertinence).',
    emoji: '🏗️'
  },
  {
    id: 'auditeur_conformite',
    name: 'Auditeur Conformité',
    description: 'Vérifie la structure du formulaire selon les standards KoboToolbox et XLSForm.',
    emoji: '🛡️'
  },
  {
    id: 'mediateur_culturel',
    name: 'Médiateur Culturel',
    description: 'Adapte les questions au contexte culturel et linguistique malien.',
    emoji: '🧭'
  },
  {
    id: 'assistant_pedagogique',
    name: 'Pédagogue',
    description: 'Explique les concepts et reformule les questions pour être plus claires.',
    emoji: '🧑‍🏫'
  },
  {
    id: 'traduc_local',
    name: 'Traducteur Local',
    description: 'Traduit la question ou la réponse en Bambara ou autre langue locale.',
    emoji: '🌍'
  }
];

// --- STANDARD INDICATORS LIBRARY FOR NGOs ---
export const STANDARD_INDICATORS: { category: string, icon: string, questions: KoboQuestion[] }[] = [
    {
        category: "Sécurité Alimentaire (FCS)",
        icon: "🥣",
        questions: [
            {
                uid: 'std_fcs_intro',
                type: 'note',
                name: 'note_fcs',
                label: { fr: "Score de Consommation Alimentaire (FCS) - 7 derniers jours" },
                hint: { fr: "Demander combien de jours le ménage a consommé les groupes d'aliments suivants (0-7 jours)." }
            } as KoboQuestion,
            {
                uid: 'std_fcs_cereales',
                type: 'integer',
                name: 'fcs_cereales',
                label: { fr: "Céréales, grains, racines et tubercules" },
                constraint: ". >= 0 and . <= 7",
                required: true
            } as KoboQuestion,
            {
                uid: 'std_fcs_legumineuses',
                type: 'integer',
                name: 'fcs_legumineuses',
                label: { fr: "Légumineuses / Noix" },
                constraint: ". >= 0 and . <= 7",
                required: true
            } as KoboQuestion,
            {
                uid: 'std_fcs_lait',
                type: 'integer',
                name: 'fcs_lait',
                label: { fr: "Lait et produits laitiers" },
                constraint: ". >= 0 and . <= 7",
                required: true
            } as KoboQuestion,
            {
                uid: 'std_fcs_viande',
                type: 'integer',
                name: 'fcs_viande',
                label: { fr: "Viande, poisson et œufs" },
                constraint: ". >= 0 and . <= 7",
                required: true
            } as KoboQuestion,
            {
                uid: 'std_fcs_legumes',
                type: 'integer',
                name: 'fcs_legumes',
                label: { fr: "Légumes" },
                constraint: ". >= 0 and . <= 7",
                required: true
            } as KoboQuestion,
            {
                uid: 'std_fcs_fruits',
                type: 'integer',
                name: 'fcs_fruits',
                label: { fr: "Fruits" },
                constraint: ". >= 0 and . <= 7",
                required: true
            } as KoboQuestion,
            {
                uid: 'std_fcs_huile',
                type: 'integer',
                name: 'fcs_huile',
                label: { fr: "Huile / Graisses" },
                constraint: ". >= 0 and . <= 7",
                required: true
            } as KoboQuestion,
            {
                uid: 'std_fcs_sucre',
                type: 'integer',
                name: 'fcs_sucre',
                label: { fr: "Sucre" },
                constraint: ". >= 0 and . <= 7",
                required: true
            } as KoboQuestion,
            {
                uid: 'std_fcs_score',
                type: 'calculate',
                name: 'score_fcs_calc',
                label: { fr: 'Score FCS (Calculé)' },
                calculation: "(${fcs_cereales} * 2) + (${fcs_legumineuses} * 3) + (${fcs_lait} * 4) + (${fcs_viande} * 4) + (${fcs_legumes} * 1) + (${fcs_fruits} * 1) + (${fcs_huile} * 0.5) + (${fcs_sucre} * 0.5)"
            } as KoboQuestion
        ]
    },
    {
        category: "WASH (Eau & Hygiène)",
        icon: "💧",
        questions: [
            {
                uid: 'std_wash_source',
                type: 'select_one',
                name: 'wash_source_eau',
                label: { fr: "Quelle est la principale source d'eau de boisson du ménage ?" },
                choices: [
                    { uid: uuidv4(), name: 'robinet_domicile', label: { fr: "Robinet dans le logement/cour" } },
                    { uid: uuidv4(), name: 'borne_fontaine', label: { fr: "Borne fontaine publique" } },
                    { uid: uuidv4(), name: 'forage', label: { fr: "Forage / Pompe manuelle" } },
                    { uid: uuidv4(), name: 'puits_protege', label: { fr: "Puits protégé" } },
                    { uid: uuidv4(), name: 'puits_non_protege', label: { fr: "Puits non protégé" } },
                    { uid: uuidv4(), name: 'eau_surface', label: { fr: "Eau de surface (rivière, barrage)" } }
                ],
                required: true
            } as KoboQuestion,
            {
                uid: 'std_wash_temps',
                type: 'integer',
                name: 'wash_temps_collecte',
                label: { fr: "Combien de minutes faut-il pour aller chercher l'eau, attendre et revenir ?" },
                hint: { fr: "0 si l'eau est sur place." },
                constraint: ". >= 0 and . < 240",
                required: true
            } as KoboQuestion,
            {
                uid: 'std_wash_traitement',
                type: 'select_one',
                name: 'wash_traitement',
                label: { fr: "Faites-vous quelque chose pour rendre l'eau plus sûre à boire ?" },
                choices: [
                    { uid: uuidv4(), name: 'oui', label: { fr: "Oui" } },
                    { uid: uuidv4(), name: 'non', label: { fr: "Non" } }
                ],
                required: true
            } as KoboQuestion
        ]
    },
    {
        category: "Santé & Vaccination",
        icon: "💉",
        questions: [
            {
                uid: 'std_sante_carte',
                type: 'select_one',
                name: 'enfant_carte_vac',
                label: { fr: "L'enfant possède-t-il une carte de vaccination ?" },
                choices: [
                    { uid: uuidv4(), name: 'oui_vu', label: { fr: "Oui, vue" } },
                    { uid: uuidv4(), name: 'oui_pas_vu', label: { fr: "Oui, non vue" } },
                    { uid: uuidv4(), name: 'non', label: { fr: "Non" } }
                ],
                required: true
            } as KoboQuestion,
            {
                uid: 'std_sante_bcg',
                type: 'select_one',
                name: 'vaccin_bcg',
                label: { fr: "L'enfant a-t-il reçu le vaccin BCG (contre la tuberculose) ?" },
                hint: { fr: "Vérifier la cicatrice sur l'épaule gauche." },
                relevant: "selected(${enfant_carte_vac}, 'oui_vu')",
                choices: [
                    { uid: uuidv4(), name: 'date', label: { fr: "Oui, date indiquée sur la carte" } },
                    { uid: uuidv4(), name: 'oui_memoire', label: { fr: "Oui, selon la mère" } },
                    { uid: uuidv4(), name: 'non', label: { fr: "Non" } }
                ]
            } as KoboQuestion
        ]
    },
    {
        category: "Éducation",
        icon: "🎒",
        questions: [
            {
                uid: 'std_edu_freq',
                type: 'select_one',
                name: 'frequentation_scolaire',
                label: { fr: "L'enfant a-t-il fréquenté l'école durant l'année scolaire en cours ?" },
                choices: [
                    { uid: uuidv4(), name: 'oui', label: { fr: "Oui" } },
                    { uid: uuidv4(), name: 'non', label: { fr: "Non" } }
                ],
                required: true
            } as KoboQuestion,
            {
                uid: 'std_edu_niveau',
                type: 'select_one',
                name: 'niveau_scolaire',
                label: { fr: "Quel est le niveau actuel de l'enfant ?" },
                relevant: "selected(${frequentation_scolaire}, 'oui')",
                choices: [
                    { uid: uuidv4(), name: 'maternelle', label: { fr: "Maternelle" } },
                    { uid: uuidv4(), name: 'primaire', label: { fr: "Primaire" } },
                    { uid: uuidv4(), name: 'secondaire', label: { fr: "Secondaire" } },
                    { uid: uuidv4(), name: 'coranique', label: { fr: "École Coranique" } }
                ]
            } as KoboQuestion,
             {
                uid: 'std_edu_raison_non',
                type: 'select_multiple',
                name: 'raison_non_scolarisation',
                label: { fr: "Pourquoi l'enfant ne va-t-il pas à l'école ?" },
                relevant: "selected(${frequentation_scolaire}, 'non')",
                choices: [
                    { uid: uuidv4(), name: 'cout', label: { fr: "Coût trop élevé" } },
                    { uid: uuidv4(), name: 'distance', label: { fr: "École trop loin" } },
                    { uid: uuidv4(), name: 'travail', label: { fr: "Travail à la maison/champs" } },
                    { uid: uuidv4(), name: 'insecurite', label: { fr: "Insécurité" } },
                    { uid: uuidv4(), name: 'mariage', label: { fr: "Mariage" } },
                    { uid: uuidv4(), name: 'maladie', label: { fr: "Maladie / Handicap" } }
                ]
            } as KoboQuestion
        ]
    },
    {
        category: "Protection & Genre",
        icon: "⚖️",
        questions: [
             {
                uid: 'std_prot_chef',
                type: 'select_one',
                name: 'genre_chef_menage',
                label: { fr: "Sexe du chef de ménage" },
                choices: [
                    { uid: uuidv4(), name: 'homme', label: { fr: "Homme" } },
                    { uid: uuidv4(), name: 'femme', label: { fr: "Femme" } }
                ],
                required: true
            } as KoboQuestion,
            {
                uid: 'std_prot_doc',
                type: 'select_one',
                name: 'possession_documents',
                label: { fr: "Les membres du ménage possèdent-ils des documents d'identité civile ?" },
                choices: [
                    { uid: uuidv4(), name: 'tous', label: { fr: "Oui, tous les membres" } },
                    { uid: uuidv4(), name: 'certains', label: { fr: "Oui, certains membres" } },
                    { uid: uuidv4(), name: 'aucun', label: { fr: "Non, aucun membre" } }
                ]
            } as KoboQuestion
        ]
    }
];
