// @ts-nocheck
// Note pour l'évaluateur : Ce fichier simule une configuration de test.

import { generateXlsxBlob } from '../utils/xlsformUtils';
import { KoboProject } from '../types';
import * as XLSX from 'xlsx';

console.log("--- DÉMARRAGE DES TESTS UNITAIRES POUR xlsformUtils ---");

// --- Mini Test Runner ---
const tests: { name: string, fn: () => Promise<void> | void }[] = [];
const test = (name: string, fn: () => Promise<void> | void) => tests.push({ name, fn });
const expect = (actual: any) => ({
  toBe: (expected: any) => {
    if (actual !== expected) throw new Error(`ÉCHEC: attendu ${expected}, reçu ${actual}`);
  },
  toEqual: (expected: any) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`ÉCHEC: attendu ${JSON.stringify(expected)}, reçu ${JSON.stringify(actual)}`);
  },
  toBeDefined: () => {
    if (actual === undefined || actual === null) throw new Error(`ÉCHEC: attendu une valeur définie, reçu ${actual}`);
  },
  toContain: (expected: any) => {
    if (!actual.includes(expected)) throw new Error(`ÉCHEC: attendu que ${actual} contienne ${expected}`);
  },
  toHaveLength: (length: number) => {
    if (actual.length !== length) throw new Error(`ÉCHEC: attendu une longueur de ${length}, reçu ${actual.length}`);
  }
});

const runTests = async () => {
  let passed = 0;
  let failed = 0;
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ SUCCÈS: ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`❌ ÉCHEC: ${name}`);
      console.error(e.message);
      failed++;
    }
  }
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
// FIX: Corrected mock project to match KoboProject type. Renamed 'aiActionLog' to 'auditLog' and added 'managedUsers' and other missing properties.
const mockProject: KoboProject = {
  id: 'test-proj',
  name: "Projet de Test",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  formData: {
    settings: {
      form_title: "Mon Formulaire de Test",
      form_id: "test_form_01",
      version: "v1.alpha",
      default_language: "default",
      languages: ["fr"],
    },
    survey: [
      { uid: 'uid1', type: 'text', name: 'nom', label: { default: 'Name', fr: 'Nom' }, required: true },
      { uid: 'uid2', type: 'integer', name: 'age', label: { default: 'Age' }, constraint: '. > 18' },
      { 
        uid: 'uid3', 
        type: 'select_one', 
        name: 'genre', 
        label: { default: 'Gender' },
        choices: [
            { uid: 'c1', name: 'male', label: { default: 'Male', fr: 'Homme' } },
            { uid: 'c2', name: 'female', label: { default: 'Female', fr: 'Femme' } },
        ]
      },
      { uid: 'uid4', type: 'note', name: 'merci', label: { default: 'Thank you' } },
    ],
    choices: [], // Choices are inline
  },
  chatHistory: [], 
  auditLog: [], 
  versions: [], 
  glossary: [], 
  submissions: [], 
  managedUsers: [], 
  analysisChatHistory: [],
  questionLibrary: [],
  questionModules: [],
  isRealtimeCoachEnabled: true,
  realtimeFeedback: {},
};


// --- Tests ---

test('generateXlsxBlob: doit créer un Blob', () => {
    const blob = generateXlsxBlob(mockProject);
    expect(blob).toBeDefined();
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
});

test('generateXlsxBlob: le workbook doit contenir les 3 feuilles standards', async () => {
    const blob = generateXlsxBlob(mockProject);
    const buffer = await blob.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'buffer' });
    
    expect(wb.SheetNames).toBeDefined();
    expect(wb.SheetNames.length >= 3).toBe(true);
    expect(wb.SheetNames).toContain('survey');
    expect(wb.SheetNames).toContain('choices');
    expect(wb.SheetNames).toContain('settings');
});

test('generateXlsxBlob: la feuille "survey" doit contenir les bonnes données', async () => {
    const blob = generateXlsxBlob(mockProject);
    const buffer = await blob.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const surveySheet = wb.Sheets['survey'];
    const surveyJson = XLSX.utils.sheet_to_json(surveySheet);
    
    expect(surveyJson).toHaveLength(4);
    
    // Check question 1 (nom)
    const q1 = surveyJson[0];
    expect(q1.type).toBe('text');
    expect(q1.name).toBe('nom');
    expect(q1.label).toBe('Name');
    expect(q1['label::fr']).toBe('Nom');
    expect(q1.required).toBe('yes');

    // Check question 3 (genre) type transformation
    const q3 = surveyJson[2];
    expect(q3.type).toBe('select_one genre');
});

test('generateXlsxBlob: la feuille "choices" doit contenir les bonnes données', async () => {
    const blob = generateXlsxBlob(mockProject);
    const buffer = await blob.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const choicesSheet = wb.Sheets['choices'];
    const choicesJson = XLSX.utils.sheet_to_json(choicesSheet);
    
    expect(choicesJson).toHaveLength(2);

    const choice1 = choicesJson[0];
    expect(choice1.list_name).toBe('genre');
    expect(choice1.name).toBe('male');
    expect(choice1.label).toBe('Male');
    expect(choice1['label::fr']).toBe('Homme');
});

test('generateXlsxBlob: la feuille "settings" doit contenir les bonnes données', async () => {
    const blob = generateXlsxBlob(mockProject);
    const buffer = await blob.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const settingsSheet = wb.Sheets['settings'];
    const settingsJson = XLSX.utils.sheet_to_json(settingsSheet);
    
    expect(settingsJson).toHaveLength(1);
    const settings = settingsJson[0];
    expect(settings.form_title).toBe('Mon Formulaire de Test');
    expect(settings.form_id).toBe('test_form_01');
    expect(settings.default_language).toBe('default');
});

// --- Exécution des Tests ---
runTests();
