import * as XLSX from 'xlsx';
import { Submission } from '../types';

export interface ExportFilters {
  region?: string;
  housingType?: string;
  incomeSource?: string;
  // Add more filters as needed based on form fields
}

export const filterSubmissions = (submissions: Submission[], filters: ExportFilters): Submission[] => {
  return submissions.filter(submission => {
    const data = submission.data;
    let matches = true;

    if (filters.region && data.region !== filters.region) {
      matches = false;
    }
    if (filters.housingType && data.type_logement !== filters.housingType) {
      matches = false;
    }
    if (filters.incomeSource && data.source_revenu !== filters.incomeSource) {
      matches = false;
    }

    return matches;
  });
};

export const getUniqueValues = (submissions: Submission[], field: string): string[] => {
  const values = new Set<string>();
  submissions.forEach(sub => {
    if (sub.data[field]) {
      values.add(sub.data[field]);
    }
  });
  return Array.from(values).sort();
};

export const exportFilteredData = (submissions: Submission[], format: 'xls' | 'csv' | 'json', filename: string, filters?: ExportFilters): void => {
  let filteredSubs = submissions;
  if (filters) {
    filteredSubs = filterSubmissions(submissions, filters);
  }

  if (format === 'json') {
    const jsonData = JSON.stringify(filteredSubs, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    // Prepare data for XLS/CSV: flatten submissions
    const exportData = filteredSubs.map(sub => ({
      id: sub.id,
      timestamp: sub.timestamp,
      status: sub.status,
      ...sub.data,
      // Add meta if needed
      device_id: sub.meta?.device_id,
      gps_lat: sub.meta?.gps?.lat,
      gps_lng: sub.meta?.gps?.lng,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Submissions');

    const fileExtension = format === 'xls' ? 'xls' : 'csv';
    XLSX.writeFile(wb, `${filename}.${fileExtension}`);
  }
};
