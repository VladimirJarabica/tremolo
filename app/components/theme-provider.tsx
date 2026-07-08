"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Wraps `next-themes` with the project defaults.
 *
 * - `attribute="class"` toggles the `.dark` selector already defined in
 *   `globals.css` (no custom attribute needed).
 * - `defaultTheme="system"` + `enableSystem` follows the OS preference until
 *   the user picks explicitly; the choice persists to localStorage.
 * - `disableTransitionOnChange` avoids the color-fade flash on toggle.
 *
 * `suppressHydrationWarning` must be set on `<html>` (see `app/layout.tsx`)
 * because next-themes injects a script that sets the class before hydration.
 */
export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
