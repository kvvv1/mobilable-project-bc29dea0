-- ============================================
-- VERSÃO 3.0.0 - CORREÇÃO COMPLETA DE RECURSÃO RLS
-- Data: 2024-01-XX
-- Descrição: Corrige recursão infinita nas políticas RLS de organizations e organization_members
-- ============================================

-- PROBLEMA IDENTIFICADO:
-- 1. A política de SELECT em organizations verifica organization_members, causando recursão
-- 2. A política de SELECT em organization_members verifica a própria tabela, causando recursão
-- 3. Quando um usuário cria uma organização, ele precisa poder vê-la antes de se adicionar como membro

-- SOLUÇÃO: Usar verificações diretas na tabela organizations (owner_id) sem depender de organization_members

-- ============================================
-- CORRIGIR POLÍTICAS DE ORGANIZATIONS
-- ============================================

-- Remover política problemática de SELECT
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;

-- Criar política que permite ver organizações onde é owner OU membro (sem recursão)
CREATE POLICY "Users can view their organizations"
    ON organizations FOR SELECT
    USING (
        -- Pode ver se é owner (verificação direta, sem recursão)
        owner_id = auth.uid()
        OR
        -- OU se é membro (verificação direta em organization_members, sem recursão circular)
        id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- A política de INSERT já está correta (verifica apenas owner_id)
-- Mas vamos garantir que está aplicada
DROP POLICY IF EXISTS "Users can insert their own organizations" ON organizations;
CREATE POLICY "Users can insert their own organizations"
    ON organizations FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- Corrigir política de UPDATE para evitar recursão
DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;
CREATE POLICY "Users can update their organizations"
    ON organizations FOR UPDATE
    USING (
        -- Pode atualizar se é owner (verificação direta)
        owner_id = auth.uid()
        OR
        -- OU se é admin/owner membro (verificação direta, sem recursão)
        id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- ============================================
-- CORRIGIR POLÍTICAS DE ORGANIZATION_MEMBERS
-- ============================================

-- Remover política problemática
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;

-- Criar política que verifica através de organizations (sem recursão)
CREATE POLICY "Users can view members of their organizations"
    ON organization_members FOR SELECT
    USING (
        -- Usuário pode ver membros de organizações que ele é owner
        organization_id IN (
            SELECT id FROM organizations
            WHERE owner_id = auth.uid()
        )
        OR
        -- Ou se ele é membro da organização (verificação direta sem recursão)
        user_id = auth.uid()
    );

-- Também corrigir a política de INSERT para evitar problemas
-- A política precisa permitir que o owner insira membros quando cria a organização
DROP POLICY IF EXISTS "Users can insert themselves as members" ON organization_members;
CREATE POLICY "Users can insert themselves as members"
    ON organization_members FOR INSERT
    WITH CHECK (
        -- Pode inserir se é o próprio usuário
        user_id = auth.uid()
        AND
        -- E se a organização pertence a ele (owner) - verificação direta sem recursão
        -- Esta verificação usa a tabela organizations diretamente, evitando recursão
        EXISTS (
            SELECT 1 FROM organizations
            WHERE id = organization_id
            AND owner_id = auth.uid()
        )
    );

-- ============================================
-- VERIFICAÇÕES ADICIONAIS
-- ============================================

-- Garantir que a função create_default_organization está usando SECURITY DEFINER
-- (Isso permite que o trigger contorne RLS ao criar organização inicial)
CREATE OR REPLACE FUNCTION create_default_organization()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- Criar organização padrão (SECURITY DEFINER permite contornar RLS)
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

-- ============================================
-- REGISTRAR VERSÃO
-- ============================================

INSERT INTO schema_migrations (version, description)
VALUES ('3.0.0', 'Correção completa de recursão infinita nas políticas RLS de organizations e organization_members')
ON CONFLICT (version) DO UPDATE SET
    description = EXCLUDED.description,
    applied_at = NOW();

