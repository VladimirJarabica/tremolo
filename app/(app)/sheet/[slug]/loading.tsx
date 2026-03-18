export default function SheetLoading(): React.JSX.Element {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto p-6">
        {/* Title skeleton */}
        <div className="mb-4 h-8 w-64 animate-pulse rounded bg-zinc-200" />

        {/* Sheet content skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200" />
        </div>

        {/* Tags skeleton */}
        <div className="mt-4 flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-zinc-200" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-zinc-200" />
          <div className="h-6 w-14 animate-pulse rounded-full bg-zinc-200" />
        </div>
      </div>

      {/* Editor skeleton */}
      <div className="sticky bottom-0 border-t border-zinc-200 bg-white/80 p-4">
        <div className="space-y-3">
          <div className="h-10 w-full animate-pulse rounded bg-zinc-200" />
          <div className="h-24 w-full animate-pulse rounded bg-zinc-200" />
        </div>
      </div>
    </div>
  );
}
