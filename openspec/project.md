# Project Context

## Purpose

Fast build AI applications - 羲梦超级智能体 (Ximeng Super AI Agent). A next-generation rapid development platform for AI applications that enables developers to quickly build, deploy, and manage AI-powered applications with multi-model support, intelligent agents, knowledge bases, and integrated payment systems.

**Core Features:**
- AI Chat with multi-model support
- MCP (Model Context Protocol) invocation
- User recharge and payment system
- Model management and deployment
- Knowledge base for centralized AI knowledge
- Intelligent autonomous agents
- Plugin system for extensibility
- Workflow automation (in progress)

**Live Demo:** http://ai.fastbuildai.com/
**Website:** https://www.fastbuildai.com/

## Tech Stack

### Backend (apps/server/)
- **Framework:** NestJS 11.x (Node.js 22+)
- **Language:** TypeScript 5.x
- **Database:** PostgreSQL 17.x with pgvector for vector storage
- **ORM:** TypeORM 0.3.x
- **Caching:** Redis 8.x with cache-manager
- **Job Queue:** Bull/BullMQ with @nestjs/bull
- **Authentication:** JWT with @nestjs/jwt
- **Validation:** class-validator, class-transformer
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest, Supertest
- **Build:** SWC compiler with @swc/core
- **Process Management:** PM2

### Frontend Web (apps/web/)
- **Framework:** Nuxt 3.x (Vue 3.x with Composition API)
- **Build Tool:** Vite 6.x
- **UI Library:** NuxtUI 3.x with TailwindCSS 4.x
- **Language:** TypeScript 5.x
- **State Management:** Pinia
- **Internationalization:** @nuxtjs/i18n 9.x
- **Charts:** ECharts 5.x
- **Markdown:** Markdown-it with GitHub alerts
- **Icons:** Iconify (Heroicons, Lucide, Tabler)
- **Testing:** ESLint, TypeScript checking

### Mobile (apps/mobile/)
- **Framework:** DCloud UniApp 3.x
- **Platforms:** H5, WeChat Mini Program, Alipay, Baidu, JD, Kuaishou, Lark, QQ, Toutiao, Xiaohongshu, HarmonyOS
- **Language:** TypeScript, Vue 3

### Monorepo & Build System
- **Package Manager:** PNPM 10.x with workspaces
- **Monorepo Tool:** Turbo 2.x
- **Bundler:** SWC, Vite, Webpack (via Nuxt)
- **Code Quality:** ESLint 9.x, Prettier 3.x

### Infrastructure & Deployment
- **Containerization:** Docker with docker-compose
- **Database Services:** PostgreSQL 17.6, Redis 8.2.0
- **CDN/Registry:** Alibaba Cloud Registry (registry.ap-southeast-1.aliyuncs.com)
- **Process Management:** PM2 for production deployment

### Development Tools
- **Editor:** VSCode with .vscode settings
- **Version Control:** Git with .gitignore configuration
- **API Testing:** HTTP client, Swagger documentation
- **Monitoring:** Health checks with @nestjs/terminus

## Project Conventions

### Code Style

**EditorConfig:**
- Indentation: 4 spaces
- Line endings: LF
- Character set: UTF-8
- Quote style: Double quotes
- Trailing whitespace: Trimmed
- Final newline: Not required

**Prettier Configuration:**
```javascript
{
  printWidth: 100,
  proseWrap: 'always',
  endOfLine: 'lf',
  tabWidth: 4,
  semi: true,
  singleQuote: false,
  trailingComma: 'all',
  plugins: ['prettier-plugin-tailwindcss']
}
```

**TypeScript Conventions:**
- Use PascalCase for types and interfaces
- Use camelCase for variables and functions
- Use UPPER_CASE for constants
- Prefix private properties with underscore: `_propertyName`
- Use explicit types rather than `any`
- Disable some strict rules for flexibility:
  - `@typescript-eslint/no-explicit-any: off`
  - `@typescript-eslint/explicit-function-return-type: off`
  - `@typescript-eslint/explicit-module-boundary-types: off`

### Architecture Patterns

**Backend (NestJS):**
- **Modular Architecture:** Each feature is a self-contained module under `src/modules/`
- **Core Modules:** Database, Cache, Logger, Plugins as foundation
- **Common Modules:** Shared functionality like Account, Dict, Pay, Refund, WeChat
- **Plugin System:** Extensible plugin architecture under `src/plugins/`
- **MVC Pattern:** Controllers, Services, Entities separation
- **Repository Pattern:** TypeORM repositories for data access
- **Dependency Injection:** NestJS IoC container for testability
- **Configuration:** @nestjs/config for environment-based config

**Frontend (Nuxt 3):**
- **Composition API:** Vue 3 Composition API for logic reuse
- **Auto-imports:** Composables and utilities auto-imported
- **SSR/SSG:** Server-side rendering and static site generation
- **File-based Routing:** Nuxt file-system routing
- **API Layer:** Shared via @fastbuildai/http package

**Monorepo Structure:**
```
apps/               # Applications
├── server/         # NestJS backend
├── web/            # Nuxt 3 frontend
└── mobile/         # UniApp mobile app

packages/           # Shared packages
├── assets/         # Static assets
├── config/         # ESLint and shared configs
├── constants/      # Shared constants
├── designer/       # Design system
├── http/           # HTTP client utilities
├── ui/             # UI components
└── utils/          # Utility functions
```

