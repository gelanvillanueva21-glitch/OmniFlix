# Systematically Refactor OmniFlix for Readability and Maintainability

You are working inside my existing OmniFlix repository. Your task is to **actively inspect, refactor, and improve the maintainability and readability of the existing codebase**.

This is an implementation task. Do not merely produce a review, recommendations, a checklist, or a plan and then stop. Inspect the code, identify concrete problems, implement appropriate fixes, and verify your changes.

The objective is not to make the code look sophisticated. The objective is to make it easier for a developer to understand, debug, modify, and extend.

## 1. Inspect the Existing Codebase First

Before editing:

1. Read the repository's applicable instructions, including `Claude.md`, `Gemini.md`, `OmniFlix.md`, `Model.md`, `SetUp.md`, `AGENTS.md`, and relevant README files when present.
2. Inspect the Git status and recent changes. Preserve existing user changes and do not overwrite unrelated work.
3. Identify the existing architectural conventions, folder structure, naming patterns, TypeScript configuration, lint rules, and testing tools.
4. Inspect the actual implementation rather than judging files solely by their length.
5. Trace important functions across their callers, dependencies, and consumers before changing their responsibilities.

Start with code that is difficult to understand, unnecessarily repetitive, overly complicated, tightly coupled, or difficult to test.

Do not assume that every long file is bad or that every short function needs to be extracted.

## 2. Enforce Readable Code

Apply these rules consistently to all code you modify.

### Naming

- Use descriptive names that explain the purpose of a variable, function, parameter, or type.
- Avoid ambiguous abbreviations such as `res`, `req`, `data`, `item`, `obj`, and `temp` when a more meaningful name is appropriate.
- Use four-space indentation.
- Follow existing TypeScript naming conventions.
- Prefer names that explain intent instead of requiring comments to decode them.

For example, prefer `entertainmentItems` over `items` when the context is not obvious, and `response` over `res` when that improves clarity.

Do not create excessively long names or repeat information already obvious from the surrounding scope.

### Functions

- Each function should have one clear responsibility.
- Extract a helper when it removes meaningful duplication or separates a distinct responsibility.
- Keep straightforward operations inline when extraction would make the code harder to follow.
- Avoid deeply nested conditionals and unnecessarily complicated control flow.
- Use early returns where they improve clarity.
- Avoid boolean flags and positional parameters when they make function calls ambiguous.
- Do not create a separate function for every single line of code.
- Do not introduce abstractions that make a simple operation require navigating through multiple files.

A reader should be able to understand the function's purpose, inputs, outputs, and important side effects without reconstructing the entire application.

### Types and interfaces

- Give data meaningful and accurate TypeScript types.
- Avoid `any`, unsafe type assertions, duplicated type definitions, and unnecessarily broad types.
- Reuse existing shared types where appropriate.
- Distinguish external API response types from normalized application models.
- Avoid defining the same contract in multiple places.
- Do not introduce generics or advanced type utilities unless they provide a real benefit.
- Do not suppress TypeScript errors just to make a check pass.

### Comments

- Write comments to explain why a decision exists, not to narrate what the code visibly does.
- Remove comments that merely repeat the code.
- Preserve important explanations about non-obvious behavior, external API constraints, security, or business rules.
- Do not replace understandable code with clever code that requires extensive comments.

### Error handling

- Handle errors at the appropriate architectural boundary.
- Do not silently swallow errors.
- Avoid repetitive `try/catch` blocks that add no useful behavior.
- Preserve useful error context without leaking secrets.
- Do not return fake success values to hide failures.
- Keep loading, empty, and failure states distinguishable when the UI needs to respond differently.

## 3. Eliminate Meaningful Duplication

Search for duplicated logic throughout the relevant code paths.

Look for:

- Repeated HTTP request handling.
- Repeated validation and data transformations.
- Repeated API response mapping.
- Repeated loading and error-state handling.
- Repeated conditional logic.
- Duplicated TypeScript types.
- Repeated configuration and hardcoded values.
- Unnecessary wrapper functions that add no meaningful behavior.

When duplication exists, identify the common responsibility and extract it into an appropriately named reusable function, module, or type.

Use the existing project architecture as the guide.

For example, if several provider clients independently implement the same URL construction, HTTP request, timeout, error handling, and JSON parsing, consolidate that common behavior into a shared request utility while keeping provider-specific endpoints and response types separate.

Do not consolidate unrelated behavior merely because the code looks similar.

**The goal is to eliminate duplicated responsibilities, not maximize code reuse at any cost.**

## 4. Preserve the Existing Architecture

Respect the current separation of responsibilities.

- React components should primarily handle rendering, composition, and user interaction.
- Shared utilities should contain genuinely reusable, non-UI logic.
- API clients should handle communication with their respective providers.
- Service modules should retain their established responsibilities.
- Shared types should describe stable contracts.
- Route handlers should remain focused on request handling, validation, and returning appropriate responses.
- Business logic should not be scattered across components when it belongs in a reusable layer.

Do not move code between layers without understanding why it belongs there.

