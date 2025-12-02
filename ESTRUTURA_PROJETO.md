# 📁 Estrutura do Projeto Corrida Certa

## 🎯 Organização

O projeto foi reorganizado para melhor organização:

### 📚 Documentação (`docs/`)
Toda a documentação e tutoriais estão organizados em:
```
docs/
├── README.md                    # Índice geral da documentação
├── CONFIGURACAO_COMPLETA.md     # Configuração completa do projeto
├── mobile-app/                  # Documentação do app mobile
│   ├── README.md
│   ├── AUTH_SETUP.md
│   ├── CONFIGURACAO_SUPABASE.md
│   └── ... (todos os .md do mobile-app)
└── backend/                     # Documentação do backend
    ├── README.md
    ├── API_DOCUMENTATION.md
    ├── CONFIGURAR_ENV.md
    ├── STRIPE_SETUP.md
    ├── SUPABASE_SETUP.md
    └── supabase/                 # Documentação específica do Supabase
        ├── QUICK_START.md
        ├── MIGRATION_GUIDE.md
        └── ...
```

### 🗄️ SQL (`backend/supabase/`)
Todos os arquivos SQL estão organizados em:
```
backend/supabase/
├── README.md                    # Documentação dos arquivos SQL
├── schema.sql                   # Schema completo consolidado
├── verify_schema.sql           # Script de verificação
└── versions/                    # Migrações versionadas
    ├── 001_initial_schema.sql
    ├── 002_fix_rls_policies.sql
    ├── 003_fix_rls_recursion.sql
    ├── 004_fix_rls_recursion_final.sql
    └── 005_fix_rls_recursion_definitive.sql
```

### 💻 Código
O código permanece nas pastas originais:
```
mobile-app/                      # Aplicativo React Native
├── components/
├── screens/
├── services/
├── contexts/
└── ...

backend/                         # Backend Node.js/TypeScript
├── src/
│   ├── routes/
│   ├── middleware/
│   └── index.ts
└── supabase/                   # Arquivos SQL (não documentação)
```

## 📋 Resumo

- ✅ **Documentação**: Toda em `docs/`
- ✅ **SQL**: Tudo em `backend/supabase/`
- ✅ **Código**: Permanece nas pastas originais
- ✅ **README.md**: Mantidos nas pastas principais (mobile-app, backend)

## 🔍 Como Encontrar

- **Documentação**: Veja `docs/README.md` para índice completo
- **SQL**: Veja `backend/supabase/README.md` para guia dos arquivos SQL
- **Código**: Permanece nas pastas `mobile-app/` e `backend/src/`

