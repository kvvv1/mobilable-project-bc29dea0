-- ============================================
-- VERSÃO 4.0.0 - CORREÇÃO DEFINITIVA DE RECURSÃO RLS
-- Data: 2024-01-XX
-- Descrição: Corrige recursão infinita nas políticas RLS de organizations de forma definitiva
-- ============================================

-- PROBLEMA IDENTIFICADO:
-- A política de SELECT em organizations verifica apenas através de organization_members,
-- mas quando um usuário cria uma organização, ele ainda não é membro (o INSERT em organization_members
-- acontece depois), causando recursão quando tenta verificar se pode ver a organização que acabou de criar.

-- SOLUÇÃO: Permitir que o owner veja a organização diretamente através de owner_id,
-- sem depender de organization_members. Isso evita recursão circular.

-- ============================================
-- CORRIGIR POLÍTICA DE SELECT EM ORGANIZATIONS
-- ============================================

-- Remover política problemática que causa recursão
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;

-- Criar política que permite ver organizações onde é owner OU membro (sem recursão)
-- IMPORTANTE: Verificar owner_id PRIMEIRO (sem SELECT recursivo), depois verificar membros
CREATE POLICY "Users can view their organizations"
    ON organizations FOR SELECT
    USING (
        -- Pode ver se é owner (verificação direta na coluna, SEM recursão)
        owner_id = auth.uid()
        OR
        -- OU se é membro (verificação direta em organization_members, sem recursão circular)
        -- Esta verificação só acontece se não for owner, evitando loop
        id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- GARANTIR QUE A POLÍTICA DE INSERT ESTÁ CORRETA
-- ============================================

-- A política de INSERT já deve estar correta, mas vamos garantir
DROP POLICY IF EXISTS "Users can insert their own organizations" ON organizations;
CREATE POLICY "Users can insert their own organizations"
    ON organizations FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- ============================================
-- CORRIGIR POLÍTICA DE UPDATE EM ORGANIZATIONS
-- ============================================

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
-- CORRIGIR POLÍTICA DE INSERT EM ORGANIZATION_MEMBERS
-- ============================================

-- A política precisa permitir que o owner insira membros quando cria a organização
DROP POLICY IF EXISTS "Users can insert themselves as members" ON organization_members;
CREATE POLICY "Users can insert themselves as members"
    ON organization_members FOR INSERT
    WITH CHECK (
        -- Pode inserir se é o próprio usuário
        user_id = auth.uid()
        AND
        -- E se a organização pertence a ele (owner) - verificação direta sem recursão
        -- Esta verificação usa a tabela organizations diretamente através de owner_id
        EXISTS (
            SELECT 1 FROM organizations
            WHERE id = organization_id
            AND owner_id = auth.uid()
        )
    );

-- ============================================
-- GARANTIR QUE A FUNÇÃO create_default_organization USA SECURITY DEFINER
-- ============================================

-- SECURITY DEFINER permite que o trigger contorne RLS ao criar organização inicial
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
VALUES ('4.0.0', 'Correção definitiva de recursão infinita nas políticas RLS de organizations')
ON CONFLICT (version) DO UPDATE SET
    description = EXCLUDED.description,
    applied_at = NOW();

