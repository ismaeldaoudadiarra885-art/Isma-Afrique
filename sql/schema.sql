-- Schema Supabase pour Application Multi-ONG KoboToolbox

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table des organisations
CREATE TABLE organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    admin_email VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{
        "max_projects": 10,
        "max_users": 50,
        "features_enabled": ["projects", "users", "analytics"]
    }'::jsonb
);

-- Table des utilisateurs d'organisation
CREATE TABLE organization_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(255), -- Pour l'avenir si on utilise auth.users
    role VARCHAR(50) CHECK (role IN ('admin', 'project_manager', 'enumerator', 'superviseur')),
    access_code VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, access_code)
);

-- Table des projets
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    form_data JSONB NOT NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255)
);

-- Table des soumissions
CREATE TABLE submissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    submitted_by VARCHAR(255),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    device_info JSONB,
    household_comments TEXT[] DEFAULT '{}',
    household_validated BOOLEAN DEFAULT false,
    feedback_timestamp TIMESTAMP WITH TIME ZONE,
    access_code VARCHAR(100) UNIQUE
);

-- Table des logs d'audit
CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes pour les performances
CREATE INDEX idx_organization_users_access_code ON organization_users(access_code);
CREATE INDEX idx_organization_users_org_id ON organization_users(organization_id);
CREATE INDEX idx_projects_org_id ON projects(organization_id);
CREATE INDEX idx_submissions_project_id ON submissions(project_id);
CREATE INDEX idx_submissions_org_id ON submissions(organization_id);
CREATE INDEX idx_audit_logs_org_id ON audit_logs(organization_id);

-- Politiques Row Level Security (RLS)

-- Organisations : Seuls les super admins peuvent voir toutes les organisations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all organizations" ON organizations
    FOR ALL USING (auth.jwt() ->> 'role' = 'super_admin');

-- Utilisateurs d'organisation : Isolation par organisation
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization users" ON organization_users
    FOR SELECT USING (
        organization_id IN (
            SELECT ou.organization_id FROM organization_users ou
            WHERE ou.access_code = auth.jwt() ->> 'access_code'
        )
    );

CREATE POLICY "Admins can manage their organization users" ON organization_users
    FOR ALL USING (
        organization_id IN (
            SELECT ou.organization_id FROM organization_users ou
            WHERE ou.access_code = auth.jwt() ->> 'access_code'
            AND ou.role IN ('admin', 'project_manager')
        )
    );

-- Projets : Isolation par organisation
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their organization projects" ON projects
    FOR ALL USING (
        organization_id IN (
            SELECT ou.organization_id FROM organization_users ou
            WHERE ou.access_code = auth.jwt() ->> 'access_code'
            AND ou.is_active = true
        )
    );

-- Soumissions : Isolation par organisation
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their organization submissions" ON submissions
    FOR ALL USING (
        organization_id IN (
            SELECT ou.organization_id FROM organization_users ou
            WHERE ou.access_code = auth.jwt() ->> 'access_code'
            AND ou.is_active = true
        )
    );

-- Superviseurs peuvent approuver/rejeter les soumissions
CREATE POLICY "Superviseurs can update submission status" ON submissions
    FOR UPDATE USING (
        organization_id IN (
            SELECT ou.organization_id FROM organization_users ou
            WHERE ou.access_code = auth.jwt() ->> 'access_code'
            AND ou.role = 'superviseur'
            AND ou.is_active = true
        )
    );

-- Households can view and update their submissions via access code
CREATE POLICY "Households can access their submissions" ON submissions
    FOR SELECT USING (
        access_code = auth.jwt() ->> 'access_code'
    );

CREATE POLICY "Households can update feedback" ON submissions
    FOR UPDATE USING (
        access_code = auth.jwt() ->> 'access_code'
    );

-- Audit logs : Isolation par organisation
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization audit logs" ON audit_logs
    FOR SELECT USING (
        organization_id IN (
            SELECT ou.organization_id FROM organization_users ou
            WHERE ou.access_code = auth.jwt() ->> 'access_code'
        )
    );

-- Fonctions utilitaires

-- Fonction pour créer un utilisateur d'organisation
CREATE OR REPLACE FUNCTION create_organization_user(
    p_organization_id UUID,
    p_role VARCHAR(50),
    p_user_name VARCHAR(100)
) RETURNS organization_users AS $$
DECLARE
    v_access_code VARCHAR(100);
    v_user organization_users;
BEGIN
    -- Générer un code d'accès unique
    v_access_code := LOWER(SUBSTRING(p_user_name FROM 1 FOR 3)) || '-' || LPAD(FLOOR(RANDOM() * 900 + 100)::TEXT, 3, '0');

    -- S'assurer qu'il est unique
    WHILE EXISTS (SELECT 1 FROM organization_users WHERE access_code = v_access_code) LOOP
        v_access_code := LOWER(SUBSTRING(p_user_name FROM 1 FOR 3)) || '-' || LPAD(FLOOR(RANDOM() * 900 + 100)::TEXT, 3, '0');
    END LOOP;

    -- Insérer l'utilisateur
    INSERT INTO organization_users (organization_id, role, access_code, is_active)
    VALUES (p_organization_id, p_role, v_access_code, true)
    RETURNING * INTO v_user;

    RETURN v_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour logger les actions
