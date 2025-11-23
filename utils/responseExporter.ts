// FIX: Corrected import paths
import { Submission, KoboQuestion } from '../types';
import { exportSubmissionsToXlsx } from './exportUtils';

/**
 * Exports submission data in various formats.
 * @param submissions The array of submissions to export.
 * @param questions The form's question array for context (headers).
 * @param formId The ID of the form, used for the filename.
 * @param format The desired export format.
 */
export const exportResponses = (
    submissions: Submission[],
    questions: KoboQuestion[],
    formId: string,
    format: 'xlsx' | 'json'
): void => {
    if (format === 'xlsx') {
        // Use the existing, robust XLSX export function
        exportSubmissionsToXlsx(submissions, questions, formId);
    } else if (format === 'json') {
        // Implement JSON export
        const dataToExport = submissions.map(s => ({
            submission_id: s.id,
            submission_timestamp: s.timestamp,
            ...s.data
        }));
        
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Data_${formId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else {
        console.error(`Unsupported export format: ${format}`);
    }
};