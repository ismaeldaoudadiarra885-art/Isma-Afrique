// FIX: Corrected import path for `types`.
import { AiRoleInfo } from './types';

export const AI_ROLES: AiRoleInfo[] = [
  {
    id: 'agent_technique',
    name: 'Agent Technique',
    description: 'Aide à la construction technique du formulaire (logique, contraintes, calculs).',
    emoji: '🛠️'
  },
  {
    id: 'analyste_donnees',
    name: 'Analyste Données',
    description: 'Spécialisé dans l\'analyse statistique et la visualisation des données collectées.',
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
  },
  {
    id: 'auditeur_securite',
    name: 'Auditeur Sécurité',
    description: 'Vérifie la conformité des données et assure la sécurité (chiffrement, audit trail).',
    emoji: '🔒'
  },
  {
    id: 'integrateur_systeme',
    name: 'Intégrateur Système',
    description: 'Gère les intégrations externes (API REST, Webhooks KoboToolbox, ODK).',
    emoji: '🔗'
  },
  {
    id: 'optimisateur_performance',
    name: 'Optimisateur Performance',
    description: 'Améliore les performances (lazy loading, cache AI, virtualisation).',
    emoji: '⚡'
  },
  {
    id: 'specialiste_culturel_malien',
    name: 'Spécialiste Culturel Malien',
    description: 'Expertise sur les contextes régionaux maliens et termes locaux.',
    emoji: '🇲🇱'
  },
  {
    id: 'testeur_automatique',
    name: 'Testeur Automatique',
    description: 'Gère les tests end-to-end et la validation des fonctionnalités.',
    emoji: '🧪'
  }
];
