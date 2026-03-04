# Code Style

Follow [Locality of Behaviour](https://htmx.org/essays/locality-of-behaviour/)
with functional programming principles.

## Core Principles

- Use `const` exclusively, avoid reassigning properties
- Minimize constants; define them close to usage, not at module top
- Prefer brief but descriptive names
- Comments explain _why_, not _what_; code should be self-documenting

## Branching

Keep logic flat with early returns and guard clauses:

```ts
// Avoid nested conditions
function process(user: User | null): Result {
  if (user !== null) {
    if (user.isActive) {
      if (user.hasPermission) {
        return doWork(user);
      }
    }
  }
  return defaultResult;
}

// Prefer flat early returns
function process(user: User | null): Result {
  if (user === null) {
    return defaultResult;
  }
  if (!user.isActive) {
    return defaultResult;
  }
  if (!user.hasPermission) {
    return defaultResult;
  }
  return doWork(user);
}
```

For inline conditionals, use IIFE:

```ts
const value = (() => {
  if (condition) return "a";
  if (other) return "b";
  return "default";
})();
```

## Type Safety

- Avoid enums, prefer type unions: `type Status = 'active' | 'inactive'`
- Use `satisfies` for type-checked constants
- Explicit null/undefined checks, not falsy: `if (x === null)` not `if (!x)`
- Use optional chaining: `items[0]?.name`
- Separate type imports: `import type { Foo } from './foo'`
- Non-null assertions allowed when compiler lacks context (e.g. polymorphic DB
  data where a field is always present for a specific type, or array access
  when length is guaranteed)

## Function Signatures

- 3+ arguments → use object parameter

## Imports

Group in order: external → types → `@/` absolute → relative

```ts
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getIntl } from "@/lib/intl";
import { Button } from "@/components/button";

import { helper } from "./utils";
```

Import React hooks and components directly: `import { Suspense, useState } from 'react'`

## Exports

Prefer specific file imports over barrel exports (index.ts re-exports):

```ts
// Good - import from specific file
import { getPublicUrl } from "@/be/storage/get-public-url";
import { createAsset } from "@/be/storage/create-asset";

// Avoid - barrel exports
import { getPublicUrl, createAsset } from "@/be/storage";
```

Barrel exports add indirection, slow down builds, and make it harder to trace dependencies.

## Iterators

Chain for data transformations:

```ts
const result = items
  .filter((x) => x.active)
  .map((x) => x.value)
  .reduce((a, b) => a + b, 0);
```

## Date Handling

Use `date-fns` for all date manipulation and formatting:

```ts
import { format, addDays, parseISO } from "date-fns";
import { sk } from "date-fns/locale";

// Formatting dates
format(date, "d. MMMM yyyy", { locale: sk }); // "15. január 2026"
format(date, "yyyy-MM-dd"); // "2026-01-15" (for inputs)

// Date manipulation
addDays(date, 1);
parseISO("2026-01-15");
```

**Do NOT use:**
- `date.toLocaleDateString()` - inconsistent across environments
- Custom date formatting functions
- Manual date string manipulation

## Database Conventions

### Tenant Database Tables

Every table in tenant databases MUST include:
- `tenant_id` column (text, not null) - for data isolation and integrity verification
- This applies to ALL tables, without exception
- The tenant_id should be indexed for query performance
