
import { KoboProject } from '../types';
import { generateXlsxBlob } from '../utils/xlsformUtils';

const KoboAPIError = class extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'KoboAPIError';
  }
};


export const deployToKobo = async (
    project: KoboProject,
    serverUrl: string,
    apiToken: string
): Promise<string> => {
    const isUpdate = !!project.koboAssetUid;
    const apiUrl = isUpdate
        ? `${serverUrl}/api/v2/assets/${project.koboAssetUid}/`
        // The endpoint for creating a new project from an import
        : `${serverUrl}/api/v2/assets/`;

    const method = isUpdate ? 'PATCH' : 'POST';

    // 1. Generate the XLSX file from project data
    const xlsxBlob = generateXlsxBlob(project);

    // 2. Prepare the multipart/form-data payload
    const formData = new FormData();
    if(isUpdate) {
        // When updating, the file is sent in a 'file' field
        formData.append('file', xlsxBlob, `${project.formData.settings.form_id}.xlsx`);
    } else {
        // When creating, it's an import with a specific type
        formData.append('asset_type', 'survey');
        formData.append('name', project.name);
        formData.append('description', project.description || `Projet créé avec ISMA le ${new Date().toLocaleDateString()}`);
        formData.append('source_file', xlsxBlob, `${project.formData.settings.form_id}.xlsx`);
    }

    // 3. Make the API request
    const response = await fetch(apiUrl, {
        method: method,
        headers: {
            'Authorization': `Token ${apiToken}`,
            // 'Content-Type' is set automatically by the browser for FormData
        },
        body: formData,
    });
    
    // 4. Handle the response
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Réponse d\'erreur non-JSON.' }));
        throw new KoboAPIError(errorData.detail || `Erreur ${response.status}: ${response.statusText}`, response.status);
    }

    const result = await response.json();
    
    // The asset UID is in the 'uid' field on both creation and update
    if (!result.uid) {
        throw new KoboAPIError("La réponse de l'API Kobo ne contenait pas l'UID de l'asset.");
    }

    return result.uid;
};
      