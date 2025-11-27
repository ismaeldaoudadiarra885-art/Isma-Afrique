// FIX: Created full content for demoProject.ts to provide a sample project.
import { KoboProject } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { glossaryData } from './glossaryData';

export const demoProject: KoboProject = {
  id: 'demo-project-01',
  name: 'Projet de Démonstration',
  createdAt: new Date('2023-10-26T10:00:00Z').toISOString(),
  updatedAt: new Date('2023-10-26T11:30:00Z').toISOString(),
  formData: {
    settings: {
      form_title: 'Enquête de Santé Communautaire',
      form_id: 'sante_communautaire_demo',
      version: '2023102601',
      default_language: 'fr',
      languages: ['bm'],
    },
    survey: [
      {
        uid: uuidv4(),
        type: 'text',
        name: 'nom_enqueteur',
        label: { fr: 'Nom de l\'enquêteur', bm: 'Anketikɛla tɔgɔ' },
        required: true,
      },
      {
        uid: uuidv4(),
        type: 'date',
        name: 'date_enquete',
        label: { fr: 'Date de l\'enquête', bm: 'Anketi don' },
        required: true,
      },
      { uid: uuidv4(), type: 'begin_group', name: 'localisation', label: { fr: 'Localisation' } },
      {
        uid: uuidv4(),
        type: 'select_one',
        name: 'region',
        label: { fr: 'Région' },
        required: true,
        choices: [
            { uid: uuidv4(), name: 'sikasso', label: { fr: 'Sikasso' } },
            { uid: uuidv4(), name: 'segou', label: { fr: 'Ségou' } },
            { uid: uuidv4(), name: 'bamako', label: { fr: 'Bamako' } },
        ]
      },
      { uid: uuidv4(), type: 'text', name: 'village', label: { fr: 'Village/Quartier' }, required: true },
      { uid: uuidv4(), type: 'end_group', name: 'localisation_end', label: {} },
      {
        uid: uuidv4(),
        type: 'integer',
        name: 'age_chef_menage',
        label: { fr: 'Âge du chef de ménage' },
        required: true,
        constraint: '. > 15',
        constraint_message: { fr: 'L\'âge doit être supérieur à 15 ans.'}
      },
      {
        uid: uuidv4(),
        type: 'select_one',
        name: 'acces_eau',
        label: { fr: 'Quelle est la source principale d\'eau de boisson ?' },
        choices: [
            { uid: uuidv4(), name: 'robinet', label: { fr: 'Robinet' } },
            { uid: uuidv4(), name: 'puit', label: { fr: 'Puit' } },
            { uid: uuidv4(), name: 'forage', label: { fr: 'Forage' } },
            { uid: uuidv4(), name: 'source', label: { fr: 'Source / Rivière' } },
        ]
      },
      {
        uid: uuidv4(),
        type: 'select_multiple',
        name: 'symptomes_enfants',
        label: { fr: 'Au cours des 2 dernières semaines, les enfants de moins de 5 ans ont-ils eu l\'un des symptômes suivants ?' },
        choices: [
             { uid: uuidv4(), name: 'fievre', label: { fr: 'Fièvre' } },
             { uid: uuidv4(), name: 'toux', label: { fr: 'Toux' } },
             { uid: uuidv4(), name: 'diarrhee', label: { fr: 'Diarrhée' } },
             { uid: uuidv4(), name: 'aucun', label: { fr: 'Aucun de ces symptômes' } },
        ]
      },
       {
        uid: uuidv4(),
        type: 'select_one',
        name: 'consultation',
        label: { fr: 'Si oui, où avez-vous cherché un traitement en premier ?' },
        relevant: "selected(${symptomes_enfants}, 'fievre') or selected(${symptomes_enfants}, 'toux') or selected(${symptomes_enfants}, 'diarrhee')",
        choices: [
            { uid: uuidv4(), name: 'cscom', label: { fr: 'CSCOM / Centre de santé' } },
            { uid: uuidv4(), name: 'hopital', label: { fr: 'Hôpital' } },
            { uid: uuidv4(), name: 'pharmacie', label: { fr: 'Pharmacie / Dépôt' } },
            { uid: uuidv4(), name: 'tradipraticien', label: { fr: 'Tradipraticien' } },
            { uid: uuidv4(), name: 'automedication', label: { fr: 'Automédication' } },
        ]
      },
    ],
    choices: [],
  },
  auditLog: [
      { id: uuidv4(), timestamp: new Date().toISOString(), actor: 'user', action: 'create_project', details: { name: 'Projet de Démonstration' } },
      { id: uuidv4(), timestamp: new Date().toISOString(), actor: 'ai', action: 'addQuestion', details: { name: 'consultation', type: 'select_one' } }
  ],
  chatHistory: [
      { role: 'user', parts: [{ text: 'Ajoute une question sur le lieu de consultation si l\'enfant a des symptômes.' }] },
      { role: 'model', parts: [{ text: 'Entendu, j\'ai ajouté la question `consultation` avec une logique de pertinence.' }] }
  ],
  analysisChatHistory: [],
  versions: [],
  glossary: glossaryData,
  submissions: [
      { id: uuidv4(), timestamp: new Date().toISOString(), status: 'synced', data: { nom_enqueteur: 'Moussa', date_enquete: '2023-10-25', region: 'segou', village: 'Pelengana', age_chef_menage: 45, acces_eau: 'forage', symptomes_enfants: 'fievre toux', consultation: 'cscom' }},
      { id: uuidv4(), timestamp: new Date().toISOString(), status: 'synced', data: { nom_enqueteur: 'Awa', date_enquete: '2023-10-25', region: 'sikasso', village: 'Koutiala', age_chef_menage: 38, acces_eau: 'robinet', symptomes_enfants: 'aucun' }},
      { id: uuidv4(), timestamp: new Date().toISOString(), status: 'draft', data: { nom_enqueteur: 'Moussa', date_enquete: '2023-10-26', region: 'bamako', village: 'Medina Coura', age_chef_menage: 52, acces_eau: 'robinet', symptomes_enfants: 'diarrhee', consultation: 'pharmacie' }}
  ],
  managedUsers: [],
  questionLibrary: [],
  questionModules: [],
  isRealtimeCoachEnabled: true,
  realtimeFeedback: {},
};