Do not create new architectural layers, managers, factories, registries, hooks, providers, or base classes unless the existing code demonstrates a concrete need.

Do not introduce a design pattern just to make the code appear more professional.

## 5. Reduce Unnecessary Complexity

Identify code that is harder to maintain than its behavior warrants.

Examples include:

- Large components combining unrelated responsibilities.
- Functions with excessive branching.
- Overly generic utility functions that obscure their actual purpose.
- Unnecessary intermediate variables.
- Unnecessary state that can be derived from existing state.
- Repeated transformations of the same data.
- Redundant conditional expressions.
- Unnecessary prop drilling when the existing architecture already provides an appropriate solution.
- Overengineered error-handling abstractions.
- Dead code and genuinely unused imports.
- Dependencies that are unused or unnecessary, when removal is safe.

Simplify these areas while preserving their behavior.

Do not split every large component into many tiny components. A component should be extracted when it represents a meaningful UI responsibility or makes the parent substantially easier to understand.

Do not delete code merely because a search shows no direct references. Account for dynamic imports, route conventions, framework conventions, and other indirect usages.

## 6. Improve File and Module Organization

Keep related responsibilities together and unrelated responsibilities separate.

- Avoid giant utility files containing unrelated functionality.
- Avoid creating a new file for every trivial helper.
- Avoid circular dependencies.
- Avoid importing modules through unnecessarily complicated paths.
- Avoid duplicate sources of truth.
- Follow the repository's established directory and naming conventions.
- Reuse existing files when the responsibility already belongs there.

When moving code, update every affected import and verify that framework conventions remain intact.

Do not reorganize the entire repository just to achieve a preferred folder structure.

## 7. Security and Correctness Take Priority

Readability must never come at the expense of correctness or security.

Preserve:

- Authentication and authorization behavior.
- Cookie and session handling.
- API response contracts.
- Database compatibility.
- Environment-variable security.
- Input validation.
- Existing user-visible functionality.
- Responsive behavior and styling.
- External provider requirements and rate limits.

Never expose secrets through client-side environment variables or browser bundles.

Do not weaken validation, remove error handling, or change endpoint behavior to simplify the implementation.

Do not make unrelated UI redesigns, database migrations, dependency upgrades, or architectural rewrites.

## 8. Work Incrementally and Verify Each Change

Do not refactor the entire repository blindly in one pass.

Use this workflow:

1. Inspect a coherent group of related files.
2. Identify concrete readability or maintainability problems.
3. Understand the expected behavior and callers.
4. Implement a focused refactor.
5. Run the most relevant available checks.
6. Review the diff for unintended behavior changes.
7. Continue to the next group.

Prioritize high-impact problems over cosmetic changes.

Work through the relevant files systematically. Do not stop after producing an audit or fixing only one trivial issue if substantial, safe improvements remain within scope.

If the repository is too large to refactor safely in one session, complete a coherent group of changes, report what remains, and identify the next group precisely rather than pretending the entire codebase has been cleaned.

## 9. Mandatory Verification

After implementation:

- Run the available formatter or formatting check.
- Run linting.
- Run TypeScript type checking.
- Run relevant tests.
- Run a production build if the repository supports it and the environment permits.
- Inspect the final Git diff.
- Check for accidentally changed behavior, unrelated modifications, unused imports, and newly introduced duplication.

Do not install new dependencies simply to perform a check when an existing tool is sufficient.

If a check cannot run, explain why. Never claim a passing result without actually running it.

## 10. Restrictions

- Do not merely explain what should be changed. Implement the changes.
- Do not rewrite working code solely to match your personal style.
- Do not change public interfaces without checking all consumers.
- Do not introduce unnecessary abstractions or dependencies.
- Do not refactor unrelated functionality.
- Do not delete user changes.
- Do not hide TypeScript, lint, or test failures.
- Do not create additional documentation files just to describe obvious code changes.
- Do not modify the FastAPI backend, Prisma schema, or database migrations unless an existing correctness issue directly requires it and the change is explicitly within scope.
- Follow the project's existing instructions if they impose additional safeguards.

If repository instructions require explicit permission before editing, follow that requirement and request authorization before modifying files.

## 11. Definition of Done

The refactored code should be:

1. Easier to read from top to bottom.
2. More explicit about variable and function responsibilities.
3. Less repetitive without being overabstracted.
4. Properly typed.
5. Organized according to the existing architecture.
6. Easier to debug and extend.
7. Behaviorally compatible with the original implementation.
8. Verified through the available automated checks.

For every substantial change, be able to explain the original problem and why the new implementation is easier to maintain.

## Final Report

When finished, provide:

- The files changed, grouped by responsibility.
- The most important readability and maintainability problems found.
- The refactors performed and why they improve the code.
- Any duplication eliminated and abstractions introduced.
- The checks actually executed and their results.
- Any unresolved issues or code that still needs attention.

Keep the report concise and concrete. Do not claim that the entire codebase is clean simply because the lint command passes.

**Begin inspecting and implementing now, following the repository's permission rules. Prioritize understandable, maintainable code over cleverness, abstraction, or minimizing line count.**