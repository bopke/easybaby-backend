# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Workshops API built with NestJS TypeScript - a Node.js framework for building efficient and scalable server-side applications. The project implements:
- **Authentication**: JWT-based authentication with Passport
- **Database**: PostgreSQL with TypeORM for data persistence
- **Email**: Transactional emails via Brevo (formerly Sendinblue)
- **API Documentation**: Swagger/OpenAPI documentation
- **Security**: Global authentication guards, rate limiting, CORS
- **Validation**: Class-validator for DTO validation

The project follows NestJS architectural patterns with modular structure, dependency injection, and decorator-based routing.

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

### Database Migrations
```bash
npm run migration:generate src/migrations/MigrationName  # Generate migration from entity changes
npm run migration:create src/migrations/MigrationName    # Create empty migration
npm run migration:run       # Run pending migrations
npm run migration:revert    # Revert last migration
npm run migration:show      # Show migration status
```

## Architecture

### Module System
- **AppModule** (src/app.module.ts): Root module that imports all feature modules
- **AuthModule**: JWT authentication, login, registration
- **UsersModule**: User management and CRUD operations
- **TrainersModule**: Trainers catalog with public CRUD operations
- **EmailModule**: Email sending via Brevo API
- **HealthModule**: Health checks for the application and database

NestJS uses a modular architecture where each feature is encapsulated in its own module.

### Standardized Module Structure
All modules follow this standardized folder structure (see `docs/module_catalog_structure.md`):
```
module/
├── controllers/        # HTTP request handlers and their tests
│   ├── module.controller.ts
│   └── module.controller.spec.ts
├── services/          # Business logic and their tests
│   ├── module.service.ts
│   └── module.service.spec.ts
├── dtos/              # Data Transfer Objects
│   ├── create-module.dto.ts
│   ├── update-module.dto.ts
│   └── index.ts       # Barrel export
├── entities/          # Database entities
│   ├── module.entity.ts
│   ├── enums/         # Entity enums
│   │   ├── enum.ts
│   │   └── index.ts
│   ├── constants/     # Entity constants
│   └── utils/         # Entity utilities
├── guards/            # Route guards (optional)
├── decorators/        # Custom decorators (optional)
├── mocks/             # Test mocks (optional)
└── module.module.ts   # Module definition
```

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
- `src/main.ts`: Application entry point, bootstraps NestJS app, configures Swagger
- `src/app.module.ts`: Root module with global configurations
- `src/config/`: Configuration files (environment variables, TypeORM, validation)
- `src/common/`: Shared utilities, filters, interceptors
- `src/migrations/`: TypeORM database migrations
- `src/auth/`: Authentication module (JWT, guards, strategies)
- `src/users/`: User management module
- `src/trainers/`: Trainers catalog module (public CRUD)
- `src/email/`: Email service module
- `src/health/`: Health check module
- `docs/`: Project documentation
- `test/`: End-to-end tests

### Database
- **ORM**: TypeORM with PostgreSQL
- **Migrations**: Located in `src/migrations/`, run automatically on startup
- **Entities**: Follow the standardized structure with `*.entity.ts` files
- **Data Source**: Configured in `src/data-source.ts` for CLI operations
- **Entity Discovery**: Automatic via glob patterns (`**/*.entity.{ts,js}`)

### Trainers Module
- **Purpose**: Public catalog of certified trainers with full CRUD operations
- **Authentication**: All endpoints are public (marked with `@Public()` decorator)
- **Entity Fields**:
  - Required: name, level, voivodeship, city, email
  - Optional: site, phone, additionalOffer, expirationDate, notes
  - Auto-generated: id (UUID), createdAt, updatedAt
- **Endpoints**: Standard CRUD operations (GET /trainers, POST /trainers, PATCH /trainers/:id, DELETE /trainers/:id)
- **CSV Import**: Initial data can be populated from `trainers.csv`

