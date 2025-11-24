# 🔧 Aplicar Correção Completa de RLS - Recursão Infinita

## ⚠️ Problemas Identificados

### 1. Recursão Infinita em RLS - Organizations
O erro `infinite recursion detected in policy for relation "organizations"` (código 42P17) ocorre porque:
- A política de SELECT em `organizations` verifica `organization_members`
- Mas para verificar `organization_members`, precisa ver `organizations`
- Isso cria um loop infinito de dependências

### 2. Recursão Infinita em RLS - Organization Members
O erro `infinite recursion detected in policy for relation "organization_members"` (código 42P17) ocorre porque:
- A política de SELECT em `organization_members` verifica a própria tabela
- Isso causa recursão infinita ao tentar verificar se o usuário é membro

### 3. Perfil Não Encontrado
O erro `PGRST116 - Cannot coerce the result to a single JSON object` ocorre quando o perfil do usuário ainda não foi criado no banco de dados. Isso pode acontecer se o trigger do Supabase ainda não executou ou falhou.

## ✅ Solução

Execute a migration `004_fix_rls_recursion_final.sql` no Supabase para corrigir definitivamente as políticas RLS.

**IMPORTANTE:** Esta é a versão mais recente e corrige o problema de recursão de forma definitiva.

## 📝 Como Aplicar

### 1. Acesse o Supabase Dashboard

1. Vá para: https://supabase.com/dashboard/project/wlfmhygheizuuyohcbyj
2. Clique em **SQL Editor** no menu lateral

### 2. Execute a Migration Mais Recente

1. Abra o arquivo: `backend/supabase/versions/004_fix_rls_recursion_final.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

**Nota:** Se você já executou a migration 003, pode executar a 004 diretamente - ela substitui as políticas anteriores.

### 3. Verificar se Funcionou

Execute esta query para verificar se a política foi criada:

```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'organization_members'
ORDER BY policyname;
```

Você deve ver as políticas:
- `Users can view members of their organizations`
- `Users can insert themselves as members`

## 🔍 O que a Correção Faz

### Correção Definitiva de RLS (Migration 004)

#### 1. Políticas de Organizations - SELECT (Correção Principal)
- **ANTES (problemático)**: Verificava apenas através de `organization_members`, causando recursão
- **AGORA (corrigido)**: 
  - Primeiro verifica se é `owner` através de `owner_id = auth.uid()` (verificação direta, SEM recursão)
  - Depois verifica se é membro através de `organization_members` (só se não for owner)
  - Isso evita recursão porque a verificação de owner não depende de outras tabelas

#### 2. Políticas de Organizations - INSERT
- Permite criar organizações onde `owner_id = auth.uid()`
- Verificação direta, sem dependências circulares

#### 3. Políticas de Organizations - UPDATE
- Permite atualizar se é owner (verificação direta) OU admin/owner membro

#### 4. Políticas de Organization Members - INSERT
- Permite inserir membros se:
  - É o próprio usuário (`user_id = auth.uid()`)
  - E é owner da organização (verificação direta em `organizations.owner_id`, sem recursão)

#### 5. Função create_default_organization
- Garantida com `SECURITY DEFINER` para contornar RLS ao criar organização inicial
- Trigger recriado para garantir funcionamento
- Esta função é executada automaticamente quando um novo usuário é criado no Supabase Auth

### Correção de Perfil Não Encontrado (Backend)

1. **Melhora o tratamento de erro** no endpoint `/api/auth/me`
2. **Retorna null** quando o perfil não existe (PGRST116) em vez de falhar
3. **Permite que o app continue funcionando** mesmo se o perfil ainda não foi criado

### Melhorias no Código de Criação de Organização (OnboardingScreen.js)

1. **Verificação prévia**: Antes de criar, verifica se a organização já existe
2. **Tratamento de erro de recursão**: Se detectar erro 42P17, aguarda 2 segundos e tenta buscar novamente (o trigger pode ter criado)
3. **Evita criação duplicada**: Verifica organização existente antes de tentar criar
4. **Logs melhorados**: Logs mais detalhados para facilitar debug
5. **Tratamento de perfil**: Se o perfil não existe mas a organização sim, cria apenas o perfil

## ✅ Após Aplicar

1. **Execute a migration** no Supabase (veja instruções acima)
2. **Reinicie o backend** para aplicar as mudanças no código
3. **Reinicie o app mobile**
4. **Tente fazer login novamente**
5. Os erros de recursão e perfil não encontrado não devem mais aparecer

### Verificar se Funcionou

Teste criando uma nova organização através do app. O erro de recursão não deve mais aparecer.

## 🐛 Se Ainda Der Erro

Se ainda houver problemas:

1. Verifique se a migration foi aplicada corretamente
2. Verifique os logs do Supabase para ver erros específicos
3. Tente desabilitar temporariamente o RLS para testar:
   ```sql
   ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;
   ```
   (⚠️ Apenas para teste! Reative depois)

---

**Arquivo da Migration:** `backend/supabase/versions/004_fix_rls_recursion_final.sql`  
**Versão:** 4.0.0  
**Data:** 2024-01-XX

**Arquivos Modificados:**
- `backend/supabase/versions/004_fix_rls_recursion_final.sql` (nova migração)
- `mobile-app/screens/OnboardingScreen.js` (melhorias no tratamento de criação de organização)

