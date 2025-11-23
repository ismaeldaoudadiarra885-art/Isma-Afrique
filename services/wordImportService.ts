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
    // Validation du fichier
    if (!file.name.toLowerCase().endsWith('.docx')) {
        throw new Error("Le fichier doit être au format .docx.");
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error("Le fichier est trop volumineux (max 10MB).");
    }

    notifyProgress("Étape 1/4 : Lecture du fichier Word...");
    const arrayBuffer = await fileToArrayBuffer(file);

    let text = '';
    try {
        notifyProgress("Étape 2/4 : Extraction du texte...");
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value || '';
        console.log('Texte extrait (longueur):', text.length, 'premiers 200 chars:', text.substring(0, 200));
    } catch (error) {
        console.error('Erreur mammoth:', error);
        throw new Error("Impossible d'extraire le texte du fichier Word. Vérifiez le format du document.");
    }

    if (text.trim().length < 50) {
        throw new Error("Le document semble vide ou ne contient pas assez de texte. Assurez-vous qu'il y a du contenu structuré (questions, sections).");
    }

    // Structuration IA du formulaire
    notifyProgress("Étape 3/4 : Structuration IA du formulaire...");

    let extractedQuestions: Partial<KoboQuestion>[] = [];
    try {
        const structuredForm = await structureFormFromText(text);
        extractedQuestions = structuredForm;
        console.log('Formulaire structuré par IA:', extractedQuestions.length, 'questions');
        notifyProgress(`Formulaire structuré: ${extractedQuestions.length} question(s).`);
    } catch (error) {
        console.warn('Erreur IA, fallback vers questions simples:', error);
        notifyProgress("IA indisponible, création de questions simples...");

        const lines = text.split('\n').filter(line => line.trim().length > 0 && line.trim().length < 200);
        const questionLines = lines.slice(0, 20); // Limite à 20 questions

        if (questionLines.length === 0) {
            extractedQuestions = [{
                type: 'note',
                name: 'imported_content',
                label: { fr: 'Contenu importé' },
                hint: { fr: text.substring(0, 500) + (text.length > 500 ? '...' : '') }
            }];
        } else {
            extractedQuestions = questionLines.map((line, index) => ({
                type: 'text',
                name: `q${index + 1}`,
                label: { fr: line.trim() },
                hint: { fr: '' }
            }));
        }
        notifyProgress(`Questions créées (fallback): ${extractedQuestions.length} question(s).`);
    }

    if (extractedQuestions.length === 0) {
       throw new Error("Aucune question extraite. Vérifiez le format du document (numérotation, sections, choix avec 'o').");
    }

    console.log('Questions finales:', extractedQuestions.length, extractedQuestions);

    notifyProgress("Étape 4/4 : Finalisation du projet...");

    let formTitle = file.name.replace('.docx', '');
    const warnings: string[] = [];

    // Petit délai pour laisser voir le message de progression
    await new Promise(resolve => setTimeout(resolve, 300));

    // Détecter titre
    if (extractedQuestions[0]?.type === 'note' && extractedQuestions.length > 1) {
        const potentialTitle = (extractedQuestions[0].label as any)?.fr;
        if (typeof potentialTitle === 'string' && potentialTitle.length < 100) {
            formTitle = potentialTitle;
            extractedQuestions.shift();
        }
    }

    // Collecter choices globales
    const globalChoices: any[] = [];
    const survey: KoboQuestion[] = extractedQuestions.map(q => {
        const { relevant, ...rest } = q;
        const question: KoboQuestion = {
            ...rest,
            uid: uuidv4(),
            type: rest.type || 'note',
            name: rest.name || `q_${uuidv4().substring(0,6)}`,
            label: rest.label || { fr: 'Sans libellé' },
            choices: rest.choices ? rest.choices.map((c: any) => {
                const choice = {
                    ...c,
                    uid: uuidv4(),
                    label: c.label
                };
                // Ajouter à global si unique
                const existing = globalChoices.find(gc => gc.name === c.name && gc.label.fr === c.label.fr);
                if (!existing) globalChoices.push(choice);
                return choice;
            }) : undefined
        };
        return question;
    });

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
            choices: globalChoices,
        },
        auditLog: [],
        chatHistory: [],
        analysisChatHistory: [],
        versions: [],
        glossary: glossaryData,
        submissions: [],
        managedUsers: [],
        questionLibrary: [],
        questionModules: [],
        isRealtimeCoachEnabled: true,
        realtimeFeedback: {},
    };

    warnings.push("Le formulaire a été importé par IA. Veuillez vérifier attentivement sa structure.");
    if (extractedQuestions.some(q => q.name?.startsWith('fallback_q_'))) {
        warnings.push("L'analyse AI a échoué ; questions créées depuis texte brut. Structurez mieux le .docx pour extraction IA.");
    }
    return { project, warnings };
};
