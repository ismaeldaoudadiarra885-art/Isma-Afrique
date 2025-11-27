import * as mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
// FIX: Corrected import paths
import { KoboProject, KoboQuestion } from '../types';
import { glossaryData } from '../data/glossaryData';
import { structureFormFromText } from './geminiService';

const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

interface ImportResult {
  project: KoboProject;
  warnings: string[];
}


export const importProjectFromWordFile = async (
    file: File, 
    notifyProgress: (message: string) => void
): Promise<ImportResult> => {
    notifyProgress("Étape 1/4 : Lecture du fichier Word...");
    const arrayBuffer = await fileToArrayBuffer(file);

    notifyProgress("Étape 2/4 : Extraction du texte...");
    const { value: text } = await mammoth.extractRawText({ arrayBuffer });

    notifyProgress("Étape 3/4 : Analyse par l'IA (veuillez patienter)...");
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const fullText = lines.join('\n');
    let formTitle = file.name.replace('.docx', '');
    const warnings: string[] = [];

    const extractedQuestions = await structureFormFromText(fullText);

    if (extractedQuestions.length === 0) {
       throw new Error("L'IA n'a pu extraire aucune question valide. Le document est peut-être vide ou dans un format non reconnu. Essayez de simplifier la mise en page de votre document Word.");
    }
    
    notifyProgress("Étape 4/4 : Création du projet...");

    // The AI might interpret the title as a 'note'. We can try to detect and use it as the form title.
    if (extractedQuestions[0]?.type === 'note' && extractedQuestions.length > 1) {
        const potentialTitle = (extractedQuestions[0].label as any)?.fr;
        if (typeof potentialTitle === 'string' && potentialTitle.length < 100) {
            formTitle = potentialTitle;
            extractedQuestions.shift(); // Remove the title from the questions list
        }
    }

    const survey: KoboQuestion[] = extractedQuestions.map(q => ({
        ...q,
        uid: uuidv4(),
        type: q.type || 'note',
        name: q.name || `q_${uuidv4().substring(0,6)}`,
        label: q.label || { fr: 'Sans libellé' },
        choices: q.choices?.map((c: any) => ({
            ...c,
            uid: uuidv4(),
            label: c.label
        })) || undefined
    } as KoboQuestion));

    const project: KoboProject = {
        id: uuidv4(),
        name: formTitle,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        formData: {
            settings: {
              form_title: formTitle,
              form_id: formTitle.toLowerCase().replace(/\s+/g, '_').slice(0, 30),
              version: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
              default_language: 'fr',
            },
            survey: survey,
            choices: [],
        },
        auditLog: [],
        chatHistory: [],
        analysisChatHistory: [],
        versions: [],
        glossary: glossaryData,
        submissions: [],
        managedUsers: [],
        // FIX: Added missing properties to conform to KoboProject type
        questionLibrary: [],
        questionModules: [],
        isRealtimeCoachEnabled: true,
        realtimeFeedback: {},
    };

    warnings.push("Le formulaire a été importé par IA. Veuillez vérifier attentivement sa structure.");
    return { project, warnings };
};