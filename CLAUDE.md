# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tremolo is a web application for creating and managing music sheets using ABC notation (https://abcnotation.com/). The application allows users (currently without authentication) to create, edit, and delete music sheets.

### Core Data Entities
- **Sheet**: `id`, `content` (ABC notation string), `tags` (many-to-many via Tag)
- **Tag**: `id`, `name` (unique)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: 19.x
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript (strict mode enabled)
- **Database**: PostgreSQL with Prisma 7 (schema/migrations) + Kysely (query builder)
- **Validation**: Zod
- **Linting**: ESLint with `eslint-config-next`

## Commands

```bash
# Development
npm run dev              # Start development server on http://localhost:3000
npm run docker:up        # Start PostgreSQL container

# Database
npm run db:generate      # Generate Prisma client and Kysely types
npm run db:migrate       # Create and run migration
npm run db:format        # Format Prisma schema

# Production
npm run build            # Build for production
npm run start            # Start production server

# Quality
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript check
```

## Architecture

```
FE Component → Server Action → BE Function → ApiResponse<T>
                    ↑
              handleGuardedApi
```

- **BE functions** (`be/*/`): Contain business logic, Zod validation, DB operations
- **Server actions** (`app/actions/`): Thin wrappers with `"use server"`, handle revalidation
- **All operations return `ApiResponse<T>`**: `{ success: true, data } | { success: false, error }`

## Project Structure

```
be/
  db/
    schema.prisma      # Prisma schema
    types.ts           # Generated Kysely types
    index.ts           # Kysely client
  sheet/               # Sheet entity BE functions
    validation-schema.ts
    create-sheet.ts
    get-sheet.ts
    update-sheet.ts
    delete-sheet.ts
  response.ts          # ApiResponse types and helpers

app/
  actions/             # Server actions
  utils/
    handle-guarded-api.ts
```

## Database Conventions

- UUID primary keys via `gen_random_uuid()`
- All models have `createdAt` and `updatedAt` timestamps
- Many-to-many relations use Prisma implicit join tables (`_SheetToTag`)

## Adding New API Functions

See `.claude/skills/api-function/SKILL.md` for the complete pattern.
