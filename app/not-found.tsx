import Link from "next/link";
import { Music4 } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound(): React.JSX.Element {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
      {/* Decorative blur glow, tinted with the emerald brand color. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
      />

      <div className="relative flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <Music4 className="size-7 text-primary" aria-hidden />
          <span className="font-mono text-sm tracking-widest text-muted-foreground uppercase">
            Tremolo
          </span>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* Large "404" with the emerald brand gradient. */}
          <p className="bg-brand-gradient bg-clip-text text-8xl font-bold tracking-tight text-transparent sm:text-9xl">
            404
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Page not found
          </h1>
          <p className="max-w-md text-balance text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or may have been
            moved. Let&apos;s get you back to your music.
          </p>
        </div>

        <Button asChild size="lg">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
