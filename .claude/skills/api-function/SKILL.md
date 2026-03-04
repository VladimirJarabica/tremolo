---
name: api-function
description: Use when creating a new backend function, server action, or e2e API operation (mutation or query). Covers the BE → action → FE wiring pattern with auth guards, Zod validation, and ApiResponse types.
---

# API Function

Use this skill when creating any new API operation (create, update, delete, or read).

## Architecture

```
FE Component → Server Action → BE Function → ApiResponse<T>
                    ↑               ↑
              handleGuardedApi   Auth Guards
                                Zod validation
```

## File Structure

For a feature called `archiveMemorial`:

```
be/
  memorial/
    validation-schema.ts      # Add Zod schema + input type
    archive-memorial.ts       # BE function (NEW)

app/
  admin/
    memorials/
      actions/
        archive-memorial.ts   # Server action (NEW)
```

**Naming:** kebab-case files, verb-first: `create-x.ts`, `update-x.ts`, `delete-x.ts`, `get-x.ts`

## Step-by-Step

### 1. Validation Schema (`be/**/validation-schema.ts`)

Add to existing entity's `validation-schema.ts`, or create one if it's a new entity:

```typescript
import { z } from "zod";

export const archiveMemorialSchema = z.object({
  memorialId: z.string().min(1, "ID je povinné"),
});

export type ArchiveMemorialInput = z.infer<typeof archiveMemorialSchema>;
```

### 2. Error Codes (`be/response.ts`)

Add specific error codes to the `ApiErrorCode` enum:

```typescript
MEMORIAL_NOT_FOUND = "MEMORIAL_NOT_FOUND",
FAILED_TO_ARCHIVE_MEMORIAL = "FAILED_TO_ARCHIVE_MEMORIAL",
```

**Convention:** `ENTITY_NOT_FOUND` for lookups, `FAILED_TO_<ACTION>_<ENTITY>` for operation failures.

### 3. BE Function (`be/**/archive-memorial.ts`)

```typescript
import { db } from "@/be/db";
import { requireAdmin } from "@/be/auth/guards";
import {
  archiveMemorialSchema,
  type ArchiveMemorialInput,
} from "./validation-schema";
import {
  apiError,
  ApiErrorCode,
  apiSuccess,
  type ApiResponse,
  type ApiResponseData,
} from "@/be/response";
import { createAuditLog } from "@/be/audit-log/create-audit-log";
import { AuditLogEntityType, AuditLogAction } from "@/be/db/enums";

export async function archiveMemorial(
  input: ArchiveMemorialInput,
): Promise<ApiResponse<{ id: string }>> {
  const { user } = await requireAdmin();

  const parsed = archiveMemorialSchema.safeParse(input);
  if (!parsed.success) {
    return apiError(ApiErrorCode.INVALID_INPUT, parsed.error);
  }

  try {
    const memorial = await db
      .updateTable("Memorial")
      .set({ archivedAt: new Date() })
      .where("id", "=", parsed.data.memorialId)
      .where("deletedAt", "is", null)
      .returning(["id"])
      .executeTakeFirst();

    if (!memorial) {
      return apiError(ApiErrorCode.MEMORIAL_NOT_FOUND);
    }

    await createAuditLog({
      userId: user.id,
      entityType: AuditLogEntityType.MEMORIAL,
      entityId: memorial.id,
      action: AuditLogAction.UPDATE,
    });

    return apiSuccess({ id: memorial.id });
  } catch {
    return apiError(ApiErrorCode.FAILED_TO_ARCHIVE_MEMORIAL);
  }
}

export type ArchiveMemorialData = ApiResponseData<typeof archiveMemorial>;
```

Export `ApiResponseData<typeof fn>` at the end of every BE function file. This extracts the success data type for use in components and other layers.

**Pattern:**

1. Auth guard first (throws `AuthError` on failure)
2. `safeParse()` → return `apiError(INVALID_INPUT, parsed.error)` on failure
3. DB operation in try/catch
4. Return `apiSuccess(data)` or `apiError(code)`
5. Audit log after successful operations

### 4. Server Action (`app/**/actions/archive-memorial.ts`)

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { archiveMemorial as archiveMemorialBE } from "@/be/memorial/archive-memorial";
import type { ArchiveMemorialInput } from "@/be/memorial/validation-schema";
import { handleGuardedApi } from "@/app/utils/handle-guarded-api";

export async function archiveMemorial(input: ArchiveMemorialInput) {
  const result = await handleGuardedApi(() => archiveMemorialBE(input));
  if (result.success) {
    revalidatePath("/admin/memorials");
  }
  return result;
}
```

**Actions are always thin:** wrap BE in `handleGuardedApi()`, revalidate on success, return result.

### 5. FE Usage

**Client component (button/dialog):**

```typescript
const result = await archiveMemorial({ memorialId });
if (result.success) {
  // Close dialog, redirect, etc.
}
```

**Server component (data fetching):**

```typescript
export default async function Page() {
  const result = await getMemorials();
  if (!result.success) return <div>Error</div>;
  return <MemorialList memorials={result.data} />;
}
```

## Auth Guards Reference

| Guard                              | Use when                                     |
| ---------------------------------- | -------------------------------------------- |
| `requireAdmin()`                   | Admin-only operations                        |
| `getUserContext()`                 | Any authenticated user                       |
| `requireMemorialContributor(id)`   | Memorial member (admin or contributor)       |
| `requireMemorialAdministrator(id)` | Memorial admin only                          |
| `requireFuneralServiceAccess(id)`  | Funeral service admin or system admin        |
| No guard                           | Public operations (condolences, parte views) |

All guards return `{ user }` and throw `AuthError` on failure.

## Read Functions (Queries)

Read functions follow the same pattern — always go through a server action:

- BE function with auth guard → query → `apiSuccess(data)` / `apiError(code)`
- Server action wraps with `handleGuardedApi()`
- FE calls the action, checks `result.success`
- For paginated results, use `paginatedApiSuccess()` instead of `apiSuccess()`

## Common Mistakes

| Mistake                                       | Fix                                                            |
| --------------------------------------------- | -------------------------------------------------------------- |
| Calling BE functions directly from components | Always go through server actions                               |
| Skipping `handleGuardedApi` in actions        | Auth errors won't be caught properly                           |
| Returning raw data instead of `ApiResponse`   | Always use `apiSuccess()`/`apiError()`/`paginatedApiSuccess()` |
| Using `parse()` instead of `safeParse()`      | `parse()` throws — use `safeParse()` and return error          |
| Forgetting `revalidatePath` after mutations   | Stale data in UI                                               |
| Skipping server action for reads              | All operations (reads included) go through actions             |

## Checklist

- [ ] Zod schema in `validation-schema.ts` with exported type
- [ ] Error codes added to `ApiErrorCode` in `be/response.ts`
- [ ] BE function with auth guard → `safeParse()` → DB operation → `apiSuccess`/`apiError`/`paginatedApiSuccess`
- [ ] Audit log for mutations
- [ ] Server action with `"use server"`, `handleGuardedApi()`, `revalidatePath()`
- [ ] FE wiring: action call → check `result.success`
- [ ] Run `npm run lint && npx tsc --noEmit`
