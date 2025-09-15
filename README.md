# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Social links behavior

Social icon buttons (header & footer) now try to open the native app when available
(best-effort) and otherwise open the external website in a new tab. This improves
UX on mobile devices while preserving a safe web fallback. If you need to add
or tweak app-specific deep links, update `src/lib/openExternal.ts`.
