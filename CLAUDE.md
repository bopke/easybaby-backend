# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Easybaby API built with NestJS TypeScript - a Node.js framework for building efficient and scalable server-side applications. The project implements:
- **Authentication**: JWT-based authentication with Passport, including refresh token rotation
- **Session Management**: Multi-device session tracking with pagination, filtering, and ordering
- **Database**: PostgreSQL with TypeORM for data persistence
- **Email**: Transactional emails via Brevo (formerly Sendinblue)
- **Scheduled Tasks**: Automated cleanup jobs using @nestjs/schedule
- **API Documentation**: Swagger/OpenAPI documentation
- **Security**: Global authentication guards, rate limiting, CORS, token family tracking
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
- **AppModule** (src/app.module.ts): Root module that imports all feature modules and ScheduleModule
- **AuthModule**: JWT authentication, refresh tokens, session management, scheduled cleanup tasks
- **UsersModule**: User management and CRUD operations
- **TrainersModule**: Trainers catalog with public CRUD operations and pagination
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
- **Strategy**: JWT tokens with Passport.js + Refresh Token rotation
- **Access Token Structure**: Includes `sub` (user ID), `email`, `iss` (issuer), `aud` (audience)
- **Access Token Expiration**: 1 hour (3600 seconds, hardcoded)
- **Refresh Token Expiration**: 30 days (hardcoded for consistency)
- **Token Security**:
  - Refresh tokens stored in database with JTI (JWT ID)
  - Token family tracking for rotation detection
  - Automatic revocation of entire family on token reuse detection
  - IP address and user agent tracking per session
- **Session Management**:
  - Unlimited active sessions per user
  - Sessions can be listed with pagination, filtering, and ordering
  - Current session marking via refresh token
  - Individual session revocation or logout from all devices
- **Global Guard**: `JwtAuthGuard` protects all endpoints by default
- **Public Routes**: Use `@Public()` decorator to bypass authentication (e.g., auth endpoints, trainers endpoints)
- **Protected Routes**: Require `Authorization: Bearer <token>` header (e.g., users endpoints)
- **Swagger Auth**: Bearer token authentication configured in Swagger UI

### Configuration
- **Environment Variables**: Loaded via `@nestjs/config` with validation
- **Validation**: Joi schema validates all required env vars on startup
- **Configuration File**: `src/config/configuration.ts` exports typed config object
- **Required Env Vars**:
  - `DATABASE_HOST`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`: PostgreSQL connection details
  - `JWT_SECRET`: Secret key for JWT signing
  - `DEFAULT_SENDER_EMAIL`, `DEFAULT_SENDER_NAME`: Email configuration
- **Optional Env Vars** (with defaults):
  - `NODE_ENV` (default: 'development')
  - `PORT` (default: 3000)
  - `CORS_ORIGIN` (default: '*')
  - `DATABASE_PORT` (default: 5432)
  - `JWT_ISSUER` (default: 'easybaby-api')
  - `JWT_AUDIENCE` (default: 'easybaby-api')
  - `REFRESH_TOKEN_SECRET` (default: uses `JWT_SECRET`)
  - `BREVO_API_KEY` (optional, for email functionality)

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
- **Centralized Test Mocks**: Use factory functions from `mocks/` directories
  - `src/users/mocks/user.mock.ts`: `createMockUser()`, `mockUser`, `createMockVerifiedUser()`
  - `src/auth/mocks/refresh-token.mock.ts`: `createMockRefreshToken()`, `mockRefreshToken`
- **Logger Suppression**: Suppress logger output in tests using:
  ```typescript
  jest.spyOn(Logger.prototype, 'log').mockImplementation();
  jest.spyOn(Logger.prototype, 'error').mockImplementation();
  jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  ```
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

## Scheduled Tasks

The application uses `@nestjs/schedule` for automated background jobs:

### Token Cleanup Job
- **Service**: `ScheduledTasksService` in auth module
- **Schedule**: Daily at 3:00 AM (`CronExpression.EVERY_DAY_AT_3AM`)
- **Purpose**: Removes expired refresh tokens from database
- **Logging**: Logs start, completion with count, and any errors
- **Error Handling**: Graceful error handling to prevent application crashes

### Customizing Schedule
Modify the `@Cron()` decorator in `src/auth/services/scheduled-tasks.service.ts`:
```typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)  // 12:00 AM
@Cron(CronExpression.EVERY_WEEK)              // Weekly
@Cron('0 */6 * * *')                           // Every 6 hours
```

## Pagination, Filtering, and Ordering

Several endpoints support pagination, filtering, and ordering following a consistent pattern:

### Trainers Endpoint (`GET /trainers`)
- **Pagination**: `?page=1&limit=10`
- **Filtering**: `?name=John&city=Warsaw&isVerified=true`
- **Ordering**: `?order=name:asc&order=createdAt:desc`
- Returns: `Paginated<TrainerResponseDto>` with `data`, `total`, `page`, `limit`

### Sessions Endpoint (`GET /auth/sessions`)
- **Pagination**: `?page=1&limit=10`
- **Filtering**: `?ipAddress=192.168&userAgent=Mozilla&tokenFamily=family-123`
- **Ordering**: `?order=lastUsedAt:desc&order=createdAt:desc`
- **Special**: `?refreshToken=token` to mark current session
- Returns: `Paginated<SessionResponseDto>` with `data`, `total`, `page`, `limit`

### Implementation Pattern
1. Create a `*QueryDto` with pagination, filtering, and ordering fields
2. Use `@Query()` decorator in controller
3. Service receives `Pagination`, filters object, and ordering object
4. Build TypeORM `FindOptionsWhere` and `FindOptionsOrder`
5. Use `findAndCount()` for efficient pagination
6. Return `Paginated<T>` result

## Important Notes

- **Do NOT modify** `eslint.config.mjs` to disable linting rules
- **Always use** the standardized module structure for new modules
- **Always use** centralized mocks from `mocks/` directories in tests
- **Store spy references** in tests to avoid `unbound-method` errors
- **Suppress logger output** in tests to keep output clean
- **Mark public routes** explicitly with `@Public()` decorator
- **Document all endpoints** with Swagger decorators
- **Validate all inputs** with class-validator DTOs
- **Pagination/filtering/ordering**: Follow the trainers/sessions pattern for consistency
