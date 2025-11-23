import { createClient } from '@supabase/supabase-js';

const isDemoMode = (import.meta as any).env?.VITE_DEMO_MODE === 'true';

// Configuration Supabase
const supabaseUrl = 'https://yyfxgymlrzpcjoaldxxb.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Demo data
const demoOrganizations: Organization[] = [
  {
    id: 'demo-org-1',
    name: 'ONG Humanitaire Internationale',
    description: 'Aide humanitaire en Afrique',
    admin_email: 'contact@ong-humanitaire.org',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    settings: {
      max_projects: 5,
      max_users: 20,
      features_enabled: ['projects', 'users', 'analytics']
    }
  },
  {
    id: 'demo-org-2',
    name: 'Association Développement Durable',
    description: 'Projets de développement durable',
    admin_email: 'info@dev-durable.org',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    settings: {
      max_projects: 3,
      max_users: 15,
      features_enabled: ['projects', 'users']
    }
  }
];

let demoOrgUsers: OrganizationUser[] = []; // Local storage for demo users

// Types pour les tables Supabase
export interface Organization {
  id: string;
  name: string;
  description?: string;
  admin_email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  settings: {
    max_projects: number;
    max_users: number;
    features_enabled: string[];
  };
}

export interface OrganizationUser {
  id: string;
  organization_id: string;
  user_id: string;
  name?: string;
  email?: string;
  role: 'admin' | 'project_manager' | 'enumerator' | 'supervisor';
  access_code: string;
  is_active: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  form_data: any;
  settings: any;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Submission {
  id: string;
  project_id: string;
  organization_id: string;
  data: any;
  submitted_by: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  device_info?: any;
  household_comments?: string[];
  household_validated?: boolean;
  feedback_timestamp?: string;
  access_code?: string;
}

// Fonctions utilitaires pour Supabase
export const supabaseService = {
  // Authentification
  async signInWithAccessCode(accessCode: string) {
    if (isDemoMode) {
      // Mode démo : simulation d'une connexion réussie
      console.log('Mode démo : connexion avec code', accessCode);
      const demoUser = demoOrgUsers.find(u => u.access_code === accessCode);
      if (demoUser) {
        const org = demoOrganizations.find(o => o.id === demoUser.organization_id);
        // Log successful login in demo
        console.log('Mode démo : connexion réussie pour', demoUser.access_code);
        return {
          ...demoUser,
          organizations: org
        };
      }
      throw new Error('Code d\'accès invalide');
    }

    // Recherche l'utilisateur par code d'accès
    const { data: orgUser, error } = await supabase
      .from('organization_users')
      .select(`
        *,
        organizations (
          id,
          name,
          is_active
        )
      `)
      .eq('access_code', accessCode)
      .eq('is_active', true)
      .single();

    if (error || !orgUser) {
      // Log failed login attempt
      await supabase.rpc('log_audit_action', {
        p_organization_id: null, // Will be set by trigger if user exists
        p_user_id: accessCode, // Use access code as identifier for failed attempts
        p_action: 'login_attempt_failed',
        p_resource_type: 'auth',
        p_resource_id: accessCode,
        p_details: { reason: 'invalid_access_code' }
      });
      throw new Error('Code d\'accès invalide');
    }

    if (!orgUser.organizations?.is_active) {
      throw new Error('Organisation inactive');
    }

    // Log successful login
    await supabase.rpc('log_audit_action', {
      p_organization_id: orgUser.organization_id,
      p_user_id: orgUser.access_code,
      p_action: 'login_attempt_success',
      p_resource_type: 'auth',
      p_resource_id: orgUser.id,
      p_details: { role: orgUser.role }
    });

    return orgUser;
  },

  // Organisations
  async getOrganizations() {
    if (isDemoMode) {
      console.log('Mode démo : récupération des organisations');
      return demoOrganizations;
    }

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data;
  },

  async createOrganization(orgData: Partial<Organization>) {
    if (isDemoMode) {
      console.log('Mode démo : création d\'organisation simulée', orgData);
      const newOrg: Organization = {
        id: `demo-org-${demoOrganizations.length + 1}`,
        name: orgData.name || 'Nouvelle Org',
        description: orgData.description || '',
        admin_email: orgData.admin_email || '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        settings: orgData.settings as any || { max_projects: 10, max_users: 50, features_enabled: ['projects', 'users'] }
      };
      demoOrganizations.push(newOrg);
      return newOrg;
    }

    const { data, error } = await supabase
      .from('organizations')
      .insert([orgData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateOrganization(id: string, updates: Partial<Organization>) {
    if (isDemoMode) {
      console.log('Mode démo : mise à jour d\'organisation simulée', id, updates);
      const index = demoOrganizations.findIndex(o => o.id === id);
      if (index !== -1) {
        demoOrganizations[index] = { ...demoOrganizations[index], ...updates, updated_at: new Date().toISOString() };
        return demoOrganizations[index];
      }
      throw new Error('Organisation non trouvée');
    }

    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Utilisateurs d'organisation
  async getOrganizationUsers(organizationId: string) {
    if (isDemoMode) {
      console.log('Mode démo : récupération des utilisateurs d\'organisation', organizationId);
      return demoOrgUsers.filter(u => u.organization_id === organizationId);
    }

    const { data, error } = await supabase
      .from('organization_users')
      .select(`
        *,
        user:user_id (
          email,
          created_at
        )
      `)
      .eq('organization_id', organizationId);

    if (error) throw error;
    return data;
  },

  async createOrganizationUser(userData: Partial<OrganizationUser>) {
    if (isDemoMode) {
      console.log('Mode démo : création d\'utilisateur simulée', userData);
      const accessCode = userData.access_code || Math.random().toString(36).substring(2,8).toUpperCase();
      const newUser: OrganizationUser = {
        id: `demo-user-${Date.now()}`,
        organization_id: userData.organization_id || '',
        user_id: userData.user_id || `user_${Date.now()}`,
        name: userData.name,
        email: userData.email,
        role: userData.role as any || 'enumerator',
        access_code: accessCode,
        is_active: true,
        created_at: new Date().toISOString()
      };
      demoOrgUsers.push(newUser);
      return newUser;
    }

    const accessCode = userData.access_code || Math.random().toString(36).substring(2,8).toUpperCase();
    const insertData = {
      ...userData,
      access_code: accessCode,
      is_active: true,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('organization_users')
      .insert([insertData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Enhanced user management functions
  async searchUsers(organizationId: string, query: string) {
    if (isDemoMode) {
      const users = demoOrgUsers.filter(u => u.organization_id === organizationId);
      return users.filter(u =>
        u.name?.toLowerCase().includes(query.toLowerCase()) ||
        u.email?.toLowerCase().includes(query.toLowerCase()) ||
        u.role?.toLowerCase().includes(query.toLowerCase()) ||
        u.access_code?.toLowerCase().includes(query.toLowerCase())
      );
    }

    const { data, error } = await supabase
      .from('organization_users')
      .select('*')
      .eq('organization_id', organizationId)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,role.ilike.%${query}%,access_code.ilike.%${query}%`);

    if (error) throw error;
    return data;
  },

  async bulkUpdateUsers(userIds: string[], updates: Partial<OrganizationUser>) {
    if (isDemoMode) {
      demoOrgUsers = demoOrgUsers.map(u =>
        userIds.includes(u.id) ? { ...u, ...updates } : u
      );
      return demoOrgUsers.filter(u => userIds.includes(u.id));
    }

    const { data, error } = await supabase
      .from('organization_users')
      .update(updates)
      .in('id', userIds)
      .select();

    if (error) throw error;
    return data;
  },

  async deleteUsers(userIds: string[]) {
    if (isDemoMode) {
      demoOrgUsers = demoOrgUsers.filter(u => !userIds.includes(u.id));
      return { success: true };
    }

    const { error } = await supabase
      .from('organization_users')
      .delete()
      .in('id', userIds);

    if (error) throw error;
    return { success: true };
  },

  async getUserAuditLog(userId: string) {
    // In production, this would query an audit log table
    // For demo, return mock data
    return [
      {
        id: 'audit-1',
        timestamp: new Date().toISOString(),
        action: 'user_created',
        details: { userId }
      }
    ];
  },

  // Projets
  async getOrganizationProjects(organizationId: string) {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createProject(projectData: Partial<Project>) {
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProject(id: string, updates: Partial<Project>) {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProject(id: string) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Soumissions
  async getProjectSubmissions(projectId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('project_id', projectId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createSubmission(submissionData: Partial<Submission>) {
    const { data, error } = await supabase
      .from('submissions')
      .insert([submissionData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSubmission(id: string, updates: Partial<Submission>) {
    const { data, error } = await supabase
      .from('submissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async approveSubmission(id: string, approvedBy: string) {
    return this.updateSubmission(id, {
      status: 'approved',
      submitted_by: approvedBy // This might need adjustment based on your schema
    });
  },

  async rejectSubmission(id: string, rejectedBy: string) {
    return this.updateSubmission(id, {
      status: 'rejected',
      submitted_by: rejectedBy // This might need adjustment based on your schema
    });
  },

  async deleteSubmission(id: string) {
    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Household feedback functions
  async getSubmissionByAccessCode(accessCode: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('access_code', accessCode)
      .single();

    if (error) throw error;
    return data;
  },

  async addHouseholdComment(submissionId: string, comment: string) {
    const { data: currentSubmission, error: fetchError } = await supabase
      .from('submissions')
      .select('household_comments')
      .eq('id', submissionId)
      .single();

    if (fetchError) throw fetchError;

    const updatedComments = [...(currentSubmission.household_comments || []), comment];

    const { data, error } = await supabase
      .from('submissions')
      .update({
        household_comments: updatedComments,
        feedback_timestamp: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async validateHouseholdSubmission(submissionId: string, validated: boolean) {
    const { data, error } = await supabase
      .from('submissions')
      .update({
        household_validated: validated,
        feedback_timestamp: new Date().toISOString()
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Bulk operations for submissions
  async generateAccessCodesForSubmissions(submissionIds: string[]) {
    const results = [];

    for (const submissionId of submissionIds) {
      try {
        const { generateAccessCode } = await import('../utils/accessCodeUtils');
        const accessCode = generateAccessCode();

        const { data, error } = await supabase
          .from('submissions')
          .update({ access_code: accessCode })
          .eq('id', submissionId)
          .select()
          .single();

        if (error) throw error;
        results.push({ submissionId, accessCode, success: true });
      } catch (error) {
        results.push({ submissionId, error: error instanceof Error ? error.message : 'Unknown error', success: false });
      }
    }

    return results;
  },

  async getSubmissionsWithoutAccessCodes(projectId: string) {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('project_id', projectId)
      .is('access_code', null)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Audit logging functions
  async getAuditLogs(organizationId: string, filters?: {
    user_id?: string;
    action?: string;
    resource_type?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters?.action) {
      query = query.eq('action', filters.action);
    }
    if (filters?.resource_type) {
      query = query.eq('resource_type', filters.resource_type);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getUserActivityLog(userId: string, organizationId: string) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data;
  },

  async getSecurityEvents(organizationId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .in('action', ['login_attempt_failed', 'login_attempt_success', 'user_created', 'user_deleted', 'role_changed'])
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Data access logging
  async logDataAccess(resourceType: string, resourceId: string, action: string, organizationId: string, userId: string) {
    if (isDemoMode) {
      console.log('Mode démo : log accès données', { resourceType, resourceId, action, organizationId, userId });
      return;
    }

    const { error } = await supabase.rpc('log_audit_action', {
      p_organization_id: organizationId,
      p_user_id: userId,
      p_action: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_details: { timestamp: new Date().toISOString() }
    });

    if (error) throw error;
  }
};
