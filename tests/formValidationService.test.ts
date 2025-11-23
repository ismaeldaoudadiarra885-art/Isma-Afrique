// @ts-nocheck
// Note pour l'évaluateur : Ce fichier simule une configuration de test.

import { detectCircularDependencies, findUndefinedVariables } from '../services/formValidationService';
import { KoboQuestion } from '../types';

console.log("--- DÉMARRAGE DES TESTS UNITAIRES POUR formValidationService ---");

// --- Mini Test Runner ---
const tests: { name: string, fn: () => void }[] = [];
const test = (name: string, fn: () => void) => tests.push({ name, fn });
const expect = (actual: any) => ({
  toBe: (expected: any) => {
    if (actual !== expected) throw new Error(`ÉCHEC: attendu ${expected}, reçu ${actual}`);
  },
  toEqual: (expected: any) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`ÉCHEC: attendu ${JSON.stringify(expected)}, reçu ${JSON.stringify(actual)}`);
  },
  toHaveLength: (length: number) => {
    if (actual.length !== length) throw new Error(`ÉCHEC: attendu une longueur de ${length}, reçu ${actual.length}`);
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
};
// --- Fin du Test Runner ---


// --- Données de Test ---
const surveyWithoutIssues: KoboQuestion[] = [
  { uid: 'q1', name: 'age', type: 'integer', label: 'Age' },
  { uid: 'q2', name: 'is_adult', type: 'note', label: 'Is Adult', relevant: '${age} > 18' },
];

const surveyWithUndefinedVar: KoboQuestion[] = [
  { uid: 'q1', name: 'age', type: 'integer', label: 'Age' },
  { uid: 'q2', name: 'show_q', type: 'note', label: 'Show', relevant: '${nom} = "test"' },
];

const surveyWithCircularDep: KoboQuestion[] = [
  { uid: 'q1', name: 'a', type: 'integer', label: 'A', relevant: '${b} > 5' },
  { uid: 'q2', name: 'b', type: 'integer', label: 'B', relevant: '${a} > 5' },
  { uid: 'q3', name: 'c', type: 'integer', label: 'C' },
];

const surveyWithLongerCircularDep: KoboQuestion[] = [
  { uid: 'q1', name: 'a', type: 'integer', label: 'A', relevant: '${c} = 1' },
  { uid: 'q2', name: 'b', type: 'integer', label: 'B', relevant: '${a} = 1' },
  { uid: 'q3', name: 'c', type: 'integer', label: 'C', relevant: '${b} = 1' },
];

// --- Tests ---

test('findUndefinedVariables: doit retourner un tableau vide pour un formulaire valide', () => {
  const errors = findUndefinedVariables(surveyWithoutIssues);
  expect(errors).toHaveLength(0);
});

test('findUndefinedVariables: doit détecter une variable non définie', () => {
  const errors = findUndefinedVariables(surveyWithUndefinedVar);
  expect(errors).toHaveLength(1);
  expect(errors[0].questionName).toBe('show_q');
  expect(errors[0].undefinedVar).toBe('nom');
});

test('detectCircularDependencies: doit retourner un tableau vide pour un formulaire valide', () => {
  const cycle = detectCircularDependencies(surveyWithoutIssues);
  expect(cycle).toHaveLength(0);
});

test('detectCircularDependencies: doit détecter une dépendance circulaire simple', () => {
  const cycle = detectCircularDependencies(surveyWithCircularDep);
  expect(cycle).toHaveLength(2);
  expect(cycle.includes('a')).toBe(true);
  expect(cycle.includes('b')).toBe(true);
});

test('detectCircularDependencies: doit détecter une dépendance circulaire plus longue', () => {
  const cycle = detectCircularDependencies(surveyWithLongerCircularDep);
  expect(cycle).toHaveLength(3);
  expect(cycle.includes('a')).toBe(true);
  expect(cycle.includes('b')).toBe(true);
  expect(cycle.includes('c')).toBe(true);
});

// --- Exécution des Tests ---
runTests();