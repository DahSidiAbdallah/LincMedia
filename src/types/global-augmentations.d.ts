// Global ambient type augmentations
// Split out from component files to avoid Turbopack parse instability.

// Ensure the 'inert' property is available (some TS lib versions may already include it)
interface HTMLElement { inert: boolean }
