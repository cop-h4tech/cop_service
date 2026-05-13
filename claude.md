# NestJS Project Standards

This document outlines the naming conventions and project structure standards for NestJS applications.

## Project Structure

A typical NestJS project follows a modular architecture. Here's the recommended folder structure:

```
src/
├── app.module.ts
├── main.ts
├── modules/
│   ├── feature1/
│   │   ├── feature1.module.ts
│   │   ├── feature1.controller.ts
│   │   ├── feature1.service.ts
│   │   ├── dto/
│   │   │   ├── create-feature1.dto.ts
│   │   │   └── update-feature1.dto.ts
│   │   └── entities/
│   │       └── feature1.entity.ts
│   └── feature2/
│       └── ...
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   └── pipes/
├── config/
│   └── configuration.ts
├── shared/
│   └── utilities/
└── test/
    └── app.e2e-spec.ts
```

## Naming Conventions

### Files and Folders
- Use **kebab-case** for file and folder names
- Module files: `feature.module.ts`
- Controller files: `feature.controller.ts`
- Service files: `feature.service.ts`
- DTO files: `create-feature.dto.ts`, `update-feature.dto.ts`
- Entity files: `feature.entity.ts`
- Guard files: `auth.guard.ts`
- Interceptor files: `logging.interceptor.ts`
- Pipe files: `validation.pipe.ts`
- Decorator files: `roles.decorator.ts`

### Classes and Types
- Use **PascalCase** for class names, interfaces, and type definitions
- **Acronyms are always ALL-CAPS** regardless of position: `DTO`, `OTP`, `SMS`, `API`, `URL`, etc.
- Controllers: `FeatureController`
- Services: `FeatureService`
- Modules: `FeatureModule`
- DTOs: `CreateFeatureDTO`, `UpdateFeatureDTO`
- Entities: `FeatureEntity`
- Guards: `AuthGuard`
- Interceptors: `LoggingInterceptor`
- Pipes: `ValidationPipe`
- Decorators: `RolesDecorator`

### Methods and Properties
- Use **camelCase** for method names, property names, and variable names
- **Acronyms stay ALL-CAPS** even in camelCase: `sendOTP()`, `verifyOTP()`, `signInDTO`, `verifySMSOTPDTO`
- Controller methods: `createFeature()`, `findAllFeatures()`, `findFeatureById()`
- Service methods: `create()`, `findAll()`, `findById()`, `update()`, `delete()`
- Properties: `firstName`, `lastName`, `emailAddress`

### Constants
- Use **UPPER_SNAKE_CASE** for constants
- `const MAX_RETRY_ATTEMPTS = 3;`
- `const DEFAULT_PAGE_SIZE = 10;`

### Routes and Endpoints
- Use **kebab-case** for route paths
- RESTful endpoints: `/users`, `/users/:id`, `/users/:id/posts`
- Controller route decorators: `@Get()`, `@Post()`, `@Put()`, `@Delete()`
- **Multi-step flows** group sub-operations under the parent path, not as flat siblings:
  - `POST /auth/login` + `POST /auth/login/otp` — not `/auth/signin-otp`
  - `POST /auth/verify/email-otp` — not `/auth/verify-email-otp`
  - `POST /auth/verify/sms-otp` — not `/auth/verify-otp`
- Pattern: `/{resource}/{action}/{qualifier}` — qualifiers narrow the action, not the resource

### Database (PostgreSQL SQL Naming Conventions)

PostgreSQL enforces the following rules for identifiers (table names, column names, etc.):

- Names must **begin with a letter (`a–z`) or underscore (`_`)**.
- Subsequent characters may be **letters, digits (`0–9`), or underscores** — no spaces, hyphens, or special characters without quoting.
- **Maximum length is 31 characters** (`NAMEDATALEN - 1`; longer names are silently truncated).
- **Unquoted names are always folded to lowercase** by PostgreSQL. `firstName`, `FirstName`, and `FIRSTNAME` all become `firstname` in the DB — which is why explicit `snake_case` column names must be set in TypeORM `@Column({ name: '...' })`.
- Names containing spaces or reserved keywords must be **double-quoted** (`"my column"`), which also makes them case-sensitive — avoid this pattern entirely.