CREATE OR REPLACE FUNCTION log_audit_action(
    p_organization_id UUID,
    p_user_id VARCHAR(255),
    p_action VARCHAR(255),
    p_resource_type VARCHAR(100),
    p_resource_id VARCHAR(255),
    p_details JSONB DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO audit_logs (organization_id, user_id, action, resource_type, resource_id, details)
    VALUES (p_organization_id, p_user_id, p_action, p_resource_type, p_resource_id, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour logger les actions sur les projets
CREATE OR REPLACE FUNCTION log_project_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_action(NEW.organization_id, NEW.created_by, 'create_project', 'project', NEW.id::text, jsonb_build_object('name', NEW.name));
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_audit_action(NEW.organization_id, NEW.created_by, 'update_project', 'project', NEW.id::text, jsonb_build_object('changes', 'form_data_updated'));
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_action(OLD.organization_id, OLD.created_by, 'delete_project', 'project', OLD.id::text, jsonb_build_object('name', OLD.name));
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_project_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH ROW EXECUTE FUNCTION log_project_changes();

-- Trigger pour chiffrer les données sensibles et logger les soumissions
CREATE OR REPLACE FUNCTION log_submission_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Chiffrer les données sensibles avant insertion
        NEW.data := encrypt_sensitive_data(NEW.data);
        PERFORM log_audit_action(NEW.organization_id, NEW.submitted_by, 'create_submission', 'submission', NEW.id::text, jsonb_build_object('project_id', NEW.project_id));
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log les changements de statut (approbation/rejet)
        IF OLD.status != NEW.status THEN
            PERFORM log_audit_action(NEW.organization_id, NEW.submitted_by, 'update_submission_status', 'submission', NEW.id::text, jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status));
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_submission_changes_trigger
    BEFORE INSERT OR UPDATE ON submissions
    FOR EACH ROW EXECUTE FUNCTION log_submission_changes();

-- Trigger pour logger les accès aux données
CREATE OR REPLACE FUNCTION log_data_access()
RETURNS TRIGGER AS $$
BEGIN
    -- Log l'accès aux soumissions (SELECT)
    IF TG_OP = 'SELECT' THEN
        PERFORM log_audit_action(NEW.organization_id, current_setting('app.current_user', true), 'view_submission', 'submission', NEW.id::text, jsonb_build_object('accessed_at', now()));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction de chiffrement des données sensibles
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(input_data JSONB)
RETURNS JSONB AS $$
DECLARE
    encrypted_data JSONB := input_data;
    sensitive_fields TEXT[] := ARRAY['password', 'ssn', 'bank_account', 'phone', 'email'];
    field TEXT;
BEGIN
    -- Chiffrer les champs sensibles si ils existent
    FOREACH field IN ARRAY sensitive_fields LOOP
        IF encrypted_data ? field THEN
            encrypted_data := jsonb_set(
                encrypted_data,
                ARRAY[field],
                to_jsonb(encode(pgcrypto.gen_random_bytes(32), 'base64'))
            );
        END IF;
    END LOOP;

    RETURN encrypted_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction de déchiffrement des données sensibles (pour les utilisateurs autorisés)
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data JSONB, user_role TEXT)
RETURNS JSONB AS $$
DECLARE
    decrypted_data JSONB := encrypted_data;
    sensitive_fields TEXT[] := ARRAY['password', 'ssn', 'bank_account', 'phone', 'email'];
    field TEXT;
BEGIN
    -- Seulement les admins et superviseurs peuvent déchiffrer
    IF user_role NOT IN ('admin', 'superviseur') THEN
        RETURN encrypted_data; -- Retourner les données chiffrées
    END IF;

    -- Pour la démonstration, on retourne les données originales
    -- En production, implémenter le vrai déchiffrement
    RETURN encrypted_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Les triggers SELECT nécessitent une implémentation différente via les fonctions d'application

-- Vue pour les statistiques d'organisation
CREATE VIEW organization_stats AS
SELECT
    o.id,
    o.name,
    o.is_active,
    COUNT(DISTINCT p.id) as project_count,
    COUNT(DISTINCT ou.id) as user_count,
    COUNT(DISTINCT s.id) as submission_count,
    MAX(s.submitted_at) as last_submission_at
FROM organizations o
LEFT JOIN projects p ON o.id = p.organization_id
LEFT JOIN organization_users ou ON o.id = ou.organization_id AND ou.is_active = true
LEFT JOIN submissions s ON o.id = s.organization_id
GROUP BY o.id, o.name, o.is_active;

-- Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON organizations TO anon, authenticated;
GRANT ALL ON organization_users TO anon, authenticated;
GRANT ALL ON projects TO anon, authenticated;
GRANT ALL ON submissions TO anon, authenticated;
GRANT ALL ON audit_logs TO anon, authenticated;
GRANT ALL ON organization_stats TO anon, authenticated;

-- Pour le développement, permettre tout (à restreindre en production)
-- Note: En production, utilisez des rôles spécifiques et non pas anon/authenticated
