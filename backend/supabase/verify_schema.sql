-- ============================================
-- SCRIPT DE VERIFICAÇÃO DO SCHEMA
-- Execute este script para verificar se o schema está completo
-- ============================================

-- 1. Verificar versão atual
SELECT 
    'Versão Atual' as check_type,
    version,
    description,
    applied_at
FROM schema_migrations 
ORDER BY applied_at DESC 
LIMIT 1;

-- 2. Verificar tabelas principais
SELECT 
    'Tabelas Criadas' as check_type,
    COUNT(*) as total,
    string_agg(table_name, ', ' ORDER BY table_name) as tabelas
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';

-- 3. Verificar extensões
SELECT 
    'Extensões' as check_type,
    extname as extensao,
    extversion as versao
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- 4. Verificar políticas RLS
SELECT 
    'Políticas RLS' as check_type,
    tablename,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 5. Verificar triggers
SELECT 
    'Triggers' as check_type,
    tgname as trigger_name,
    tgrelid::regclass as tabela
FROM pg_trigger
WHERE tgname LIKE 'update_%_updated_at'
ORDER BY tgname;

-- 6. Verificar índices
SELECT 
    'Índices' as check_type,
    COUNT(*) as total_indices
FROM pg_indexes
WHERE schemaname = 'public';

-- 7. Verificar views
SELECT 
    'Views' as check_type,
    table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- 8. Verificar funções
SELECT 
    'Funções' as check_type,
    routine_name as funcao,
    routine_type as tipo
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('update_updated_at_column', 'create_default_organization')
ORDER BY routine_name;

-- 9. Verificar tipos ENUM
SELECT 
    'Tipos ENUM' as check_type,
    t.typname as tipo,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as valores
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'despesa_tipo'
GROUP BY t.typname;

-- 10. Resumo final
SELECT 
    'RESUMO' as check_type,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as total_tabelas,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as total_indices,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'public') as total_views,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') as total_funcoes;


