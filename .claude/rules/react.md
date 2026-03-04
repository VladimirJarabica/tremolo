---
paths: app/**/*.tsx
---

# React Patterns

## Function Components

Use `function` declarations with explicit return types:

```tsx
export function Badge({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return <div>{children}</div>;
}

// Conditional return
export function ConditionalComponent(): React.JSX.Element | null {
  if (condition === null) {
    return null;
  }
  return <div />;
}

// Async server components
export default async function Layout({
  children,
}: LayoutProps): Promise<React.JSX.Element> {
  return <>{children}</>;
}
```

## Event Handlers

Use `handle` prefix for handler functions. React Aria uses `onPress` instead of `onClick`:

```tsx
function handleShare(): void {
  navigator.clipboard.writeText(globalThis.location.href);
}

// Native elements
<input onChange={(ev) => setValue(ev.target.value)} />

// React Aria components
<Button onPress={handleShare}>Share</Button>
```

## Fragments

Prefer shorthand `<>` over `React.Fragment`:

```tsx
// Good
<>
  <Header />
  <Content />
</>

// Avoid
<React.Fragment>
  <Header />
  <Content />
</React.Fragment>
```

## Keys in Lists

Use stable IDs. Index is acceptable for static arrays with ESLint disable:

```tsx
// Stable ID (preferred)
{
  items.map((item) => <div key={item.id}>{item.name}</div>);
}

// Index for static arrays
{
  staticItems.map((item, index) => (
    // eslint-disable-next-line react/no-array-index-key -- items are static
    <li key={index}>{item}</li>
  ));
}
```

## Conditional Rendering

Use early returns with explicit null checks:

```tsx
export function Component(): React.JSX.Element | null {
  if (data === null) {
    return null;
  }
  if (!user.isActive) {
    return null;
  }
  return <div>{data.name}</div>;
}

// Ternary for inline
{
  isPending ? <Spinner /> : null;
}

// Explicit check with &&
{
  description !== undefined && <Text>{description}</Text>;
}
```

## Children Prop

Always type as `React.ReactNode`:

```tsx
export function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

## forwardRef

Define forwarded component separately, then wrap:

```tsx
function InputTextForwarded(
  { label, ...rest }: Props,
  ref: React.ForwardedRef<HTMLInputElement>
): React.JSX.Element {
  return <Input {...rest} ref={ref} />;
}

const InputText = React.forwardRef(InputTextForwarded);
export default InputText;
```

## Context

Create with null default, access via custom hook with error:

```tsx
const FlowContext = createContext<Flow | null>(null);

export function useFlow(): Flow {
  const ctx = useContext(FlowContext);
  if (ctx === null) {
    throw new Error("useFlow must be used within FlowProvider");
  }
  return ctx;
}

export function FlowProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const value = useMemo(
    () => ({
      /* ... */
    }),
    []
  );
  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}
```

## Suspense

Use explicit fallback components:

```tsx
<Suspense fallback={<TabbarLoader />}>
  <Tabbar />
</Suspense>

// Multiple boundaries
<Suspense fallback={<BreadcrumbsLoader />}>
  <Breadcrumbs />
</Suspense>
<Suspense fallback={<ContentLoader />}>
  <Content />
</Suspense>
```

## Hook Return Tuples

Return tuples with consistent ordering:

```tsx
// [trigger, props]
function useDialogState(): [
  () => void,
  { isOpen: boolean; onOpenChange: (isOpen: boolean) => void }
] {
  const [isOpen, setIsOpen] = useState(false);
  return [() => setIsOpen(true), { isOpen, onOpenChange: setIsOpen }];
}

// [state, action, isPending]
function useActionSuccess<T>(
  action: (state: unknown, arg: T) => Promise<{ success?: boolean }>,
  cb: (state: { success: boolean }) => void
): [{ success?: boolean }, (arg: T) => void, boolean] {
  const [state, formAction, isPending] = useActionState(action, {});
  useEffect(() => {
    if (typeof state.success === "boolean") {
      cb({ success: state.success });
    }
  }, [state, cb]);
  return [state, formAction, isPending];
}
```

## useCallback/useMemo

Prefer inline functions.

```tsx
// Inline (preferred)
function handleShare(): void {
  navigator.clipboard.writeText(globalThis.location.href);
}
```
