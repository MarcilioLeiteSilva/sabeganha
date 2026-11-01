# SabeGanha — Backend API & Admin Dashboard (VPS / EasyPanel)

Repositório oficial dos serviços de servidor do **SabeGanha** (*Aprenda. Jogue. Conquiste.*) desenhados para deploy containerizado via **EasyPanel**.

---

## 📁 Estrutura do Repositório

```
.
├── sabeganha_backend/     # NestJS 10 Core API + Prisma ORM 5.22 + Ledger de Dupla Entrada
│   ├── Dockerfile         # Multi-stage build para produção (Porta 3000)
│   ├── prisma/            # Schema PostgreSQL e script de Seed
│   └── src/               # Módulos de Wallet, Quizzes, Sessions, Rewards e Antifraude
│
└── sabeganha_admin/       # Next.js 14 Dashboard Administrativo (Porta 3001)
    ├── Dockerfile         # Imagem otimizada Next.js Standalone
    └── src/               # Painel operacional com métricas e auditoria
```

---

## 🚀 Como Fazer o Deploy no EasyPanel (Hostinger VPS)

### 1. Serviço de Banco de Dados (PostgreSQL)
* No EasyPanel, crie um serviço de **Database -> PostgreSQL**.
* Nome do banco: `sabeganha_db`.
* Guarde as credenciais para compor a variável `DATABASE_URL`.

### 2. Serviço de Cache (Redis)
* No EasyPanel, crie um serviço de **Database -> Redis**.
* Configure uma senha segura e guarde o host e porta interna.

### 3. Serviço da API (`sabeganha_backend`)
* Crie um **App Service** conectado a este repositório no GitHub.
* **Build Type:** Dockerfile.
* **Root Directory:** `/sabeganha_backend`.
* **Porta Interna:** `3000`.
* **Domínio:** `api.sabeganha.com.br` (com SSL automático via Let's Encrypt / Cloudflare).
* **Variáveis de Ambiente:** Configure conforme o arquivo `sabeganha_backend/.env.example`.

### 4. Serviço do Admin Dashboard (`sabeganha_admin`)
* Crie outro **App Service** conectado a este mesmo repositório.
* **Build Type:** Dockerfile.
* **Root Directory:** `/sabeganha_admin`.
* **Porta Interna:** `3001`.
* **Domínio:** `admin.sabeganha.com.br`.
