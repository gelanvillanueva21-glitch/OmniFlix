# OmniFlix — Mandatory Coding Rules and Project Context

You are assisting me in developing **OmniFlix**, a full-stack entertainment platform. Your job is to help me write maintainable, secure, consistent code while helping me understand the implementation.

These instructions are mandatory for every coding task I give you.

## 1. MANDATORY FILE INSPECTION BEFORE CODING

Before writing, modifying, deleting, or suggesting code changes:

1. Read **ALL `.md` files** in the project repository that are accessible to you, architecture documentation, setup instructions, development notes, API documentation, and other Markdown files.
2. Identify and read all existing files directly or indirectly related to my requested change.
3. Trace the dependencies and connections between relevant files. For example:
   - Router → Service → Repository
   - Service → Schema / Model
   - Repository → Database / ORM
   - Authentication dependency → Protected router
   - Frontend API client → Backend endpoint
   - Configuration → Environment variables
4. Inspect existing implementations before creating new ones. Reuse existing utilities, naming conventions, schemas, dependencies, and patterns wherever appropriate.
5. Check the project's dependency files and configuration files before introducing new libraries or changing configurations.
6. Read relevant tests and existing error-handling patterns before modifying behavior.
7. Never assume a file's contents based only on its filename. Open and read it.

**Do not start coding until you have inspected the relevant documentation and existing code.**

If you cannot access or read a file, explicitly tell me which file you could not inspect. Never claim to have read files that you have not actually accessed.

If the repository is too large to inspect in one pass, inspect it in manageable sections. Maintain an inspection checklist and continue until all Markdown files and relevant dependencies for the requested task have been covered.

Do not reread every file unnecessarily if its contents are already available and unchanged in the current working context. However, always check whether the documentation or relevant files have changed since the previous task.

## 2. MANDATORY PRE-IMPLEMENTATION REVIEW

Before implementing a requested feature, briefly report:

- The relevant Markdown documentation you inspected.
- The existing source files you inspected.
- The dependency chain connecting those files.
- The existing conventions you intend to preserve.
- The files you expect to create or modify.
- Any conflicts, missing information, or architectural decisions that require clarification.

Do not produce a lengthy report for a small change. Keep it concise but specific.

If the requested change conflicts with documented project decisions, explain the conflict before proceeding.

Do not invent new architecture, unnecessary abstractions, additional database fields, or dependencies when the existing project already provides a suitable solution.

If an important decision is ambiguous, ask me before making a potentially breaking change.

## 3. STRICT FOUR-SPACE INDENTATION

Use **exactly four spaces per indentation level** in all applicable source code.

- Never use tabs for indentation.
- Do not mix tabs and spaces.
- Follow the language's syntax while maintaining four-space indentation wherever the language permits it.
- Format nested blocks consistently.
- Preserve the surrounding project's formatting conventions only when they do not conflict with this explicit rule.

This applies to Python, TypeScript, JavaScript, JSON, configuration files, tests, and other applicable formats.

Do not use one-space or two-space indentation in code you generate.

## 4. STRICT, DESCRIPTIVE, CONSISTENT NAMING

Never abbreviate variable names, function parameters, object properties, or identifiers merely to save typing.

Use clear, descriptive names that express their purpose.

Examples of prohibited shortcuts:

- `database` → `db`
- `statement` → `stmt`
- `request` → `req`
- `response` → `res`
- `configuration` → `config` when the full descriptive name is appropriate
- `repository` → `repo`
- `authentication` → `auth` when the full descriptive name is appropriate
- `user_identifier` → `uid`
- `password` → `pwd`
- `exception` → `exc` when the full descriptive name is appropriate

Prefer:

- `database_session`
- `database_connection`
- `sql_statement`
- `request`
- `response`
- `configuration`
- `user_repository`
- `authentication_service`
- `user_identifier`
- `password`
- `exception`

These examples are illustrative. Choose names that accurately describe each identifier's actual purpose.

Use the naming convention appropriate to the language:

- Python variables and functions: `snake_case`
- Python classes: `PascalCase`
- TypeScript and JavaScript variables and functions: `camelCase`
- TypeScript and JavaScript classes and types: `PascalCase`
- Constants: follow the established convention for the relevant language and project.

Never arbitrarily rename an existing identifier that is part of a public interface, database schema, API contract, or established project convention. Instead, preserve it or explain why a coordinated change is necessary.

Before creating new identifiers, search the relevant code for existing names and reuse them when they represent the same concept.

Avoid generic names such as `data`, `result`, `item`, `value`, or `object` when a more meaningful name would improve clarity. Generic names are acceptable when their meaning is genuinely obvious and limited in scope.

## 5. CONSISTENT ARCHITECTURE

For the FastAPI backend, follow this architecture:

**Router → Service → Repository**

### Router
- Handle HTTP requests and responses.
- Declare routes, request validation, dependency injection, and appropriate HTTP status codes.
- Call the service layer.
- Do not put business logic or raw database queries in routers.

### Service
- Contain business rules and application logic.
- Coordinate repositories and other required services.
- Handle application-level decisions and error conditions.
- Do not turn the service layer into a duplicate router or repository.

### Repository
- Handle database queries and persistence operations.
- Keep database access separate from business logic.
- Reuse the existing database and ORM patterns.

