export default function SheetLoading(): React.JSX.Element {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-6">
        {/* Title skeleton */}
        <div className="mb-4 h-8 w-64 animate-pulse rounded bg-muted" />

        {/* Sheet content skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        </div>
      </div>

      {/* Editor skeleton */}
      <div className="sticky bottom-0 border-t border-border bg-card/80 p-4">
        <div className="space-y-3">
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="h-24 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
