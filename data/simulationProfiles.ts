// FIX: Created full content for data/simulationProfiles.ts to resolve module error.
import { SimulationProfile } from '../types';

export const simulationProfiles: SimulationProfile[] = [
  {
    id: 'farmer_segou',
    name: 'Agriculteur Ségou',
    description: 'Homme, 45 ans, cultive du mil et du coton.',
    emoji: '👨‍🌾',
    persona: "Je suis un agriculteur de 45 ans du cercle de Ségou. Je vis avec ma femme et mes 5 enfants. Ma principale culture est le mil pour la consommation familiale, et je cultive aussi du coton pour la vente. Je suis ouvert aux nouvelles techniques mais je suis prudent car je ne peux pas me permettre de perdre une récolte."
  },
  {
    id: 'trader_bamako',
    name: 'Commerçante Bamako',
    description: 'Femme, 32 ans, vend des légumes au marché.',
    emoji: '👩‍💼',
    persona: "Je suis une femme de 32 ans, mariée, avec 2 enfants. Je tiens un petit étal de légumes au marché de Médine à Bamako. Je me lève très tôt pour acheter mes produits et je travaille toute la journée. Mon objectif est de développer mon commerce pour pouvoir envoyer mes enfants dans une bonne école."
  },
  {
    id: 'student_kati',
    name: 'Étudiant Kati',
    description: 'Jeune homme, 20 ans, en licence.',
    emoji: '🧑‍🎓',
    persona: "J'ai 20 ans et je suis étudiant en 2ème année de droit à l'université de Bamako, mais je vis à Kati chez mon oncle. Je suis très intéressé par la politique et l'avenir de mon pays. J'utilise beaucoup les réseaux sociaux pour m'informer."
  },
  {
    id: 'herder_mopti',
    name: 'Éleveur Mopti',
    description: 'Homme, 55 ans, possède un troupeau de zébus.',
    emoji: '🐃',
    persona: "Je suis un éleveur peul de la région de Mopti. J'ai 55 ans. Ma famille vit de l'élevage de zébus depuis des générations. Le plus grand défi pour moi est l'accès à l'eau et aux pâturages, surtout avec les changements climatiques et l'insécurité."
  }
];