**Data Architecture:**
- **PostgreSQL:** Primary relational database
- **pgvector:** Vector embeddings for AI/knowledge base
- **Redis:** Caching and session storage
- **TypeORM:** Data persistence with migrations

### Testing Strategy

**Backend Testing:**
- **Unit Tests:** Jest for service and utility testing
- **Integration Tests:** Supertest for API endpoint testing
- **E2E Tests:** jest-e2e configuration
- **Coverage:** Jest coverage reports
- **Test Commands:**
  - `npm test` - Run unit tests
  - `npm run test:watch` - Watch mode
  - `npm run test:cov` - Coverage report
  - `npm run test:e2e` - End-to-end tests

**Frontend Testing:**
- **Linting:** ESLint with TypeScript rules
- **Type Checking:** vue-tsc for type validation
- **Test Framework:** Configured per app (check individual app configs)

**Quality Gates:**
- All tests must pass before merge
- Type checking must pass
- Linting warnings allowed, errors must be fixed
- ESLint rules enforced via CI/CD

### Git Workflow

**Branching Strategy:**
- **main/master:** Production-ready code
- **develop:** Integration branch for features
- **feature/*:** Feature branches (e.g., feature/add-mcp-support)
- **hotfix/*:** Hotfix branches for urgent fixes

**Commit Convention:**
Uses conventional commits for changelog generation:
- `feat:` - New feature
- `fix:` - Bug fix
- `perf:` - Performance improvement
- `refactor:` - Code refactoring
- `docs:` - Documentation changes
- `style:` - Formatting changes
- `test:` - Adding/updating tests
- `chore:` - Maintenance tasks

**Recent Commit Examples:**
- `feat: 更新项目名称为"羲梦超级智能体"并修改相关文档`
- `feat: 调整用户充值相关逻辑`
- `fix: 修复后端打包内存溢出问题`
- `fix: 修复迁移项目导致的多次初始化的问题`
- `perf: 优化登录配置重置及注册方式`

**Pull Request Process:**
1. Create feature branch from develop
2. Implement changes with tests
3. Run linting and type checking
4. Create PR to develop
5. Code review required
6. Merge after approval

## Domain Context

**AI Application Platform:**
- Supports multiple AI models (OpenAI, Claude, local models)
- Knowledge base with vector embeddings for RAG
- Agent-based task automation
- Real-time chat interface
- Model context protocol (MCP) integration

**Payment & User Management:**
- User authentication and authorization
- Balance-based payment system
- Recharge functionality
- Transaction logging
- Refund handling

**Multi-tenant Architecture:**
- User-scoped data isolation
- Role-based access control (RBAC)
- Admin console for management

**Plugin Ecosystem:**
- Extensible architecture
- Third-party integrations
- Custom model integrations
- Article plugin example in codebase

## Important Constraints

**Technical Constraints:**
- **Node.js Version:** Minimum 22.x required
- **PNPM Version:** Minimum 10.x for workspace support
- **Memory Limits:** Build processes optimized (build uses `--max-old-space-size`)
  - Server build: 2048MB limit
  - Web build: 8192MB limit
- **Database:** PostgreSQL 17+ with pgvector extension required
- **Redis:** Version 8.x for caching layer

**Business Constraints:**
- **Licensing:** Apache License 2.0
- **Environment:** Docker-based deployment preferred
- **Regional:** Chinese market focus (Alibaba Cloud registry)

**Performance Constraints:**
- Cache-first architecture with Redis
- Database indexing for query optimization
- Vector search optimization for knowledge base
- CDN-ready static asset delivery

**Security Constraints:**
- JWT-based authentication
- CORS configuration via environment
- Environment variables for sensitive data
- SQL injection protection via TypeORM
- XSS protection in frontend (vue-dompurify-html)

## External Dependencies

**Core Services:**
- **PostgreSQL 17.6:** Primary database with pgvector for embeddings
- **Redis 8.2.0:** Caching and session management
- **Docker Registry:** Alibaba Cloud (registry.ap-southeast-1.aliyuncs.com)

**AI/ML Services:**
- **OpenAI API:** GPT models integration
- **Anthropic Claude API:** Claude model support
- **Model Context Protocol (MCP):** SDK v1.17.3 for advanced integrations
- **pgvector:** PostgreSQL extension for vector similarity search

**Third-Party APIs:**
- **WeChat Integration:** Payment and messaging
- **Payment Systems:** Multiple payment gateways (configured via modules)
- **Translation:** Bing Translate API (for i18n)

**Development Tools:**
- **SWC:** Fast Rust-based compiler for TypeScript
- **Turbo:** Monorepo build system v2.5.6
- **Prettier:** Code formatting v3.6.2
- **ESLint:** Code linting v9.x with TypeScript

**Frontend Dependencies:**
- **Nuxt UI:** Component library v3.3.2
- **TailwindCSS:** Utility-first CSS v4.1.12
- **VueUse:** Vue composition utilities v13.7.0
- **Pinia:** State management for Vue
- **@nuxtjs/i18n:** Internationalization v9.5.6

**Monitoring & Health:**
- **@nestjs/terminus:** Health checks
- **Winston/Pino:** Logging (check logger module)
- **Bull Queue:** Job monitoring and processing

**Configuration:**
- Environment variables for all sensitive data
- Docker Compose for local development
- PM2 for production process management
