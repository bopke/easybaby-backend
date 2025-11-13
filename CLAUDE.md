# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NestJS TypeScript starter application - a Node.js framework for building efficient and scalable server-side applications. The project follows NestJS architectural patterns with modular structure, dependency injection, and decorator-based routing.

## Development Commands

### Running the Application
```bash
npm run start          # Standard start
npm run start:dev      # Watch mode (auto-reload on changes)
npm run start:debug    # Debug mode with --inspect
npm run start:prod     # Production mode (requires build first)
```

### Building
```bash
npm run build          # Compile TypeScript to dist/ directory
```

### Testing
```bash
npm run test           # Run unit tests (*.spec.ts files in src/)
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage report
npm run test:debug     # Run tests with Node debugger
npm run test:e2e       # Run end-to-end tests (*.e2e-spec.ts files in test/)
```

### Code Quality
```bash
npm run lint           # Run ESLint with auto-fix
npm run format         # Format code with Prettier
```

## Architecture

### Module System
- **AppModule** (src/app.module.ts): Root module that imports all feature modules
- NestJS uses a modular architecture where each feature is encapsulated in its own module
- Modules declare their controllers, providers (services), and any imports they need

### Dependency Injection
- Services are decorated with `@Injectable()` and registered in module providers
- Controllers receive services through constructor injection
- Example: `AppController` injects `AppService` via constructor parameter

### Request Flow
1. HTTP request → Controller (decorated with `@Controller()`)
2. Controller methods use decorators like `@Get()`, `@Post()` for routing
3. Controllers delegate business logic to Services
4. Services return data to Controllers, which send HTTP responses

### File Structure
- `src/main.ts`: Application entry point, bootstraps NestJS app on port 3000 (or PORT env var)
- `src/**/*.module.ts`: Feature modules
- `src/**/*.controller.ts`: HTTP request handlers
- `src/**/*.service.ts`: Business logic and data access
- `src/**/*.spec.ts`: Unit tests (Jest)
- `test/**/*.e2e-spec.ts`: End-to-end tests (Supertest)

## TypeScript Configuration

- **Module system**: NodeNext (ES modules with Node.js resolution)
- **Target**: ES2023
- **Strict mode**: Partial (strictNullChecks enabled, but noImplicitAny disabled)
- **Decorators**: Experimental decorators and metadata emission enabled (required for NestJS)
- Build output: `dist/` directory

## Code Style

### ESLint Rules
- TypeScript ESLint with recommended type-checked rules
- `@typescript-eslint/no-explicit-any`: disabled
- `@typescript-eslint/no-floating-promises`: warning
- `@typescript-eslint/no-unsafe-argument`: warning

### Prettier Configuration
- Single quotes for strings
- Trailing commas in all multi-line structures
- Line endings: auto-detected

## Testing Strategy

### Unit Tests
- Located alongside source files (*.spec.ts)
- Use Jest framework with ts-jest transformer
- Root directory for imports: `src/`
- Pattern: `*.spec.ts`

### E2E Tests
- Located in `test/` directory
- Use Jest + Supertest for HTTP testing
- Pattern: `*.e2e-spec.ts`
- Test the full application stack including HTTP layer

## NestJS CLI

The project uses NestJS CLI (`nest` command) for build operations:
- Configured via `nest-cli.json`
- Source root: `src/`
- Deletes output directory on each build
