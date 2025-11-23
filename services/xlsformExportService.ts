import * as XLSX from 'xlsx';
import { KoboProject } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface XLSFormSurveyRow {
  type: string;
  name: string;
  label?: string;
  hint?: string;
  relevant?: string;
  constraint?: string;
  constraint_message?: string;
  required?: string;
  appearance?: string;
  calculation?: string;
  list_name?: string;
  choice_filter?: string;
}

interface XLSFormChoicesRow {
  list_name: string;
  name: string;
  label: string;
}

interface XLSFormSettingsRow {
  form_title: string;
  form_id: string;
  version: string;
  id_string: string;
  style: string;
  default_language: string;
  right_to_left?: string;
}

export const exportToXLSForm = (project: KoboProject, filename: string = 'formulaire.xlsx'): void => {
  const { formData } = project;
  const { survey, choices, settings } = formData;
  const defaultLang = settings.default_language || 'fr';

  // Survey sheet
  const surveyData: XLSFormSurveyRow[] = [];

  // Add settings as first row if needed, but typically settings are separate
  survey.forEach((question) => {
    const row: XLSFormSurveyRow = {
      type: question.type,
      name: question.name,
      label: question.label?.[defaultLang] || '',
      hint: question.hint?.[defaultLang] || '',
      relevant: question.relevant || '',
      constraint: question.constraint || '',
      constraint_message: question.constraint_message?.[defaultLang] || '',
      required: question.required ? 'yes' : 'no',
      appearance: question.appearance || '',
      calculation: question.calculation || '',
      list_name: question.list_name || '',
      choice_filter: question.choice_filter || '',
    };

    // Handle groups
    if (question.type === 'begin group') {
      surveyData.push(row);
    } else if (question.type === 'end group') {
      surveyData.push(row);
    } else {
      surveyData.push(row);
    }
  });

  // Choices sheet
  const choicesData: XLSFormChoicesRow[] = [];
  choices.forEach((choice) => {
    const row: XLSFormChoicesRow = {
      list_name: choice.list_name || '',
      name: choice.name,
      label: choice.label?.[defaultLang] || '',
    };
    choicesData.push(row);
  });

  // Settings sheet
  const settingsData: XLSFormSettingsRow[] = [{
    form_title: settings.form_title || '',
    form_id: settings.form_id || '',
    version: settings.version || '',
    id_string: settings.id_string || uuidv4().slice(0, 8),
    style: settings.style || 'formhub',
    default_language: defaultLang,
    right_to_left: settings.right_to_left || 'no',
  }];

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Survey sheet
  const surveyWS = XLSX.utils.json_to_sheet(surveyData);
  XLSX.utils.book_append_sheet(wb, surveyWS, 'survey');

  // Choices sheet
  if (choicesData.length > 0) {
    const choicesWS = XLSX.utils.json_to_sheet(choicesData);
    XLSX.utils.book_append_sheet(wb, choicesWS, 'choices');
  }

  // Settings sheet
  const settingsWS = XLSX.utils.json_to_sheet(settingsData);
  XLSX.utils.book_append_sheet(wb, settingsWS, 'settings');

  // Write file
  XLSX.writeFile(wb, filename);
};

export const getXLSFormDownloadUrl = (project: KoboProject): string => {
  // For blob URL if needed, but writeFile handles download
  return '';
};