### Schemas
- Define and validate request and response contracts.
- Keep API schemas consistent with the actual API behavior.

### Models
- Represent database entities using the project's established ORM or database tooling.
- Do not create database tables manually when the project already uses migrations or an ORM schema workflow.

### Dependencies
- Reuse established dependency injection patterns.
- Preserve existing dependency names, including `DatabaseDepends` if that is what the project currently uses.

Do not create additional layers simply for the sake of following a rigid pattern. Follow the existing architecture and use each layer for its intended responsibility.

## 6. OMNIFLIX TECHNOLOGY AND AUTHENTICATION DECISIONS

Inspect the repository to confirm the current implementation before relying on these details.

The intended stack includes:

- FastAPI with Python for the authentication backend.
- PostgreSQL for persistent data.
- PyJWT for JWT handling.
- `pwdlib[argon2]` for secure password hashing and verification.
- A Next.js, React, and TypeScript frontend.
- Prisma for the frontend-side application data layer where applicable.

For authentication:

- Never store plaintext passwords.
- Use Argon2 password hashing through the existing `pwdlib` configuration.
- Verify passwords using the appropriate password-hashing verification function.
- Validate JWT signatures and claims.
- Include appropriate expiration information in access tokens.
- Keep signing secrets in environment variables, never hardcoded in source code.
- Never log passwords, tokens, signing secrets, or other sensitive credentials.
- Return consistent and appropriate authentication errors without leaking sensitive information.
- Never assume that frontend validation replaces backend validation.
- Follow the project's existing token transport and authentication contract. Do not silently introduce cookies, refresh tokens, or a different authentication flow without discussing the change when necessary.

Keep the User model minimal unless the documentation or a confirmed requirement calls for additional fields. Do not add unnecessary columns or unrelated authentication features.

## 7. NO UNNECESSARY CHANGES

When I request a feature or fix:

- Change only what is necessary to fulfill the request.
- Preserve unrelated working functionality.
- Avoid unnecessary refactoring.
- Do not rename files, classes, variables, functions, endpoints, or database fields without a clear reason.
- Do not introduce duplicate utilities or duplicate implementations.
- Do not install a new dependency if an existing dependency can handle the requirement.
- Do not silently change API response formats, database schemas, environment variables, or configuration behavior.
- Do not generate placeholder implementations and present them as complete.
- Do not delete code simply because you do not immediately understand it. Investigate its purpose first.

If a broader change is necessary, explain why and identify its impact before implementing it.

## 8. CODE QUALITY AND SECURITY

All generated code must:

- Be readable and maintainable.
- Use descriptive identifiers and four-space indentation.
- Follow existing typing conventions.
- Handle expected failures explicitly.
- Avoid swallowing exceptions.
- Avoid using `print()` for backend application logging; follow the project's logging conventions.
- Avoid unsafe dynamic SQL and other injection vulnerabilities.
- Avoid hardcoded credentials or sensitive information.
- Use asynchronous database operations correctly when the existing stack requires them.
- Avoid unnecessary complexity, premature abstractions, and overengineering.
- Include appropriate tests or update existing tests when behavior changes.

Do not claim code is secure, correct, or tested without a reasonable basis.

## 9. TESTING AND VERIFICATION

After implementing a change:

1. Review the complete contents of each modified file.
2. Check imports, naming consistency, indentation, and integration with existing code.
3. Verify that callers, dependencies, schemas, and response contracts still match.
4. Run relevant tests, linters, type checks, or validation commands when available.
5. If database models or schemas change, inspect the project's migration workflow and use it appropriately.
6. Report which checks actually ran and their results.
7. Explicitly identify anything you could not test.

Never invent successful test results.

If a test fails, investigate the underlying cause rather than modifying unrelated code merely to make the failure disappear.

## 10. TEACHING AND COLLABORATION

I am learning software engineering and want to understand how my application works internally.

Do not treat my prompts as permission to overengineer the application or rewrite the entire codebase.

Explain important design decisions briefly and clearly. Prioritize understanding over unnecessary abstraction.

When possible, help me understand:

- Why a file belongs in a particular architectural layer.
- How data moves between components.
- Why a particular validation or security check is necessary.
- Which existing files depend on a change.
- How to test the feature.

When I ask for guidance rather than implementation, guide me incrementally instead of immediately giving me a complete solution.

When I explicitly ask you to implement a feature, implement the requested scope after inspecting the necessary context.

## 11. REQUIRED RESPONSE FORMAT FOR CODING TASKS

Before making changes, provide:

**Inspection**
- Documentation and source files inspected.
- Relevant dependency chain.
- Existing patterns and constraints.

**Plan**
- Files to create or modify.
- Intended behavior.
- Important implementation decisions.

After implementation, provide:

**Changes**
- What changed and why.
- How the changes integrate with existing code.

**Verification**
- Commands or tests actually executed.
- Results and remaining issues.

For simple tasks, keep these sections brief. Do not repeat the entire project architecture in every response.

## FINAL RULE

**Inspect first. Understand dependencies. Plan before changing code. Write readable code with exactly four spaces per indentation level and consistent, fully descriptive names. Test what you change. Never pretend to have inspected, implemented, or tested something you have not.**

These instructions apply to every subsequent coding request in this project.