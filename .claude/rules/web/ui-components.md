---
paths: app/**/*.{ts,tsx}
---

# Building UI Components

Two component types: **design system** (generic primitives from shadcn) and **feature** (domain-specific).

## Structure

```
component-name/
  index.ts                    # Barrel export
  component-name.tsx          # Main component
  sub-component.tsx           # Optional private sub-components
  lib/                        # Optional private hooks/utilities
```

## Universal Conventions

**Naming:**

- Files: kebab-case (`button-link.tsx`)
- Components: PascalCase (`ButtonLink`)

**Exports:**

```tsx
// Named exports only
export function MyComponent({ title }: { title: string }): React.JSX.Element {
  return <h1>{title}</h1>;
}
```

**Component composition over primitives:**

```tsx
// Bad - string props
export function Hero({
  title,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div>
      <h1>{title}</h1>
      <a href={ctaHref}>{ctaLabel}</a>
    </div>
  );
}

// Good - ReactNode for composition
export function Hero({ title, cta }: { title: string; cta: React.ReactNode }) {
  return (
    <div>
      <h1>{title}</h1>
      {cta}
    </div>
  );
}
```

**Barrel exports:**

```ts
// index.ts - expose only public API
export * from "./component-name";
```

## Design System Components

Located in `app/components/ui/`. Use **shadcn.com** components.

**Installation:**

```bash
npx shadcn@latest add button
npx shadcn@latest add card
# etc.
```

**Usage:**

```tsx
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
        <CardDescription>Get started with shadcn components</CardDescription>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

**Customization:**

Shadcn components are copied into your codebase and can be modified. The CLI will also create a `lib/utils.ts` file with the `cn()` utility for merging class names:

```tsx
// lib/utils.ts (created by shadcn CLI)
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// app/components/ui/button.tsx (example shadcn component)
import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "default",
  ...props
}: {
  className?: string;
  variant?: "default" | "destructive" | "outline";
  children: React.ReactNode;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md",
        variant === "default" && "bg-zinc-900 text-white",
        variant === "destructive" && "bg-red-500 text-white",
        variant === "outline" && "border border-zinc-300",
        className
      )}
      {...props}
    />
  );
}
```

**Server by default:**

Shadcn components are server components by default unless they need interactivity.

## Feature Components

Located in `app/` by feature (workers/, companies/, projects/, etc.).

**Server components by default:**

```tsx
import type { WorkerDTO } from "@/be/tenant/worker/types";

export function WorkerCard({
  worker,
}: {
  worker: WorkerDTO;
}): React.JSX.Element {
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <h2 className="font-semibold">
        {worker.firstname} {worker.lastname}
      </h2>
      <p className="text-sm text-zinc-500">{worker.email}</p>
    </div>
  );
}
```

**Accept data as props** - don't fetch inside component:

```tsx
// Bad
export async function WorkerCard({ id }: { id: string }) {
  const worker = await getWorker(id);
  return <div>{worker.name}</div>;
}

// Good - separate data fetching
export function WorkerCard({ worker }: { worker: WorkerDTO }) {
  return (
    <div>
      {worker.firstname} {worker.lastname}
    </div>
  );
}

// Fetch in page/layout
export default async function WorkersPage() {
  const workers = await getAllWorkers();
  return (
    <div>
      {workers.map((worker) => (
        <WorkerCard key={worker.id} worker={worker} />
      ))}
    </div>
  );
}
```

**Client interactivity with "use client":**

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function WorkerForm({
  onSubmit,
}: {
  onSubmit: (data: FormData) => Promise<void>;
}): React.JSX.Element {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await onSubmit(formData);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="firstname" required />
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
```

**Server Actions integration:**

```tsx
// app/workers/actions.ts
"use server";
import { createWorker } from "@/be/tenant/worker/createWorker";

export async function createWorkerAction(formData: FormData) {
  const firstname = formData.get("firstname") as string;
  // ... validation and creation
  await createWorker(db, { firstname /* ... */ });
}

// app/workers/page.tsx
import { WorkerForm } from "./WorkerForm";
import { createWorkerAction } from "./actions";

export default function WorkersPage() {
  return <WorkerForm onSubmit={createWorkerAction} />;
}
```

## Styling

Use Tailwind inline for most styles. For conditional classes, use the `cn()` utility from `lib/utils.ts` (created by shadcn):

```tsx
import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "destructive";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        variant === "default" && "bg-zinc-100 text-zinc-800",
        variant === "success" && "bg-green-100 text-green-800",
        variant === "destructive" && "bg-red-100 text-red-800"
      )}
    >
      {children}
    </span>
  );
}
```

**Tailwind color palette:**

- `zinc-*` - Neutral UI colors
- `red-*` - Destructive/error states
- `green-*` - Success states
- `blue-*` - Primary actions

## Pass-through Props

Use spread rest for forwarding props:

```tsx
import Link from "next/link";
import { cn } from "@/lib/utils";

export function NavLink({
  children,
  active,
  ...rest
}: {
  children: React.ReactNode;
  active?: boolean;
  href: string;
}): React.JSX.Element {
  return (
    <Link
      className={cn("px-4 py-2 rounded-md", active && "bg-zinc-100")}
      {...rest}
    >
      {children}
    </Link>
  );
}
```

## Internal Helpers

Keep private sub-components in the same file, unexported, below the export:

```tsx
export function CompanyCard({
  company,
}: {
  company: CompanyDTO;
}): React.JSX.Element {
  return (
    <div className="rounded-lg border">
      <CompanyHeader>{company.name}</CompanyHeader>
      <CompanyBody>
        <p>{company.address}</p>
      </CompanyBody>
    </div>
  );
}

function CompanyHeader({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <header className="border-b p-4 font-semibold">{children}</header>;
}

function CompanyBody({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <div className="p-4 text-sm text-zinc-500">{children}</div>;
}
```
