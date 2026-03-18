export default function ListLoading(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />
        <div className="flex gap-2">
          <div className="h-9 w-32 animate-pulse rounded bg-zinc-200" />
          <div className="h-9 w-9 animate-pulse rounded bg-zinc-200" />
        </div>
      </div>

      {/* List items skeleton */}
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4"
          >
            <div className="h-5 w-5 animate-pulse rounded bg-zinc-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-200" />
            </div>
            <div className="flex gap-1">
              <div className="h-8 w-8 animate-pulse rounded bg-zinc-200" />
              <div className="h-8 w-8 animate-pulse rounded bg-zinc-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
