import { KoboQuestion, Submission, DataCleaningSuggestion } from '../types';
import _ from 'lodash';

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export const validateConstraint = (constraint: string, value: any, formValues: any): ValidationResult => {
    if (!constraint) {
        return { isValid: true };
    }

    try {
        // Simple evaluation - in production, use a safe evaluator
        // For now, basic checks; expand with full XLSForm constraint support
        const evalContext = { ...formValues, current: value };
        // eslint-disable-next-line no-eval
        const result = eval(constraint.replace(/selected\(/g, 'current === ')); // Basic replacement for selected() etc.
        return { isValid: !!result };
    } catch (error) {
        console.warn('Constraint evaluation error:', error);
        return { isValid: false, error: 'Invalid constraint' };
    }
};

export const validateCommonConstraints = (type: string, value: any): ValidationResult => {
    switch (type) {
        case 'integer':
            return { isValid: value === '' || (!isNaN(value) && Number.isInteger(Number(value))) };
        case 'decimal':
            return { isValid: value === '' || !isNaN(Number(value)) };
        case 'date':
            return { isValid: value === '' || !isNaN(Date.parse(value)) };
        case 'select_one':
        case 'select_multiple':
            return { isValid: value === '' || Array.isArray(value) ? value.every(v => typeof v === 'string') : typeof value === 'string' };
        default:
            return { isValid: true };
    }
};

export const detectDuplicates = (submissions: Submission[], threshold: number = 0.9): Submission[] => {
  const duplicates: Submission[] = [];
  const submissionKeys = submissions.map(s => ({
    id: s.id,
    key: `${s.meta?.device_id || 'unknown'}_${s.timestamp}_${JSON.stringify(_.pick(s.data, ['region', 'gps_lat', 'gps_lng']))}` // Key fields for duplicate check
  }));

  for (let i = 0; i < submissionKeys.length; i++) {
    for (let j = i + 1; j < submissionKeys.length; j++) {
      if (submissionKeys[i].key === submissionKeys[j].key) {
        duplicates.push(submissions[i], submissions[j]);
      }
    }
  }

  // Remove duplicates from array
  return _.uniqBy(duplicates, 'id');
};

export const detectInconsistencies = (submission: Submission, allSubmissions?: Submission[]): DataCleaningSuggestion[] => {
  const suggestions: DataCleaningSuggestion[] = [];
  const data = submission.data;

  // Generic checks - customize based on form fields
  if (data.age && (data.age < 0 || data.age > 150)) {
    suggestions.push({
      id: `incons_age_${submission.id}`,
      submissionId: submission.id,
      questionName: 'age',
      originalValue: data.age,
      suggestedValue: null,
      reason: 'Age outside reasonable range (0-150)',
      status: 'pending'
    });
  }

  if (data.income && data.income < 0) {
    suggestions.push({
      id: `incons_income_${submission.id}`,
      submissionId: submission.id,
      questionName: 'income',
      originalValue: data.income,
      suggestedValue: 0,
      reason: 'Income cannot be negative',
      status: 'pending'
    });
  }

  // Cross-submission checks if provided (e.g., duplicate responses in same region)
  if (allSubmissions) {
    const region = data.region;
    const regionSubs = allSubmissions.filter(s => s.data.region === region && s.id !== submission.id);
    if (regionSubs.length > 0 && _.isEqual(data, regionSubs[0].data)) {
      suggestions.push({
        id: `incons_dup_region_${submission.id}`,
        submissionId: submission.id,
        questionName: 'all_fields',
        originalValue: data,
        suggestedValue: null,
        reason: 'Identical submission in same region',
        status: 'pending'
      });
    }
  }

  return suggestions;
};
