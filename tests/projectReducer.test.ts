// @ts-nocheck
import { projectReducer } from '../contexts/ProjectContext';
import { AppState, KoboProject } from '../types';
import { v4 as uuidv4 } from 'uuid';

console.log("--- DÉMARRAGE DES TESTS UNITAIRES POUR projectReducer ---");

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
  toBeDefined: () => {
    if (actual === undefined || actual === null) throw new Error(`ÉCHEC: attendu une valeur définie`);
  },
  toHaveLength: (length: number) => {
    if (actual.length !== length) throw new Error(`ÉCHEC: attendu une longueur de ${length}, reçu ${actual.length}`);
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
};
// --- Fin du Test Runner ---

// --- Données de Test ---
const initialState: AppState = {
    projects: [],
    activeProjectId: null,
    formValues: {},
    currentQuestionName: null,
    questionLibrary: [],
    userRole: null,
    isRoleLocked: false,
    isOnline: true,
    activeSubmissionId: null,
    isInitialized: false,
    analysisChatHistory: [],
};

const mockProject: KoboProject = {
    id: 'proj1',
    name: 'Test Project',
    createdAt: '',
    updatedAt: '',
    formData: { settings: {form_title: 'T', form_id: 't', version: '1', default_language: 'd'}, survey: [], choices: []},
    chatHistory: [], auditLog: [], versions: [], glossary: [], submissions: [], managedUsers: [], analysisChatHistory: [],
};

// --- Tests ---

test('Reducer: CREATE_PROJECT', () => {
    const action = { type: 'CREATE_PROJECT', payload: mockProject };
    const newState = projectReducer(initialState, action);
    expect(newState.projects).toHaveLength(1);
    expect(newState.projects[0].id).toBe('proj1');
    expect(newState.activeProjectId).toBe('proj1');
});

test('Reducer: SET_ACTIVE_PROJECT', () => {
    const stateWithProject = { ...initialState, projects: [mockProject] };
    const action = { type: 'SET_ACTIVE_PROJECT', payload: 'proj1' };
    const newState = projectReducer(stateWithProject, action);
    expect(newState.activeProjectId).toBe('proj1');
});

test('Reducer: DELETE_PROJECT', () => {
    const stateWithProject = { ...initialState, projects: [mockProject], activeProjectId: 'proj1' };
    const action = { type: 'DELETE_PROJECT', payload: 'proj1' };
    const newState = projectReducer(stateWithProject, action);
    expect(newState.projects).toHaveLength(0);
    expect(newState.activeProjectId).toBeNull();
});

// --- Exécution des Tests ---
runTests();
