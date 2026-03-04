---
name: create-database-migration
description: Create and run database migrations. Use for schema changes with Prisma.
---

# Create Database Migration

The database uses **Prisma 7** (with `prisma.config.ts`) for schema definitions and migrations, with **Kysely** as the type-safe query client.

## Workflow

### 1. Edit the Prisma Schema

**Schema file:** `be/db/schema.prisma`

### 2. Run Migration

```bash
npm run db:migrate
```

This will:

1. Prompt for a migration name — use descriptive names like `add_memorial_table` or `add_visibility_to_memorial`
2. Generate SQL migration file in `be/db/migrations/`
3. Apply the migration to the database
4. Regenerate Kysely types via prisma-kysely

### 3. Verify

- Check generated types in `be/db/types.ts`
- Run `npx tsc --noEmit` to verify no TypeScript errors
- Update any code that uses the changed schema

## Project Schema Conventions

### UUID Primary Key

```prisma
id String @id @default(dbgenerated("gen_random_uuid()"))
```

### Timestamps (required on every model)

```prisma
createdAt DateTime @default(now())
updatedAt DateTime @default(now()) @updatedAt
```

### Enums over Booleans

Use enums for states with more than two possible values:

```prisma
enum MemorialVisibility {
  PUBLIC
  PRIVATE
}

model Memorial {
  visibility MemorialVisibility @default(PRIVATE)
}
```

### Relations

**One-to-Many** (e.g. Region has many Districts):

```prisma
model Region {
  id        String     @id @default(dbgenerated("gen_random_uuid()"))
  name      String     @unique
  districts District[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @default(now()) @updatedAt
}

model District {
  id       String @id @default(dbgenerated("gen_random_uuid()"))
  name     String @unique
  region   Region @relation(fields: [regionId], references: [id])
  regionId String
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt
}
```

**One-to-One** (e.g. Profile has one Memorial):

```prisma
model Profile {
  id       String    @id @default(dbgenerated("gen_random_uuid()"))
  urlSlug  String    @unique
  memorial Memorial?
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt
}

model Memorial {
  id        String  @id @default(dbgenerated("gen_random_uuid()"))
  profile   Profile @relation(fields: [profileId], references: [id])
  profileId String  @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt
}
```

**Many-to-Many (explicit join table)** (e.g. Users belong to Memorials with roles):

```prisma
model MemorialUser {
  id         String       @id @default(dbgenerated("gen_random_uuid()"))
  memorial   Memorial     @relation(fields: [memorialId], references: [id])
  memorialId String
  user       User         @relation(fields: [userId], references: [id])
  userId     String
  role       MemorialRole
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @default(now()) @updatedAt
}
```

### Named Relations (multiple relations to same model)

When a model has multiple relations to the same target, use named relations:

```prisma
model Parte {
  photo             Asset?  @relation(name: "PartePhoto", fields: [photoId], references: [id])
  photoId           String? @unique
  backgroundPhoto   Asset?  @relation(name: "ParteBackgroundPhoto", fields: [backgroundPhotoId], references: [id])
  backgroundPhotoId String? @unique
}
```

### Optional vs Required Fields

```prisma
// Required
firstName String

// Optional (nullable)
birthLastName String?
addressId     String?

// Array field
phones String[]
```

## Prisma Data Types

| Prisma Type          | PostgreSQL Type    | Example                           |
| -------------------- | ------------------ | --------------------------------- |
| `String`             | `text`             | `name String`                     |
| `String` with length | `varchar(n)`       | `code String @db.VarChar(10)`     |
| `Int`                | `integer`          | `count Int`                       |
| `Float`              | `double precision` | `amount Float`                    |
| `Decimal`            | `decimal(p,s)`     | `price Decimal @db.Decimal(16,2)` |
| `Boolean`            | `boolean`          | `isActive Boolean`                |
| `DateTime`           | `timestamp`        | `createdAt DateTime`              |
| `Json`               | `jsonb`            | `metadata Json`                   |
| `String[]`           | `text[]`           | `phones String[]`                 |

## Best Practices

1. **Always include timestamps** — Every model needs `createdAt` and `updatedAt`
2. **Use descriptive migration names** — e.g. `add_memorial_visibility`, `create_funeral_location`
3. **One logical change per migration** — Don't mix unrelated schema changes
4. **Use enums for finite states** — Not strings or booleans
5. **Format before migrating** — Run `npx prisma format --config prisma.config.ts`

## Troubleshooting

**Migration fails:**

- Check database connection (`DATABASE_URL` in `.env`)
- Verify Docker is running: `docker compose up -d`
- Check if migration conflicts with existing data

**Types not updated:**

- Migration commands automatically regenerate types
- Manually run `npm run db:generate`

## File Locations

| Purpose         | Location              |
| --------------- | --------------------- |
| Prisma Config   | `prisma.config.ts`    |
| Schema          | `be/db/schema.prisma` |
| Migrations      | `be/db/migrations/`   |
| Kysely Types    | `be/db/types.ts`      |
| Enums           | `be/db/enums.ts`      |
| DB Client       | `be/db/index.ts`      |
