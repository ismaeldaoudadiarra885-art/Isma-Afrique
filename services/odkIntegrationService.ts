import { supabaseService, Submission } from './supabaseClient';

// ODK Integration Service
// This service handles integration with ODK Collect and ODK Central

export interface ODKServerConfig {
  url: string;
  username: string;
  password: string;
  projectId?: string;
}

export interface ODKSubmission {
  instanceId: string;
  formId: string;
  xmlContent: string;
  attachments?: { filename: string; url: string }[];
  submittedAt: string;
}

class ODKIntegrationService {
  private config: ODKServerConfig | null = null;

  // Configure ODK server connection
  configureServer(config: ODKServerConfig) {
    this.config = config;
  }

  // Test connection to ODK server
  async testConnection(): Promise<boolean> {
    if (!this.config) {
      throw new Error('ODK server not configured');
    }

    try {
      // This would make an actual API call to ODK Central
      // For now, we'll simulate the connection test
      const response = await fetch(`${this.config.url}/projects`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('ODK connection test failed:', error);
      return false;
    }
  }

  // Fetch submissions from ODK server
  async fetchODKSubmissions(formId: string, lastSync?: Date): Promise<ODKSubmission[]> {
    if (!this.config) {
      throw new Error('ODK server not configured');
    }

    try {
      // This would fetch submissions from ODK Central API
      // For now, we'll return mock data
      const mockSubmissions: ODKSubmission[] = [
        {
          instanceId: 'uuid:12345678-1234-1234-1234-123456789abc',
          formId: formId,
          xmlContent: '<?xml version="1.0"?><data><name>John Doe</name><age>30</age></data>',
          submittedAt: new Date().toISOString(),
        }
      ];

      return mockSubmissions;
    } catch (error) {
      console.error('Error fetching ODK submissions:', error);
      throw error;
    }
  }

  // Convert ODK XML to our submission format
  parseODKSubmission(odkSubmission: ODKSubmission, projectId: string, organizationId: string): Partial<Submission> {
    try {
      // Parse XML content to extract form data
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(odkSubmission.xmlContent, 'text/xml');

      // Extract form data (this would be more sophisticated in real implementation)
      const data: any = {};
      const elements = xmlDoc.getElementsByTagName('*');

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (element.children.length === 0 && element.textContent) {
          data[element.tagName] = element.textContent;
        }
      }

      return {
        project_id: projectId,
        organization_id: organizationId,
        data: data,
        submitted_by: 'odk-collect',
        submitted_at: odkSubmission.submittedAt,
        status: 'pending',
        device_info: {
          source: 'odk-collect',
          instanceId: odkSubmission.instanceId,
          formId: odkSubmission.formId,
        }
      };
    } catch (error) {
      console.error('Error parsing ODK submission:', error);
      throw new Error('Failed to parse ODK submission XML');
    }
  }

  // Sync ODK submissions to our database
  async syncODKSubmissions(formId: string, projectId: string, organizationId: string): Promise<{
    synced: number;
    errors: number;
    details: string[];
  }> {
    const results = {
      synced: 0,
      errors: 0,
      details: [] as string[],
    };

    try {
      const odkSubmissions = await this.fetchODKSubmissions(formId);

      for (const odkSubmission of odkSubmissions) {
        try {
          // Check if submission already exists
          const existingSubmission = await supabaseService.getProjectSubmissions(projectId)
            .then(submissions => submissions.find(s =>
              s.device_info?.instanceId === odkSubmission.instanceId
            ));

          if (existingSubmission) {
            results.details.push(`Submission ${odkSubmission.instanceId} already exists, skipping`);
            continue;
          }

          // Parse and create submission
          const submissionData = this.parseODKSubmission(odkSubmission, projectId, organizationId);
          await supabaseService.createSubmission(submissionData);

          results.synced++;
          results.details.push(`Synced submission ${odkSubmission.instanceId}`);
        } catch (error) {
          results.errors++;
          results.details.push(`Error syncing ${odkSubmission.instanceId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      results.details.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return results;
  }

  // Export form to XLSForm for ODK deployment
  async exportFormForODK(projectId: string): Promise<string> {
    try {
      // This would use the existing XLSForm export functionality
      // and return the download URL or file content
      const { exportToXLSForm } = await import('./xlsformExportService');

      // Get project data (this would come from your project context)
      const project = {
        id: projectId,
        name: 'ODK Form',
        formData: {
          survey: [], // Would be populated with actual survey data
          choices: [],
          settings: {
            form_title: 'Formulaire ODK',
            default_language: 'fr',
          }
        }
      };

      const filename = `odk-form-${projectId}.xlsx`;
      exportToXLSForm(project as any, filename);

      return filename;
    } catch (error) {
      console.error('Error exporting form for ODK:', error);
      throw error;
    }
  }

  // Get server projects (for form deployment)
  async getServerProjects(): Promise<any[]> {
    if (!this.config) {
      throw new Error('ODK server not configured');
    }

    try {
      // This would fetch projects from ODK Central API
      // For now, return mock data
      return [
        { id: 1, name: 'Household Survey', forms: [] },
        { id: 2, name: 'Community Assessment', forms: [] },
      ];
    } catch (error) {
      console.error('Error fetching server projects:', error);
      throw error;
    }
  }

  // Get ODK server status
  async getServerStatus(): Promise<{
    connected: boolean;
    projects?: any[];
    error?: string;
  }> {
    if (!this.config) {
      return { connected: false, error: 'Server not configured' };
    }

    try {
      const isConnected = await this.testConnection();
      if (!isConnected) {
        return { connected: false, error: 'Cannot connect to server' };
      }

      // Fetch projects (simplified)
      const projects = [
        { id: 1, name: 'Project 1' },
        { id: 2, name: 'Project 2' },
      ];

      return { connected: true, projects };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const odkIntegrationService = new ODKIntegrationService();
