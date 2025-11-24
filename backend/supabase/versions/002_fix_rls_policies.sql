-- ============================================
-- VERSÃO 2.0.1 - CORREÇÃO DE POLÍTICAS RLS
-- Data: 2024-01-XX
-- Descrição: Adiciona políticas RLS faltantes para permitir criação de usuários
-- ============================================

-- Adicionar política RLS para INSERT em organizations
DROP POLICY IF EXISTS "Users can insert their own organizations" ON organizations;
CREATE POLICY "Users can insert their own organizations"
    ON organizations FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- Adicionar política RLS para INSERT em organization_members
DROP POLICY IF EXISTS "Users can insert themselves as members" ON organization_members;
CREATE POLICY "Users can insert themselves as members"
    ON organization_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Adicionar política RLS para INSERT em user_profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (id = auth.uid());

-- Adicionar política RLS para INSERT em organization_settings
DROP POLICY IF EXISTS "Users can insert settings for their organizations" ON organization_settings;
CREATE POLICY "Users can insert settings for their organizations"
    ON organization_settings FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT id FROM organizations
            WHERE owner_id = auth.uid()
        )
    );

-- Verificar se a função create_default_organization existe e está correta
-- Se não existir, recriar
CREATE OR REPLACE FUNCTION create_default_organization()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    user_email TEXT;
BEGIN
    -- Criar organização padrão
    INSERT INTO organizations (name, slug, owner_id, subscription_status, subscription_plan)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Minha Organização'),
        'org-' || substr(md5(random()::text), 1, 12),
        NEW.id,
        'trial',
        'free'
    )
    RETURNING id INTO new_org_id;
    
    -- Criar perfil de usuário
    INSERT INTO user_profiles (id, email, full_name, current_organization_id)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
        new_org_id
    )
    ON CONFLICT (id) DO UPDATE SET
        email = NEW.email,
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', user_profiles.full_name);
    
    -- Adicionar como membro
    INSERT INTO organization_members (organization_id, user_id, role, joined_at)
    VALUES (new_org_id, NEW.id, 'owner', NOW())
    ON CONFLICT (organization_id, user_id) DO NOTHING;
    
    -- Criar configurações padrão
    INSERT INTO organization_settings (organization_id)
    VALUES (new_org_id)
    ON CONFLICT (organization_id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro mas não falha o registro do usuário
        RAISE WARNING 'Erro ao criar organização padrão para usuário %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_default_organization();

-- Registrar versão
INSERT INTO schema_migrations (version, description)
VALUES ('2.0.1', 'Correção de políticas RLS para criação de usuários')
ON CONFLICT (version) DO UPDATE SET
    description = EXCLUDED.description,
    applied_at = NOW();