### Authentication & Authorization
- **Strategy**: JWT tokens with Passport.js
- **Token Structure**: Includes `sub` (user ID), `email`, `iss` (issuer), `aud` (audience)
- **Token Expiration**: 1 hour (3600 seconds)
- **Global Guard**: `JwtAuthGuard` protects all endpoints by default
- **Public Routes**: Use `@Public()` decorator to bypass authentication (e.g., auth endpoints, trainers endpoints)
- **Protected Routes**: Require `Authorization: Bearer <token>` header (e.g., users endpoints)
- **Swagger Auth**: Bearer token authentication configured in Swagger UI

### Configuration
- **Environment Variables**: Loaded via `@nestjs/config` with validation
- **Validation**: Joi schema validates all required env vars on startup
- **Configuration File**: `src/config/configuration.ts` exports typed config object
- **Required Env Vars**:
  - `DATABASE_*`: PostgreSQL connection details
  - `JWT_SECRET`: Secret key for JWT signing
  - `JWT_ISSUER`: Token issuer (default: 'workshops-api')
  - `JWT_AUDIENCE`: Token audience (default: 'workshops-api')
  - Email configuration for Brevo API

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
- Located alongside source files in respective folders (e.g., `services/*.spec.ts`, `controllers/*.spec.ts`)
- Use Jest framework with ts-jest transformer
- Mock external dependencies (database, services, APIs)
- **Important**: Use spy references for assertions to avoid `unbound-method` linting errors
  ```typescript
  // ✓ Correct
  const spy = jest.spyOn(service, 'method').mockResolvedValue(result);
  expect(spy).toHaveBeenCalledWith(args);

  // ✗ Incorrect (linting error)
  jest.spyOn(service, 'method');
  expect(service.method).toHaveBeenCalledWith(args);
  ```

### E2E Tests
- Located in `test/` directory
- Use Jest + Supertest for HTTP testing
- Pattern: `*.e2e-spec.ts`
- Test the full application stack including HTTP layer

## API Documentation

- **Swagger UI**: Available at `http://localhost:3000/api` (non-production only)
- **Authentication**: Click "Authorize" button in Swagger UI to enter JWT token
- **DTOs**: All request/response shapes documented with `@ApiProperty()` decorators
- **Responses**: All endpoints document possible HTTP status codes with `@ApiResponse()`

## Security Features

### Global Guards
1. **JwtAuthGuard**: Enforces authentication on all endpoints except those marked `@Public()`
2. **ThrottlerGuard**: Rate limiting (60 requests per minute per IP)

### CORS
- Configurable via `CORS_ORIGIN` environment variable
- Supports multiple origins (comma-separated)
- Credentials enabled for cookie support

### Password Security
- Passwords hashed with bcrypt (10 salt rounds)
- Never returned in API responses (excluded from DTOs)
- Minimum 8 characters enforced via validation

## Common Patterns

### Creating DTOs
```typescript
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
```

### Creating Services
```typescript
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}
}
```

### Creating Controllers
```typescript
@ApiTags('Users')
@ApiBearerAuth()  // Requires authentication
@Controller('users')
export class UsersController {
  @Get()
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(): Promise<UserResponseDto[]> { }
}
```

### Public Endpoints
```typescript
@Public()  // Bypasses authentication
@Post('login')
async login(@Body() dto: LoginDto) { }
```

## NestJS CLI

The project uses NestJS CLI (`nest` command) for build operations:
- Configured via `nest-cli.json`
- Source root: `src/`
- Deletes output directory on each build

## Important Notes

- **Do NOT modify** `eslint.config.mjs` to disable linting rules
- **Always use** the standardized module structure for new modules
- **Store spy references** in tests to avoid `unbound-method` errors
- **Mark public routes** explicitly with `@Public()` decorator
- **Document all endpoints** with Swagger decorators
- **Validate all inputs** with class-validator DTOs