**Conventions for this project:**

- Table names: **plural snake_case** — `users`, `payment_info`, `otps`, `sessions`
- Column names: **snake_case** — `first_name`, `email_verified`, `created_at`
- Foreign key columns: **snake_case** — `user_id`, `order_id`
- Migration files: timestamp prefix — `Migration1715698800000.ts`

**TypeORM rule:** Always set an explicit `name` in `@Column()`, `@CreateDateColumn()`, `@UpdateDateColumn()`, and `@JoinColumn()` whenever the TypeScript property is camelCase. Without it, TypeORM writes the camelCase name directly and PostgreSQL lowercases it (e.g., `firstName` → column `firstname`, not `first_name`).

```ts
// Correct — explicit snake_case column name
@Column({ type: 'varchar', name: 'first_name' })
firstName!: string;

@CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
createdAt!: Date;

@JoinColumn({ name: 'user_id' })
user!: UserEntity;

// Wrong — TypeORM will create column "firstname" (lowercased camelCase)
@Column({ type: 'varchar' })
firstName!: string;
```

## Code Organization

### Modules
- Each feature should have its own module
- Import only what you need
- Use lazy loading for large applications

### Controllers
- Keep controllers thin - delegate business logic to services
- Use appropriate HTTP status codes
- Validate input using DTOs and pipes

### Services
- Contain business logic
- Use dependency injection
- Implement interfaces for testability

### DTOs (Data Transfer Objects)
- Define input/output data structures
- Use class-validator decorators for validation
- Separate create and update DTOs when needed

### Entities
- Represent database tables/models
- Use TypeORM decorators for database mapping
- Define relationships and constraints

## Best Practices

1. **Separation of Concerns**: Keep different layers (controllers, services, repositories) separate
2. **Dependency Injection**: Use NestJS's DI container for better testability and modularity
3. **Validation**: Always validate input data using pipes and DTOs
4. **Error Handling**: Use exception filters for consistent error responses
5. **Testing**: Write unit tests for services and e2e tests for controllers
6. **Documentation**: Use Swagger/OpenAPI for API documentation
7. **Security**: Implement authentication/authorization guards
8. **Performance**: Use caching, pagination, and optimization techniques

## File Templates

### Module
```typescript
import { Module } from '@nestjs/common';
import { FeatureController } from './feature.controller';
import { FeatureService } from './feature.service';

@Module({
  controllers: [FeatureController],
  providers: [FeatureService],
  exports: [FeatureService],
})
export class FeatureModule {}
```

### Controller
```typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { FeatureService } from './feature.service';
import { CreateFeatureDTO } from './dto/create-feature.dto';

@Controller('features')
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Post()
  create(@Body() createFeatureDTO: CreateFeatureDTO) {
    return this.featureService.create(createFeatureDTO);
  }

  @Get()
  findAll() {
    return this.featureService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.featureService.findOne(+id);
  }
}
```

### Service
```typescript
import { Injectable } from '@nestjs/common';
import { CreateFeatureDTO } from './dto/create-feature.dto';
import { UpdateFeatureDTO } from './dto/update-feature.dto';

@Injectable()
export class FeatureService {
  create(createFeatureDTO: CreateFeatureDTO) {
    // Implementation
  }

  findAll() {
    // Implementation
  }

  findOne(id: number) {
    // Implementation
  }

  update(id: number, updateFeatureDTO: UpdateFeatureDTO) {
    // Implementation
  }

  remove(id: number) {
    // Implementation
  }
}
```

### DTO
```typescript
import { IsString, IsOptional } from 'class-validator';

export class CreateFeatureDTO {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
```

### Entity (TypeORM)
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('features')
export class FeatureEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'name' })
  name: string;

  @Column({ type: 'text', nullable: true, name: 'description' })
  description?: string;

  @Column({ type: 'varchar', name: 'some_field' })
  someField: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
```

This standard ensures consistency across the codebase and follows NestJS best practices.