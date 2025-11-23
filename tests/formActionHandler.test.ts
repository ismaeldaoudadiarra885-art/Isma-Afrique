// @ts-nocheck
import { handleFunctionCalls } from '../utils/formActionHandler';
import { KoboProject } from '../types';

console.log("--- DÉMARRAGE DES TESTS UNITAIRES POUR formActionHandler ---");

// --- Mini Test Runner et Mocks ---
const tests: { name: string, fn: () => Promise<void> | void }[] = [];
const test = (name: string, fn: () => Promise<void> | void) => tests.push({ name, fn });

let assertions = 0;
const expect = (actual: any) => ({
  toBeCalled: () => {
    assertions++;
    if (actual.calls.length === 0) throw new Error(`ÉCHEC: attendu que la fonction soit appelée, mais elle ne l'a pas été.`);
  },
  toBeCalledWith: (expected: any) => {
    assertions++;
    const lastCallArgs = actual.calls[actual.calls.length - 1];
    if (JSON.stringify(lastCallArgs) !== JSON.stringify(expected)) {
      throw new Error(`ÉCHEC: attendu un appel avec ${JSON.stringify(expected)}, mais reçu ${JSON.stringify(lastCallArgs)}`);
    }
  },
  toContain: (expected: string) => {
    assertions++;
    if (!actual.includes(expected)) throw new Error(`ÉCHEC: attendu que "${actual}" contienne "${expected}"`);
  },
  toEqual: (expected: any) => {
    assertions++;
    if(JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`ÉCHEC: attendu ${JSON.stringify(expected)}, mais reçu ${JSON.stringify(actual)}`);
    }
  }
});

const createMockFn = () => {
  const fn = (...args: any[]) => {
    fn.calls.push(args);
  };
  fn.calls = [] as any[];
  return fn;
};

const runTests = async () => {
  let passed = 0;
  let failed = 0;
  for (const { name, fn } of tests) {
    assertions = 0;
    try {
      await fn();
      console.log(`✅ SUCCÈS: ${name} (${assertions} assertions)`);
      passed++;
    } catch (e: any) {
      console.error(`❌ ÉCHEC: ${name}`);
      console.error(e.message);
      failed++;
    }
  }
  console.log("--- FIN DES TESTS ---");
  console.log(`Résultat : ${passed} succès, ${failed} échecs.`);
};
// --- Fin du Test Runner ---

// --- Données et Mocks de Test ---
const mockProject: KoboProject = { id: 'proj1', formData: { survey: [] } } as any;
const mockGetAssistance = async () => ({ text: 'Mocked AI response', functionCalls: null });

let mockContext: any;
const beforeEach = () => {
    mockContext = {
        addQuestion: createMockFn(),
        deleteQuestion: createMockFn(),
        updateQuestion: createMockFn(),
        reorderQuestion: createMockFn(),
        batchUpdateQuestions: createMockFn(),
        logAction: createMockFn(),
    };
};

// --- Tests ---

test('handler: addQuestion', async () => {
    beforeEach();
    const calls = [{ name: 'addQuestion', args: { type: 'text', name: 'q1', label: 'Question 1', required: true } }];
    await handleFunctionCalls(calls, mockContext, mockProject, mockGetAssistance);
    expect(mockContext.addQuestion).toBeCalled();
    
    const callArg = mockContext.addQuestion.calls[0][0];
    if (callArg.type !== 'text' || callArg.name !== 'q1' || callArg.label.fr !== 'Question 1') {
        throw new Error(`addQuestion called with wrong arguments: ${JSON.stringify(callArg)}`);
    }
    assertions++;
});

test('handler: deleteQuestion', async () => {
    beforeEach();
    const calls = [{ name: 'deleteQuestion', args: { questionName: 'q_to_delete' } }];
    await handleFunctionCalls(calls, mockContext, mockProject, mockGetAssistance);
    expect(mockContext.deleteQuestion).toBeCalledWith(['q_to_delete']);
});

test('handler: updateQuestion', async () => {
    beforeEach();
    const calls = [{ name: 'updateQuestion', args: { questionName: 'q_to_update', label: 'Nouveau Label' } }];
    await handleFunctionCalls(calls, mockContext, mockProject, mockGetAssistance);
    expect(mockContext.updateQuestion).toBeCalledWith(['q_to_update', { label: { fr: 'Nouveau Label' } }]);
});

test('handler: reorderQuestion', async () => {
    beforeEach();
    const calls = [{ name: 'reorderQuestion', args: { questionNameToMove: 'q2', targetQuestionName: 'q1', position: 'before' } }];
    await handleFunctionCalls(calls, mockContext, mockProject, mockGetAssistance);
    expect(mockContext.reorderQuestion).toBeCalledWith(['q2', 'q1', 'before']);
});

test('handler: batchUpdateQuestions avec JSON valide', async () => {
    beforeEach();
    const updates = [{ questionName: "q1", updates: { required: true } }];
    const calls = [{ name: 'batchUpdateQuestions', args: { updatesJson: JSON.stringify(updates) } }];
    await handleFunctionCalls(calls, mockContext, mockProject, mockGetAssistance);
    expect(mockContext.batchUpdateQuestions).toBeCalledWith([updates]);
});

test('handler: batchUpdateQuestions avec JSON invalide doit retourner une erreur', async () => {
    beforeEach();
    const calls = [{ name: 'batchUpdateQuestions', args: { updatesJson: 'pas du json' } }];
    const messages = await handleFunctionCalls(calls, mockContext, mockProject, mockGetAssistance);
    expect(messages[0]).toContain("Erreur de mise à jour en bloc");
});

test('handler: un appel de fonction inconnu doit être ignoré', async () => {
    beforeEach();
    const calls = [{ name: 'fonction_inconnue', args: {} }];
    await handleFunctionCalls(calls, mockContext, mockProject, mockGetAssistance);
    // Aucune fonction du context ne doit être appelée
    expect(mockContext.addQuestion.calls).toEqual([]);
    expect(mockContext.deleteQuestion.calls).toEqual([]);
});

test('handler: un appel de fonction sans arguments doit retourner une erreur', async () => {
    beforeEach();
    const calls = [{ name: 'addQuestion', args: undefined }];
    const messages = await handleFunctionCalls(calls, mockContext, mockProject, mockGetAssistance);
    expect(messages[0]).toContain("reçu sans arguments");
});

// --- Exécution des Tests ---
runTests();
