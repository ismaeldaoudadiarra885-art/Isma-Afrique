// FIX: Corrected import path for types
import { KoboProject } from '../types';
import * as XLSX from 'xlsx';
import { getLocalizedText } from './localizationUtils';

export const generateXlsxBlob = (project: KoboProject): Blob => {
    const { formData } = project;
    const { settings, survey } = formData;
    const defaultLang = settings.default_language || 'default';
    const otherLangs = settings.languages || [];

    // --- SURVEY SHEET ---
    const surveyData = survey.map(q => {
        const row: { [key: string]: any } = {
            type: q.type,
            name: q.name,
            label: getLocalizedText(q.label, defaultLang),
        };
        
        otherLangs.forEach(lang => {
            const label = getLocalizedText(q.label, lang);
            if (label) row[`label::${lang}`] = label;
            
            const hint = getLocalizedText(q.hint, lang);
            if(hint) row[`hint::${lang}`] = hint;

            const constraintMsg = getLocalizedText(q.constraint_message, lang);
            if(constraintMsg) row[`constraint_message::${lang}`] = constraintMsg;
        });

        if (q.hint) row.hint = getLocalizedText(q.hint, defaultLang);
        if (q.required) row.required = 'yes';
        if (q.relevant) row.relevant = q.relevant;
        if (q.constraint) row.constraint = q.constraint;
        if (q.constraint_message) row.constraint_message = getLocalizedText(q.constraint_message, defaultLang);
        if (q.calculation) row.calculation = q.calculation;
        
        if ((q.type === 'select_one' || q.type === 'select_multiple') && q.choices) {
            // The list_name is derived from the question name
            row.type = `${q.type} ${q.name}`;
        }
        
        return row;
    });

    // --- CHOICES SHEET ---
    const choicesData: any[] = [];
    survey.forEach(q => {
        if ((q.type === 'select_one' || q.type === 'select_multiple') && q.choices) {
            q.choices.forEach(c => {
                 const choiceRow: { [key: string]: any } = {
                    list_name: q.name,
                    name: c.name,
                    label: getLocalizedText(c.label, defaultLang),
                };
                 if (c.image) {
                    choiceRow.image = c.image;
                 }
                 otherLangs.forEach(lang => {
                    const label = getLocalizedText(c.label, lang);
                    if (label) choiceRow[`label::${lang}`] = label;
                });
                choicesData.push(choiceRow);
            });
        }
    });

    // --- SETTINGS SHEET ---
    const settingsData = [{
        form_title: settings.form_title,
        form_id: settings.form_id,
        version: settings.version,
        default_language: settings.default_language,
    }];

    const surveyWs = XLSX.utils.json_to_sheet(surveyData);
    const choicesWs = XLSX.utils.json_to_sheet(choicesData);
    const settingsWs = XLSX.utils.json_to_sheet(settingsData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, surveyWs, 'survey');
    XLSX.utils.book_append_sheet(wb, choicesWs, 'choices');
    XLSX.utils.book_append_sheet(wb, settingsWs, 'settings');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};