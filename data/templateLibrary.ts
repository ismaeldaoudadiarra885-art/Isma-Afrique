import { KoboProject } from '../types';
import { v4 as uuidv4 } from 'uuid';

// These are partial projects used as templates.
// The createProject function in the context will fill in the rest (IDs, timestamps, etc.)
export const templateLibrary: Partial<KoboProject>[] = [
  {
    name: 'Enquête Socio-Économique de Ménage',
    description: 'Un modèle complet pour collecter des informations démographiques, économiques et sur les conditions de vie des ménages.',
    icon: '🏠',
    formData: {
      settings: {
        form_title: 'Enquête Socio-Économique de Ménage',
        form_id: 'enquete_menage_base',
        version: '1.0',
        default_language: 'fr',
      },
      survey: [
        { uid: uuidv4(), type: 'text', name: 'nom_enqueteur', label: { fr: 'Nom de l\'enquêteur' }, required: true },
        { uid: uuidv4(), type: 'date', name: 'date_enquete', label: { fr: 'Date de l\'enquête' }, required: true },
        { uid: uuidv4(), type: 'begin_group', name: 'localisation', label: { fr: 'Localisation' } },
        { uid: uuidv4(), type: 'text', name: 'region', label: { fr: 'Région' }, required: true },
        { uid: uuidv4(), type: 'text', name: 'cercle', label: { fr: 'Cercle' }, required: true },
        { uid: uuidv4(), type: 'text', name: 'commune', label: { fr: 'Commune' }, required: true },
        { uid: uuidv4(), type: 'end_group', name: 'localisation_end', label: {} },
        { uid: uuidv4(), type: 'begin_group', name: 'infos_menage', label: { fr: 'Informations sur le Ménage' } },
        { uid: uuidv4(), type: 'integer', name: 'taille_menage', label: { fr: 'Quelle est la taille de votre ménage ?' }, required: true, constraint: '. > 0' },
        { uid: uuidv4(), type: 'select_one', name: 'type_logement', label: { fr: 'Quel est le type de votre logement ?' }, choices: [{ uid: uuidv4(), name: 'proprietaire', label: { fr: 'Propriétaire' } }, { uid: uuidv4(), name: 'locataire', label: { fr: 'Locataire' } }, { uid: uuidv4(), name: 'heberge', label: { fr: 'Hébergé' } }] },
        { uid: uuidv4(), type: 'select_multiple', name: 'sources_revenu', label: { fr: 'Quelles sont les sources de revenu du ménage ?' }, choices: [{ uid: uuidv4(), name: 'agriculture', label: { fr: 'Agriculture' } }, { uid: uuidv4(), name: 'elevage', label: { fr: 'Élevage' } }, { uid: uuidv4(), name: 'commerce', label: { fr: 'Commerce' } }, { uid: uuidv4(), name: 'salaire', label: { fr: 'Salaire' } }, { uid: uuidv4(), name: 'autre', label: { fr: 'Autre' } }] },
        { uid: uuidv4(), type: 'end_group', name: 'infos_menage_end', label: {} },
      ],
      choices: [],
    },
  },
  {
    name: 'Suivi des Prix sur le Marché',
    description: 'Un formulaire simple pour suivre les prix des denrées de base sur un marché local.',
    icon: '🛒',
    formData: {
      settings: {
        form_title: 'Suivi des Prix Marché',
        form_id: 'suivi_prix_marche',
        version: '1.0',
        default_language: 'fr',
      },
      survey: [
        { uid: uuidv4(), type: 'text', name: 'nom_marche', label: { fr: 'Nom du marché' }, required: true },
        { uid: uuidv4(), type: 'date', name: 'date_releve', label: { fr: 'Date du relevé' }, required: true },
        { uid: uuidv4(), type: 'decimal', name: 'prix_riz', label: { fr: 'Prix du kilogramme de riz (local)' }, hint: { fr: 'En FCFA' } },
        { uid: uuidv4(), type: 'decimal', name: 'prix_mil', label: { fr: 'Prix du kilogramme de mil' }, hint: { fr: 'En FCFA' } },
        { uid: uuidv4(), type: 'decimal', name: 'prix_huile', label: { fr: 'Prix du litre d\'huile' }, hint: { fr: 'En FCFA' } },
        { uid: uuidv4(), type: 'note', name: 'note_fin', label: { fr: 'Merci pour votre participation.' } },
      ],
      choices: [],
    },
  },
  {
    name: 'Évaluation Rapide des Besoins',
    description: 'Un formulaire concis pour évaluer rapidement les besoins d\'une communauté après un choc (inondation, conflit, etc.).',
    icon: '🩹',
    formData: {
      settings: {
        form_title: 'Évaluation Rapide des Besoins',
        form_id: 'eval_rapide_besoins',
        version: '1.0',
        default_language: 'fr',
      },
      survey: [
        { uid: uuidv4(), type: 'geopoint', name: 'localisation_site', label: { fr: 'Localisation du site' }, required: true },
        { uid: uuidv4(), type: 'select_multiple', name: 'besoins_prioritaires', label: { fr: 'Quels sont les 3 besoins les plus urgents ?' }, required: true, constraint: 'count-selected(.) <= 3', choices: [{ uid: uuidv4(), name: 'eau', label: { fr: 'Eau, Hygiène et Assainissement' } }, { uid: uuidv4(), name: 'nourriture', label: { fr: 'Nourriture' } }, { uid: uuidv4(), name: 'abris', label: { fr: 'Abris' } }, { uid: uuidv4(), name: 'sante', label: { fr: 'Santé' } }, { uid: uuidv4(), name: 'protection', label: { fr: 'Protection' } }] },
        { uid: uuidv4(), type: 'integer', name: 'personnes_affectees', label: { fr: 'Combien de personnes sont affectées selon vous ?' } },
        { uid: uuidv4(), type: 'text', name: 'observations', label: { fr: 'Autres observations importantes' } },
      ],
      choices: [],
    },
  },
];