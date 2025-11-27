// FIX: Created full content for exportUtils.ts to resolve module errors.
import * as XLSX from 'xlsx';
import { Submission, KoboQuestion, GlossaryEntry, LocalizedText } from '../types';
import { getLocalizedText } from './localizationUtils';

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