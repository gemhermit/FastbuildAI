# Project Context

## Purpose
BuildingAI is an enterprise-grade open-source intelligent agent platform designed for AI developers, AI entrepreneurs, and forward-thinking organizations. Through a visual configuration interface (Do It Yourself), you can build native enterprise AI applications without code. The platform offers native capabilities such as intelligent agents, MCP (Model Context Protocol), RAG pipelines, knowledge bases, large-model aggregation, and context engineering, along with user registration, membership subscriptions, compute billing, and other business operations.

## Tech Stack

### Frontend
- **Vue.js 3.x** - Core frontend framework
- **NuxtJS 4.x** - Vue.js meta-framework for SSR/SSG
- **NuxtUI 3.x** - UI component library
- **TypeScript 5.x** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **Vite 7.x** - Build tool and development server
- **Pinia** - State management
- **TipTap** - Rich text editor
- **ECharts** - Data visualization charts

### Backend
- **Node.js 22+** - JavaScript runtime
- **NestJS 11.x** - Progressive Node.js framework
- **TypeScript 5.x** - Type-safe JavaScript
- **TypeORM 0.3.x** - Object-relational mapping
- **PostgreSQL 17.x** - Primary database
- **Redis** - Caching and session storage
- **BullMQ** - Job queue management
- **JWT** - Authentication tokens

### Development & Build Tools
- **Turbo** - Monorepo build system
- **PNPM 10.20.0** - Package manager
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Docker** - Containerization
- **PM2** - Process management

### AI & Integration
- **Multiple AI Provider SDKs** - OpenAI, Anthropic, Google, etc.
- **MCP (Model Context Protocol)** - Tool integration
- **RAG (Retrieval-Augmented Generation)** - Knowledge base integration

## Project Conventions

### Code Style
- **TypeScript-first**: All code should be written in TypeScript with strict type checking
- **ESLint Configuration**: Uses custom @buildingai/eslint-config with flat config format
- **Prettier Formatting**: Consistent code formatting with prettier-plugin-tailwindcss
- **Naming Conventions**:
  - Files: kebab-case for files (e.g., `user-service.ts`)
  - Classes: PascalCase (e.g., `UserService`)
  - Functions/Variables: camelCase (e.g., `getUserById`)
  - Constants: SCREAMING_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Import Ordering**: External imports first, then internal imports, organized alphabetically

### Architecture Patterns
- **Monorepo Structure**: Organized into packages under `/packages/` directory
- **Modular Architecture**: Separated concerns into domain-specific packages (@buildingai/*)
- **NestJS Patterns**: Follows NestJS conventions for modules, controllers, and services
- **Dependency Injection**: Uses NestJS DI container with custom decorators
- **Event-Driven**: Utilizes NestJS EventEmitter for loose coupling
- **Repository Pattern**: Data access through TypeORM repositories
- **Service Layer**: Business logic encapsulated in service classes
- **DTO Pattern**: Data Transfer Objects for API validation

### Testing Strategy
- **Jest Framework**: Primary testing framework for unit and integration tests
- **Test Location**: Tests co-located with source files using `.spec.ts` suffix
- **Coverage Requirements**: Jest configured for coverage reporting
- **E2E Testing**: Jest with Supertest for API endpoint testing
- **Test Environment**: Node.js environment for backend tests

### Git Workflow
- **Branch Strategy**: Main development on `develop` branch, `master` for releases
- **Commit Convention**: Conventional commits with format: `type(scope): description`
- **Pull Requests**: Required for all code changes with automated checks
- **Automated Builds**: Turbo handles build orchestration across packages

## Domain Context

### Core Concepts
- **AI Agents**: Autonomous agents with memory, goals, and tool usage capabilities
- **MCP Integration**: Model Context Protocol for tool integration via SSE and HTTP
- **Knowledge Base**: Document-based knowledge with vector search and RAG
- **RAG Pipeline**: Retrieval-Augmented Generation for enhanced AI responses
- **Multi-Model Support**: Unified API for various AI providers (OpenAI, Anthropic, Google, etc.)
- **Extension System**: Plugin architecture for extending AI capabilities
- **User Management**: Registration, authentication, and team collaboration
- **Billing System**: Membership tiers and usage-based billing

### Key Features
- Conversational AI with multimodal model support
- Visual agent builder with drag-and-drop interface
- Document parsing and knowledge base creation
- Real-time collaboration and team workspaces
- Extension marketplace for AI tools
- Comprehensive analytics and monitoring

## Important Constraints

### Technical Constraints
- **Node.js 22+**: Minimum runtime requirement
- **Memory**: Minimum 4GB RAM, 2+ CPU cores recommended
- **Storage**: Minimum 5GB free space
- **Database**: PostgreSQL 17.x required
- **Cache**: Redis required for session management
- **Browser**: Modern browsers with ES2020 support

### Business Constraints
- **Open Source**: Apache 2.0 license
- **Enterprise Focus**: Designed for enterprise AI applications
- **Privacy First**: Only collects anonymized usage statistics with consent
- **Multi-tenant**: Supports multiple organizations and teams

### Security Considerations
- **JWT Authentication**: Token-based authentication with configurable expiration
- **Input Validation**: Comprehensive DTO validation with class-validator
- **SQL Injection Prevention**: TypeORM parameterized queries
- **CORS Configuration**: Configurable cross-origin resource sharing
- **Rate Limiting**: Built-in rate limiting for API endpoints

## External Dependencies

### AI Service Providers
- **OpenAI**: GPT models and embedding services
- **Anthropic**: Claude models
- **Google**: Gemini models
- **Various Chinese providers**: Baidu, Alibaba, Tencent, etc.

### Infrastructure Services
- **PostgreSQL**: Primary data storage
- **Redis**: Caching and session management
- **Docker**: Container orchestration
- **PM2**: Production process management

### Development Tools
- **GitHub**: Source code hosting and CI/CD
- **NPM Registry**: Package distribution
- **Docker Hub**: Container registry
