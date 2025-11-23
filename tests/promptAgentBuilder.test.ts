// @ts-nocheck
import { buildSystemInstruction } from '../utils/promptAgentBuilder';
import { KoboProject, AiRole } from '../types';
import { AI_ROLES } from '../constants';

console.log("--- DÉMARRAGE DES TESTS UNITAIRES POUR promptAgentBuilder ---");

// --- Mini Test Runner ---
const tests: { name: string, fn: () => void }[] = [];
const test = (name: string, fn: () => void) => tests.push({ name, fn });
const expect = (actual: any) => ({
  toContain: (expected: string) => {
    if (!actual.includes(expected)) throw new Error(`ÉCHEC: attendu que la chaîne contienne "${expected}"`);
  },
  notToContain: (expected: string) => {
    if (actual.includes(expected)) throw new Error(`ÉCHEC: attendu que la chaîne ne contienne PAS "${expected}"`);
  },
});

const runTests = () => {
  let passed = 0;
  let failed = 0;
  tests.forEach(({ name, fn }) => {
    try {
      fn();
      console.log(`✅ SUCCÈS: ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`❌ ÉCHEC: ${name}`);
      console.error(e.message);
      failed++;
    }
  });
  console.log("--- FIN DES TESTS ---");
  console.log(`Résultat : ${passed} succès, ${failed} échecs.`);
  if (failed > 0) {
      console.error("AU MOINS UN TEST A ÉCHOUÉ.");
  } else {
      console.log("TOUS LES TESTS ONT RÉUSSI.");
  }
};
// --- Fin du Test Runner ---


// --- Données de Test ---
const mockProject: KoboProject = {
  id: 'test-proj',
  name: "Projet de Test",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  formData: {
    settings: { form_title: "Mon Formulaire de Test", form_id: "test_form_01", version: "v1.alpha", default_language: "fr" },
    survey: [
      { uid: 'uid1', type: 'text', name: 'nom', label: { fr: 'Quel est votre nom ?' }, required: true },
      { uid: 'uid2', type: 'integer', name: 'age', label: { fr: 'Quel est votre âge ?' } },
    ],
    choices: [],
  },
  glossary: [
    { id: 'g1', term: 'nom', definition_fr: 'Le patronyme de la personne', explanation_bm: 'Togo', category: 'Culturel', level: 'terrain' },
  ],
  chatHistory: [], auditLog: [], versions: [], submissions: [], managedUsers: [], analysisChatHistory: [],
};

const mockQuestion = mockProject.formData.survey[0];


// --- Tests ---

test('buildSystemInstruction: doit inclure le titre du projet et les détails de base', () => {
  const roles: AiRole[] = ['agent_technique'];
  const prompt = buildSystemInstruction(roles, mockProject);
  expect(prompt).toContain('Projet: Mon Formulaire de Test');
  expect(prompt).toContain('Structure complète du formulaire:');
  expect(prompt).toContain('nom (type: text): "Quel est votre nom ?"');
});

test('buildSystemInstruction: doit inclure les descriptions des rôles actifs', () => {
  const roles: AiRole[] = ['agent_technique', 'analyste_donnees'];
  const prompt = buildSystemInstruction(roles, mockProject);
  const agentTechniqueInfo = AI_ROLES.find(r => r.id === 'agent_technique');
  const analysteDonneesInfo = AI_ROLES.find(r => r.id === 'analyste_donnees');
  
  expect(prompt).toContain(agentTechniqueInfo!.description);
  expect(prompt).toContain(analysteDonneesInfo!.description);
});

test('buildSystemInstruction: doit inclure le contexte de la question et du glossaire si pertinents', () => {
  const roles: AiRole[] = ['agent_technique'];
  const prompt = buildSystemInstruction(roles, mockProject, mockQuestion);
  expect(prompt).toContain('Question sélectionnée: nom: "Quel est votre nom ?"');
  expect(prompt).toContain('CONTEXTE DU GLOSSAIRE');
  expect(prompt).toContain('**nom (terrain)**: Le patronyme de la personne');
});

test('buildSystemInstruction: ne doit pas inclure le glossaire si non pertinent', () => {
  const roles: AiRole[] = ['agent_technique'];
  const otherQuestion = mockProject.formData.survey[1]; // 'age' question
  const prompt = buildSystemInstruction(roles, mockProject, otherQuestion);
  expect(prompt).notToContain('CONTEXTE DU GLOSSAIRE');
});

test('buildSystemInstruction: ne doit pas inclure les instructions de simulation', () => {
  const roles: AiRole[] = ['agent_technique'];
  const prompt = buildSystemInstruction(roles, mockProject);
  expect(prompt).notToContain('MODE SIMULATION DE TERRAIN ACTIF');
});


// --- Exécution des Tests ---
runTests();
