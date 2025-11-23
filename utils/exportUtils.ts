// FIX: Created full content for exportUtils.ts to resolve module errors.
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import initSqlJs from 'sql.js';
import { Submission, KoboQuestion, GlossaryEntry, LocalizedText } from '../types';
import { getLocalizedText } from './localizationUtils';
import { addCodedData } from './dataCodingUtils';

export const exportSubmissionsToXlsx = (
    submissions: Submission[],
    questions: KoboQuestion[],
    formId: string
): void => {
    if (submissions.length === 0) return;
    
    const defaultLang = 'default'; // Assuming default for export headers
    
    const headers = questions
        .filter(q => !['begin_group', 'end_group', 'note', 'calculate'].includes(q.type))
        .map(q => ({
            header: getLocalizedText(q.label, defaultLang) || q.name,
            key: q.name,
        }));
        
    const dataForSheet = submissions.map(s => {
        const row: { [key: string]: any } = {
            'submission_id': s.id,
            'submission_timestamp': s.timestamp,
        };
        headers.forEach(h => {
            row[h.key] = s.data[h.key];
        });
        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
    
    // Set headers with full labels
    XLSX.utils.sheet_add_aoa(worksheet, [['ID de Soumission', 'Date de Soumission', ...headers.map(h => h.header)]], { origin: 'A1' });
    
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Data_${formId}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};


export const exportGlossaryToXlsx = (
    glossary: GlossaryEntry[],
    formId: string
): void => {
    if (glossary.length === 0) return;
    
    const dataForSheet = glossary.map(entry => ({
        'Terme': entry.term,
        'Catégorie': entry.category,
        'Niveau': entry.level,
        'Définition (Français)': entry.definition_fr,
        'Explication (Bambara)': entry.explanation_bm,
        'Exemple Local': entry.example_local,
        'Annotation Personnelle': entry.user_annotation,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataForSheet);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Glossaire');
    
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Glossaire_${formId}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const exportSubmissionsToCsv = (
    submissions: Submission[],
    questions: KoboQuestion[],
    formId: string
): void => {
    if (submissions.length === 0) return;

    const defaultLang = 'default';
    const codedSubmissions = addCodedData(submissions, questions);

    const headers = questions
        .filter(q => !['begin_group', 'end_group', 'note', 'calculate'].includes(q.type))
        .map(q => ({
            header: getLocalizedText(q.label, defaultLang) || q.name,
            key: q.name,
        }));

    const dataForCsv = codedSubmissions.map(s => {
        const row: { [key: string]: any } = {
            'submission_id': s.id,
            'submission_timestamp': s.timestamp,
        };
        headers.forEach(h => {
            row[h.key] = s.data[h.key];
            row[`${h.key}_coded`] = s.data[`${h.key}_coded`];
        });
        return row;
    });

    const csv = Papa.unparse(dataForCsv);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Data_${formId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const exportSubmissionsToSqlite = async (
    submissions: Submission[],
    questions: KoboQuestion[],
    formId: string
): Promise<void> => {
    if (submissions.length === 0) return;

    const SQL = await initSqlJs();
    const db = new SQL.Database();

    const defaultLang = 'default';
    const codedSubmissions = addCodedData(submissions, questions);

    // Create table
    const columns = questions
        .filter(q => !['begin_group', 'end_group', 'note', 'calculate'].includes(q.type))
        .map(q => `${q.name} TEXT, ${q.name}_coded TEXT`);

    const createTableSQL = `
        CREATE TABLE submissions (
            submission_id TEXT PRIMARY KEY,
            submission_timestamp TEXT,
            ${columns.join(', ')}
        );
    `;

    db.run(createTableSQL);

    // Insert data
    const insertSQL = `
        INSERT INTO submissions VALUES (?, ?, ${columns.map(() => '?, ?').join(', ')});
    `;

    const stmt = db.prepare(insertSQL);

    codedSubmissions.forEach(s => {
        const values = [
            s.id,
            s.timestamp,
            ...questions
                .filter(q => !['begin_group', 'end_group', 'note', 'calculate'].includes(q.type))
                .flatMap(q => [s.data[q.name], s.data[`${q.name}_coded`]])
        ];
        stmt.run(values);
    });

    stmt.free();

    // Export database
    const data = db.export();
    const buffer = data;
    const blob = new Blob([buffer], { type: 'application/octet-stream' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Data_${formId}.sqlite`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    db.close();
};

export const exportSubmissionsToApiJson = (
    submissions: Submission[],
    questions: KoboQuestion[],
    formId: string
): void => {
    if (submissions.length === 0) return;

    const codedSubmissions = addCodedData(submissions, questions);

    const apiData = {
        form_id: formId,
        total_submissions: submissions.length,
        export_timestamp: new Date().toISOString(),
        questions: questions.map(q => ({
            name: q.name,
            label: q.label,
            type: q.type,
            choices: q.choices
        })),
        submissions: codedSubmissions.map(s => ({
            id: s.id,
            timestamp: s.timestamp,
            data: s.data
        }))
    };

    const json = JSON.stringify(apiData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Data_${formId}_api.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
