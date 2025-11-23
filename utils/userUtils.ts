import { OrganizationUser } from '../services/supabaseClient';

// Validation functions
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const validateUserName = (name: string): boolean => {
    return name.trim().length >= 2 && name.trim().length <= 100;
};

export const generateAccessCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

export const generateSecurePassword = (): string => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';

    let password = '';
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));

    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Role permissions
export const getRolePermissions = (role: string) => {
    const permissions = {
        enumerator: ['view_forms', 'submit_data', 'view_own_submissions'],
        project_manager: ['enumerator', 'manage_users', 'view_all_submissions', 'edit_forms', 'export_data'],
        admin: ['project_manager', 'manage_organization', 'manage_projects', 'system_settings'],
        super_admin: ['admin', 'manage_all_organizations', 'system_admin']
    };

    return permissions[role as keyof typeof permissions] || [];
};

// Search and filter utilities
export const searchUsers = (users: OrganizationUser[], query: string): OrganizationUser[] => {
    if (!query.trim()) return users;

    const searchTerm = query.toLowerCase();
    return users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.role?.toLowerCase().includes(searchTerm) ||
        user.access_code?.toLowerCase().includes(searchTerm)
    );
};

export const filterUsersByRole = (users: OrganizationUser[], role: string): OrganizationUser[] => {
    if (!role || role === 'all') return users;
    return users.filter(user => user.role === role);
};

export const filterUsersByStatus = (users: OrganizationUser[], status: 'all' | 'active' | 'inactive'): OrganizationUser[] => {
    if (status === 'all') return users;
    return users.filter(user => user.is_active === (status === 'active'));
};

// Bulk operations
export const bulkUpdateUserStatus = (users: OrganizationUser[], userIds: string[], isActive: boolean): OrganizationUser[] => {
    return users.map(user =>
        userIds.includes(user.id) ? { ...user, is_active: isActive } : user
    );
};

export const bulkUpdateUserRole = (users: OrganizationUser[], userIds: string[], newRole: string): OrganizationUser[] => {
    return users.map(user =>
        userIds.includes(user.id) ? { ...user, role: newRole as any } : user
    );
};

// Email notifications (mock for demo)
export const sendWelcomeEmail = async (user: OrganizationUser, accessCode: string): Promise<void> => {
    // In production, this would call an email service
    console.log(`📧 Email envoyé à ${user.email}:`);
    console.log(`   Sujet: Bienvenue dans l'organisation`);
    console.log(`   Message: Bonjour ${user.name},`);
    console.log(`           Votre code d'accès est: ${accessCode}`);
    console.log(`           Rôle: ${user.role}`);
    console.log(`           Connectez-vous à l'application avec ce code.`);

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1000));
};

export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<void> => {
    console.log(`📧 Email de réinitialisation envoyé à ${email}`);
    console.log(`   Token: ${resetToken}`);

    await new Promise(resolve => setTimeout(resolve, 1000));
};

// Audit logging
export const createAuditEntry = (action: string, details: any, actorId?: string) => {
    return {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        actor: actorId || 'admin',
        action,
        details
    };
};

// Statistics
export const getUserStats = (users: OrganizationUser[]) => {
    const total = users.length;
    const active = users.filter(u => u.is_active).length;
    const inactive = total - active;

    const roleStats = users.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return {
        total,
        active,
        inactive,
        roleStats
    };
};
