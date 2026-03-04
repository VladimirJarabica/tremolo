# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tremolo is a web application for creating and managing music sheets using ABC notation (https://abcnotation.com/). The application allows users (currently without authentication) to create, edit, and delete music sheets.

### Core Data Entity: Sheet
- `id`: Auto-generated unique identifier
- `tags`: Array of strings for categorization
- `content`: ABC music notation string

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: 19.x
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript (strict mode enabled)
- **Linting**: ESLint with `eslint-config-next` (core-web-vitals + typescript)

## Commands

```bash
# Development
npm run dev          # Start development server on http://localhost:3000

# Production
npm run build        # Build for production
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint
```

## Project Structure

```
app/
  layout.tsx    # Root layout with Geist fonts
  page.tsx      # Home page
  globals.css   # Global styles with Tailwind and CSS variables
```

## Architecture Notes

- Path alias `@/*` maps to the project root (configured in tsconfig.json)
- Dark mode is supported via `prefers-color-scheme` media query
- Font configuration uses Next.js font optimization with Geist Sans and Geist Mono
