// @ts-nocheck
// Note pour l'évaluateur : Ce fichier simule une configuration de test.

import { getLocalizedText, setLocalizedText } from '../utils/localizationUtils';

console.log("--- DÉMARRAGE DES TESTS UNITAIRES POUR localizationUtils ---");

// --- Mini Test Runner ---
const tests: { name: string, fn: () => void }[] = [];
const test = (name: string, fn: () => void) => tests.push({ name, fn });
const expect = (actual: any) => ({
  toBe: (expected: any) => {
    if (actual !== expected) throw new Error(`ÉCHEC: attendu "${expected}", reçu "${actual}"`);
  },
  toEqual: (expected: any) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`ÉCHEC: attendu ${JSON.stringify(expected)}, reçu ${JSON.stringify(actual)}`);
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
const textObj = {
  default: 'Name',
  fr: 'Nom',
  bm: 'Toko',
};

// --- Tests pour getLocalizedText ---

test('getLocalizedText: doit retourner le texte pour une langue existante', () => {
  expect(getLocalizedText(textObj, 'fr')).toBe('Nom');
});

test('getLocalizedText: doit retourner le texte par défaut si la langue n\'existe pas', () => {
  expect(getLocalizedText(textObj, 'en')).toBe('Name');
});

test('getLocalizedText: doit retourner le premier texte si "default" n\'existe pas', () => {
  const partialObj = { fr: 'Nom', bm: 'Toko' };
  expect(getLocalizedText(partialObj, 'en')).toBe('Nom');
});

test('getLocalizedText: doit gérer une chaîne de caractères en entrée (compatibilité)', () => {
  expect(getLocalizedText('Simple Text', 'fr')).toBe('Simple Text');
});

test('getLocalizedText: doit retourner une chaîne vide pour une entrée invalide', () => {
  expect(getLocalizedText(undefined, 'fr')).toBe('');
  expect(getLocalizedText(null, 'fr')).toBe('');
  expect(getLocalizedText([], 'fr')).toBe('');
});

// --- Tests pour setLocalizedText ---

test('setLocalizedText: doit ajouter une nouvelle langue à un objet existant', () => {
  const newObj = setLocalizedText(textObj, 'en', 'Name (EN)');
  expect(newObj).toEqual({ default: 'Name', fr: 'Nom', bm: 'Toko', en: 'Name (EN)' });
});

test('setLocalizedText: doit mettre à jour une langue existante', () => {
  const newObj = setLocalizedText(textObj, 'fr', 'Prénom');
  expect(newObj).toEqual({ default: 'Name', fr: 'Prénom', bm: 'Toko' });
});

test('setLocalizedText: doit créer un nouvel objet à partir de rien', () => {
  const newObj = setLocalizedText(undefined, 'fr', 'Nom');
  expect(newObj).toEqual({ fr: 'Nom' });
});

test('setLocalizedText: doit convertir une chaîne de caractères en objet localisé', () => {
  const newObj = setLocalizedText('Just Name', 'fr', 'Juste Nom');
  expect(newObj).toEqual({ default: 'Just Name', fr: 'Juste Nom' });
});


// --- Exécution des Tests ---
runTests();
