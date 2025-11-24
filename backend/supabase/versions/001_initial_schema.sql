-- ============================================
-- VERSÃO 1.0.0 - SCHEMA INICIAL
-- Data: 2024-01-XX
-- Descrição: Schema inicial completo do Corrida Certa
-- ============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABELAS DE AUTENTICAÇÃO E TENANT
-- ============================================

-- Tabela de Organizações (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_status VARCHAR(50) DEFAULT 'trial', -- trial, active, past_due, canceled, unpaid
    subscription_plan VARCHAR(50) DEFAULT 'free', -- free, basic, pro, enterprise
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de Membros da Organização (Multi-user support)
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- owner, admin, member
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- ============================================
-- TABELAS DE USUÁRIOS E PERFIS
-- ============================================

-- Perfis de Usuário (extensão do auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    full_name VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    language VARCHAR(10) DEFAULT 'pt-BR',
    current_organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELAS DE VEÍCULOS
-- ============================================

-- Veículos dos usuários
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('moto', 'carro')),
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    ano VARCHAR(10),
    consumo_medio DECIMAL(5,2) NOT NULL, -- km/L
    personalizado BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- TABELAS DE CORRIDAS
-- ============================================

-- Corridas registradas
CREATE TABLE IF NOT EXISTS corridas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    
    -- Dados da corrida
    plataforma VARCHAR(50) NOT NULL, -- uber, 99, ifood, outros
    valor DECIMAL(10,2) NOT NULL,
    distancia DECIMAL(8,2) NOT NULL, -- km
    tempo_estimado INTEGER NOT NULL, -- minutos
    origem TEXT,
    destino TEXT,
    imagem_url TEXT, -- URL da imagem no storage
    
    -- Análise de viabilidade
    custo_combustivel DECIMAL(10,2),
    custo_desgaste DECIMAL(10,2),
    custo_tempo DECIMAL(10,2),
    custo_total DECIMAL(10,2),
    lucro_liquido DECIMAL(10,2),
    margem_lucro DECIMAL(5,2), -- porcentagem
    valor_por_km DECIMAL(8,2),
    valor_por_hora DECIMAL(8,2),
    score DECIMAL(5,2), -- 0-100
    viabilidade VARCHAR(20), -- excelente, boa, razoavel, ruim, pessima
    recomendacao TEXT,
    
    -- Metadados
    data_corrida TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para corridas
CREATE INDEX IF NOT EXISTS idx_corridas_organization ON corridas(organization_id);
CREATE INDEX IF NOT EXISTS idx_corridas_user ON corridas(user_id);
CREATE INDEX IF NOT EXISTS idx_corridas_data ON corridas(data_corrida);
CREATE INDEX IF NOT EXISTS idx_corridas_plataforma ON corridas(plataforma);

-- ============================================
-- TABELAS DE DESPESAS
-- ============================================

-- Tipos de despesas
DO $$ BEGIN
    CREATE TYPE despesa_tipo AS ENUM (
        'combustivel',
        'manutencao',
        'alimentacao',
        'estacionamento',
        'lavagem',
        'seguro',
        'licenciamento',
        'multa',
        'outros'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Despesas registradas
CREATE TABLE IF NOT EXISTS despesas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    
    tipo despesa_tipo NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    
    -- Metadados
    data_despesa TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para despesas
CREATE INDEX IF NOT EXISTS idx_despesas_organization ON despesas(organization_id);
CREATE INDEX IF NOT EXISTS idx_despesas_user ON despesas(user_id);
CREATE INDEX IF NOT EXISTS idx_despesas_tipo ON despesas(tipo);
CREATE INDEX IF NOT EXISTS idx_despesas_data ON despesas(data_despesa);

-- ============================================
-- TABELAS DE TEMPLATES
-- ============================================

-- Templates de despesas
CREATE TABLE IF NOT EXISTS despesa_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    nome VARCHAR(255) NOT NULL,
    tipo despesa_tipo NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    uso_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para templates
CREATE INDEX IF NOT EXISTS idx_templates_organization ON despesa_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_templates_user ON despesa_templates(user_id);

-- ============================================
-- TABELAS DE CONFIGURAÇÕES
-- ============================================

-- Configurações por organização
CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
    
    -- Parâmetros principais
    rs_por_km_minimo DECIMAL(6,2) DEFAULT 1.80,
    rs_por_hora_minimo DECIMAL(6,2) DEFAULT 25.00,
    distancia_maxima DECIMAL(6,2) DEFAULT 10.00,
    tempo_maximo_estimado INTEGER DEFAULT 30,
    media_km_por_litro DECIMAL(5,2) DEFAULT 12.00,
    preco_combustivel DECIMAL(6,2) DEFAULT 6.00,
    perfil_trabalho VARCHAR(20) DEFAULT 'misto', -- giro-rapido, corridas-longas, misto
    
    -- Parâmetros avançados
    distancia_maxima_cliente DECIMAL(5,2) DEFAULT 1.5,
    custo_km DECIMAL(6,2) DEFAULT 0.50,
    custo_hora DECIMAL(6,2) DEFAULT 20.00,
    
    -- Preferências de apps
    preferencias_apps JSONB DEFAULT '{}'::jsonb,
    
    -- Metas
    meta_diaria_lucro DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABELAS DE METAS
-- ============================================

-- Metas e objetivos
CREATE TABLE IF NOT EXISTS metas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    tipo VARCHAR(50) NOT NULL, -- diaria, semanal, mensal, anual
    descricao TEXT NOT NULL,
    valor_meta DECIMAL(10,2),
    valor_atual DECIMAL(10,2) DEFAULT 0,
    data_inicio DATE NOT NULL,
    data_fim DATE,
    concluida BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Índices para metas
CREATE INDEX IF NOT EXISTS idx_metas_organization ON metas(organization_id);
CREATE INDEX IF NOT EXISTS idx_metas_user ON metas(user_id);

-- ============================================
-- TABELAS DE STRIPE (PAGAMENTOS)
-- ============================================

-- Planos de assinatura
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_price_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_yearly DECIMAL(10,2),
    features JSONB DEFAULT '[]'::jsonb,
    max_users INTEGER DEFAULT 1,
    max_corridas_per_month INTEGER,
    max_vehicles INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Histórico de assinaturas
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    plan_id UUID REFERENCES subscription_plans(id),
    status VARCHAR(50) NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Eventos do Stripe (webhooks)
CREATE TABLE IF NOT EXISTS stripe_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para Stripe
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON stripe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_org ON stripe_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON stripe_events(processed);

-- ============================================
-- FUNÇÕES E TRIGGERS
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_corridas_updated_at ON corridas;
CREATE TRIGGER update_corridas_updated_at BEFORE UPDATE ON corridas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_despesas_updated_at ON despesas;
CREATE TRIGGER update_despesas_updated_at BEFORE UPDATE ON despesas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_templates_updated_at ON despesa_templates;
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON despesa_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_settings_updated_at ON organization_settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON organization_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_metas_updated_at ON metas;
CREATE TRIGGER update_metas_updated_at BEFORE UPDATE ON metas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar organização padrão ao criar usuário
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
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger para criar organização ao criar usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_default_organization();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE corridas ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE despesa_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Organizations
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations"
    ON organizations FOR SELECT
    USING (
        id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert their own organizations" ON organizations;
CREATE POLICY "Users can insert their own organizations"
    ON organizations FOR INSERT
    WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;
CREATE POLICY "Users can update their organizations"
    ON organizations FOR UPDATE
    USING (
        owner_id = auth.uid() OR
        id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Políticas RLS para Organization Members
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
CREATE POLICY "Users can view members of their organizations"
    ON organization_members FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert themselves as members" ON organization_members;
CREATE POLICY "Users can insert themselves as members"
    ON organization_members FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Políticas RLS para User Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (id = auth.uid());

-- Políticas RLS para Vehicles
DROP POLICY IF EXISTS "Users can view vehicles in their organizations" ON vehicles;
CREATE POLICY "Users can view vehicles in their organizations"
    ON vehicles FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert vehicles in their organizations" ON vehicles;
CREATE POLICY "Users can insert vehicles in their organizations"
    ON vehicles FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update vehicles in their organizations" ON vehicles;
CREATE POLICY "Users can update vehicles in their organizations"
    ON vehicles FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete vehicles in their organizations" ON vehicles;
CREATE POLICY "Users can delete vehicles in their organizations"
    ON vehicles FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Políticas RLS para Corridas
DROP POLICY IF EXISTS "Users can view corridas in their organizations" ON corridas;
CREATE POLICY "Users can view corridas in their organizations"
    ON corridas FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert corridas in their organizations" ON corridas;
CREATE POLICY "Users can insert corridas in their organizations"
    ON corridas FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update corridas in their organizations" ON corridas;
CREATE POLICY "Users can update corridas in their organizations"
    ON corridas FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete corridas in their organizations" ON corridas;
CREATE POLICY "Users can delete corridas in their organizations"
    ON corridas FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Políticas RLS para Despesas
DROP POLICY IF EXISTS "Users can view despesas in their organizations" ON despesas;
CREATE POLICY "Users can view despesas in their organizations"
    ON despesas FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert despesas in their organizations" ON despesas;
CREATE POLICY "Users can insert despesas in their organizations"
    ON despesas FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update despesas in their organizations" ON despesas;
CREATE POLICY "Users can update despesas in their organizations"
    ON despesas FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete despesas in their organizations" ON despesas;
CREATE POLICY "Users can delete despesas in their organizations"
    ON despesas FOR DELETE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Políticas RLS para Templates
DROP POLICY IF EXISTS "Users can view templates in their organizations" ON despesa_templates;
CREATE POLICY "Users can view templates in their organizations"
    ON despesa_templates FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage templates in their organizations" ON despesa_templates;
CREATE POLICY "Users can manage templates in their organizations"
    ON despesa_templates FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Políticas RLS para Settings
DROP POLICY IF EXISTS "Users can view settings of their organizations" ON organization_settings;
CREATE POLICY "Users can view settings of their organizations"
    ON organization_settings FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert settings for their organizations" ON organization_settings;
CREATE POLICY "Users can insert settings for their organizations"
    ON organization_settings FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT id FROM organizations
            WHERE owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update settings of their organizations" ON organization_settings;
CREATE POLICY "Users can update settings of their organizations"
    ON organization_settings FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Políticas RLS para Metas
DROP POLICY IF EXISTS "Users can manage metas in their organizations" ON metas;
CREATE POLICY "Users can manage metas in their organizations"
    ON metas FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View de estatísticas de corridas
CREATE OR REPLACE VIEW corridas_stats AS
SELECT
    organization_id,
    user_id,
    COUNT(*) as total_corridas,
    SUM(valor) as total_receitas,
    SUM(lucro_liquido) as total_lucro,
    AVG(valor) as valor_medio,
    SUM(distancia) as total_km,
    AVG(margem_lucro) as margem_media
FROM corridas
WHERE deleted_at IS NULL
GROUP BY organization_id, user_id;

-- View de estatísticas de despesas
CREATE OR REPLACE VIEW despesas_stats AS
SELECT
    organization_id,
    user_id,
    tipo,
    COUNT(*) as total_despesas,
    SUM(valor) as total_valor
FROM despesas
WHERE deleted_at IS NULL
GROUP BY organization_id, user_id, tipo;

-- ============================================
-- ÍNDICES ADICIONAIS
-- ============================================

-- Índices compostos para melhor performance
CREATE INDEX IF NOT EXISTS idx_corridas_org_user_date ON corridas(organization_id, user_id, data_corrida DESC);
CREATE INDEX IF NOT EXISTS idx_despesas_org_user_date ON despesas(organization_id, user_id, data_despesa DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_org_user ON vehicles(organization_id, user_id, is_active);

-- ============================================
-- TABELA DE CONTROLE DE VERSÕES
-- ============================================

-- Tabela para rastrear versões do schema aplicadas
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Registrar versão inicial
INSERT INTO schema_migrations (version, description)
VALUES ('1.0.0', 'Schema inicial completo do Corrida Certa')
ON CONFLICT (version) DO NOTHING;

