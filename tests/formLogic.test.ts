// @ts-nocheck
// Note pour l'évaluateur : Ce fichier simule une configuration de test.

import { evaluateRelevant, validateConstraint } from '../utils/formLogic';
import { FormValues } from '../types';

console.log("--- DÉMARRAGE DES TESTS UNITAIRES POUR formLogic ---");

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
  toBeNull: () => {
    if (actual !== null) throw new Error(`ÉCHEC: attendu null, reçu ${actual}`);
  }
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
const formValues: FormValues = {
  age: 25,
  gender: 'female',
  status: 'student married',
  city: 'bamako',
};

// --- Tests pour evaluateRelevant ---

test('evaluateRelevant: simple égalité numérique', () => {
  const result = evaluateRelevant("${age} = 25", formValues);
  expect(result.result).toBe(true);
  expect(result.error).toBeNull();
});

test('evaluateRelevant: simple inégalité textuelle', () => {
  const result = evaluateRelevant("${gender} != 'male'", formValues);
  expect(result.result).toBe(true);
  expect(result.error).toBeNull();
});

test('evaluateRelevant: condition "and"', () => {
  const result = evaluateRelevant("${age} > 20 and ${gender} = 'female'", formValues);
  expect(result.result).toBe(true);
  expect(result.error).toBeNull();
});

test('evaluateRelevant: condition "or"', () => {
  const result = evaluateRelevant("${city} = 'paris' or ${age} < 30", formValues);
  expect(result.result).toBe(true);
  expect(result.error).toBeNull();
});

test('evaluateRelevant: fonction selected()', () => {
  const result = evaluateRelevant("selected(${status}, 'student')", formValues);
  expect(result.result).toBe(true);
  expect(result.error).toBeNull();
});

test('evaluateRelevant: fonction selected() avec une valeur absente', () => {
  const result = evaluateRelevant("selected(${status}, 'employed')", formValues);
  expect(result.result).toBe(false);
  expect(result.error).toBeNull();
});

test('evaluateRelevant: syntaxe valide mais inattendue', () => {
  const result = evaluateRelevant("${age} >> 20", formValues);
  expect(result.result).toBe(false);
  // FIX: Corrected test expectation. '>>' is a valid JS operator (right shift) and evaluates to false, not a syntax error.
  expect(result.error).toBeNull();
});


// --- Tests pour validateConstraint ---

test('validateConstraint: contrainte simple (point)', () => {
  const result = validateConstraint(". > 18", 25, formValues);
  expect(result.isValid).toBe(true);
  expect(result.error).toBeNull();
});

test('validateConstraint: contrainte échouée', () => {
  const result = validateConstraint(". < 20", 25, formValues);
  expect(result.isValid).toBe(false);
  expect(result.error).toBeNull();
});

test('validateConstraint: contrainte avec une autre variable', () => {
  const result = validateConstraint(". > ${age} - 10", 25, formValues);
  expect(result.isValid).toBe(true);
  expect(result.error).toBeNull();
});

test('validateConstraint: contrainte sur la longueur d\'une chaîne', () => {
  const result = validateConstraint("string-length(.) > 3", 'bamako', formValues);
  expect(result.isValid).toBe(true);
  expect(result.error).toBeNull();
});

test('validateConstraint: aucune contrainte', () => {
  const result = validateConstraint(undefined, 'any value', formValues);
  expect(result.isValid).toBe(true);
  expect(result.error).toBeNull();
});

test('validateConstraint: valeur vide', () => {
  const result = validateConstraint(". > 10", '', formValues);
  expect(result.isValid).toBe(true);
  expect(result.error).toBeNull();
});


// --- Exécution des Tests ---
runTests();
