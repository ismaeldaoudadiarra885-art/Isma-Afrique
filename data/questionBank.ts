import { KoboQuestion } from '../types';

// Note: These are Partial<KoboQuestion> and uids will be generated on insertion.
// The type is 'any' to avoid needing UIDs for choices in this template file.
export const questionBank: { category: string; questions: any[] }[] = [
  {
    category: 'Démographie',
    questions: [
      {
        type: 'integer',
        name: 'age_enquete',
        label: { fr: 'Quel est l\'âge de la personne enquêtée ?' },
        hint: { fr: 'En années révolues.' },
        required: true,
        constraint: '. > 0 and . < 120',
        difficulty: 'facile',
      },
      {
        type: 'select_one',
        name: 'sexe_enquete',
        label: { fr: 'Quel est le sexe de la personne enquêtée ?' },
        required: true,
        choices: [
          { name: 'homme', label: { fr: 'Homme' } },
          { name: 'femme', label: { fr: 'Femme' } },
        ],
        difficulty: 'facile',
      },
      {
        type: 'select_one',
        name: 'etat_civil',
        label: { fr: 'Quel est l\'état civil de la personne enquêtée ?' },
        choices: [
          { name: 'celibataire', label: { fr: 'Célibataire' } },
          { name: 'marie', label: { fr: 'Marié(e)' } },
          { name: 'divorce', label: { fr: 'Divorcé(e)' } },
          { name: 'veuf', label: { fr: 'Veuf/Veuve' } },
        ],
        difficulty: 'moyen',
      },
      {
        type: 'integer',
        name: 'taille_menage',
        label: { fr: 'Combien de personnes vivent habituellement dans votre ménage ?' },
        constraint: '. > 0',
        difficulty: 'facile',
      },
    ]
  },
  {
    category: 'Localisation (Mali)',
    questions: [
      {
        type: 'select_one',
        name: 'region_mali',
        label: { fr: 'Dans quelle région administrative vous trouvez-vous ?' },
        required: true,
        choices: [
          { name: 'kayes', label: { fr: 'Kayes' } },
          { name: 'koulikoro', label: { fr: 'Koulikoro' } },
          { name: 'sikasso', label: { fr: 'Sikasso' } },
          { name: 'segou', label: { fr: 'Ségou' } },
          { name: 'mopti', label: { fr: 'Mopti' } },
          { name: 'tombouctou', label: { fr: 'Tombouctou' } },
          { name: 'gao', label: { fr: 'Gao' } },
          { name: 'kidal', label: { fr: 'Kidal' } },
          { name: 'taoudenit', label: { fr: 'Taoudénit' } },
          { name: 'menaka', label: { fr: 'Ménaka' } },
          { name: 'bamako', label: { fr: 'District de Bamako' } },
        ],
        difficulty: 'facile',
      },
      {
        type: 'text',
        name: 'cercle_mali',
        label: { fr: 'Dans quel cercle ?' },
        required: true,
      },
      {
        type: 'text',
        name: 'commune_mali',
        label: { fr: 'Dans quelle commune ?' },
        required: true,
      },
      {
        type: 'select_one',
        name: 'milieu_residence',
        label: { fr: 'Milieu de résidence' },
        choices: [
          { name: 'urbain', label: { fr: 'Urbain' } },
          { name: 'rural', label: { fr: 'Rural' } },
        ],
        difficulty: 'facile',
      },
      {
        type: 'geopoint',
        name: 'coordonnees_gps',
        label: { fr: 'Coordonnées GPS du lieu de l\'enquête' },
        required: true,
      },
    ]
  },
  {
    category: 'Média',
    questions: [
      {
        type: 'image',
        name: 'photo_site',
        label: { fr: 'Prendre une photo du site' },
        hint: { fr: 'Prenez une photo d\'ensemble du lieu de l\'entretien.' },
        required: false,
      },
    ]
  },
  {
    category: 'Éducation',
    questions: [
      {
        type: 'select_one',
        name: 'niveau_instruction',
        label: { fr: 'Quel est le plus haut niveau d\'instruction atteint ?' },
        choices: [
          { name: 'aucun', label: { fr: 'Aucun / Jamais scolarisé' } },
          { name: 'primaire', label: { fr: 'Primaire' } },
          { name: 'secondaire_1', label: { fr: 'Secondaire 1er cycle (DEF)' } },
          { name: 'secondaire_2', label: { fr: 'Secondaire 2ème cycle (Bac)' } },
          { name: 'superieur', label: { fr: 'Supérieur' } },
          { name: 'technique', label: { fr: 'Formation technique/professionnelle' } },
          { name: 'coranique', label: { fr: 'École coranique' } },
        ],
      },
      {
        type: 'select_one',
        name: 'sait_lire_ecrire',
        label: { fr: 'Savez-vous lire et écrire dans une langue quelconque ?' },
        choices: [
          { name: 'oui', label: { fr: 'Oui' } },
          { name: 'non', label: { fr: 'Non' } },
        ]
      }
    ]
  },
  {
    category: 'Économie et Agriculture',
    questions: [
       {
        type: 'select_multiple',
        name: 'source_revenus',
        label: { fr: 'Quelles sont les principales sources de revenus du ménage ?' },
        choices: [
          { name: 'agriculture', label: { fr: 'Agriculture' } },
          { name: 'elevage', label: { fr: 'Élevage' } },
          { name: 'commerce', label: { fr: 'Commerce' } },
          { name: 'artisanat', label: { fr: 'Artisanat' } },
          { name: 'salaire', label: { fr: 'Salaire (public/privé)' } },
          { name: 'transfert_argent', label: { fr: 'Transferts d\'argent (diaspora, famille)' } },
          { name: 'autre', label: { fr: 'Autre (préciser)' } },
        ],
        difficulty: 'difficile',
      },
      {
        type: 'decimal',
        name: 'superficie_agricole',
        label: { fr: 'Quelle est la superficie totale des terres agricoles exploitées par le ménage (en hectares) ?' },
        hint: { fr: '1 hectare = 10 000 m²' },
        relevant: "selected(${source_revenus}, 'agriculture')",
        constraint: '. >= 0',
      },
    ]
  }
];