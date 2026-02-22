# AGENTS.md

Guidelines for AI coding agents working in this repository.

## Project Overview

Troney is a personal finance app built with React 19, TypeScript, Convex (serverless backend), TanStack Router (file-based routing), and Tailwind CSS 3. Uses Bun as package manager. ESM-only (`"type": "module"`).

## General guidelines

- Be extremely concise; sacrifice grammar for concision
- When adding new features, update AGENTS.md with relevant information and update the README.md ToDo list

### Planning

- Numerate each step for easy reference
- End plans with lettered list of unresolved questions (if any)
- When asked to execute specific step, only execute that step

## Build / Lint / Format Commands

```bash
bun run build          # Type-check (tsc -b) then Vite build
bun run lint           # ESLint (flat config, ESLint 9+)
bun run format         # Prettier --write
bun run dev            # Vite dev server
bun run storybook      # Storybook on port 6006
bun run build-storybook
```

### Tests

No test framework is configured yet. There is no `test` script, no test files, and no test dependencies.

## Project Structure

```
src/
  components/
    auth/                  # Auth feature components
    brand/                 # Logo and branding
    icons/                 # Icon components
    ui/                    # Reusable UI library (each in its own folder)
      button/              # button.tsx + button.stories.tsx
      input/               # input.tsx + input.stories.tsx
      ...
  contexts/                # React Context providers
  hooks/                   # Custom hooks
  lib/
    utils.ts               # cn() helper, currency formatter
  routes/                  # TanStack Router file-based routes
    __root.tsx
    auth/
  env.ts                   # Type-safe env vars (@t3-oss/env-core + Zod)
  main.tsx                 # App entry point
  routeTree.gen.ts         # Auto-generated (do not edit)
convex/
  _generated/              # Auto-generated (do not edit)
  schema.ts                # Database schema
  auth.ts, auth.config.ts  # Auth setup
  http.ts                  # HTTP router
  users.ts                 # User queries
```

## Convex Schema

### Auth tables (from `@convex-dev/auth`)

`users`, `authAccounts`, `authSessions`, `authRefreshTokens`, `authVerificationCodes`, `authVerifiers`, `authRateLimits` — managed by the auth library, do not modify directly.

### `categories`

Expense categories, scoped per user.

| Field    | Type                     | Notes                                     |
| -------- | ------------------------ | ----------------------------------------- |
| `userId` | `v.id("users")`          | Owner reference                           |
| `name`   | `v.string()`             | Category name                             |
| `color`  | `v.string()`             | Hex color (default `#3b82f6` in mutation) |
| `icon`   | `v.optional(v.string())` | Optional icon identifier                  |

**Indexes:** `by_userId` on `["userId"]`

**Notes:** `_id` and `_creationTime` are auto-provided by Convex. No `updatedAt`. Default `color` is applied at mutation level, not schema level.

## TypeScript Configuration

- **Strict mode** enabled with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- **`verbatimModuleSyntax: true`** — use `import type` for type-only imports (enforced by compiler)
- Target: ES2022, module: ESNext, moduleResolution: bundler
- No path aliases — use relative imports only

## Code Style

### Formatting (Prettier defaults)

- Double quotes, semicolons, trailing commas (ES5 positions)
- 2-space indentation, 80-char print width
- Tailwind class auto-sorting via `prettier-plugin-tailwindcss`
- Always run `bun run format` before committing

### File Naming

- **kebab-case** for all files: `login-form.tsx`, `use-keyboard-shortcuts.ts`, `balance-visibility-context.tsx`
- UI components go in `src/components/ui/{name}/{name}.tsx`
- Stories go alongside components: `{name}.stories.tsx`

### Component Conventions

- Use **function declarations** (not arrow functions) for components:
  ```tsx
  export function Alert({ type, message }: AlertProps) { ... }
  ```
- **Named exports only** — no default exports (exception: Storybook meta requires default export)
- Props type: use `interface Props` (local) or `export interface {Name}Props` (exported)
- Use `cn()` from `src/lib/utils` for conditional/merged Tailwind classes
- Use `useId()` for form element IDs (accessibility)
- Use `createPortal` for modals/overlays

### Route Components (TanStack Router)

```tsx
export const Route = createFileRoute("/path/")({ component: RouteComponent });

function RouteComponent() { ... }
```

`RouteComponent` is a private function, not exported. `routeTree.gen.ts` is auto-generated — never edit it.

### Type Conventions

- **`interface`** for object shapes, **`type`** for unions and intersections
- Union types for variants: `type Variant = "primary" | "outline" | "danger"`
- Discriminated unions for polymorphic props (e.g., button vs link)
- Use `React.ComponentProps<"element">` to extend HTML element props
- Use `React.ComponentType<IconBaseProps>` (from `react-icons`) for icon props
- Use `satisfies` in story files: `} satisfies Meta<typeof Component>`
- No `any` — strict types throughout. No `@ts-ignore`

### Import Style

- `import type` for type-only imports (required by `verbatimModuleSyntax`)
  ```ts
  import type { Meta, StoryObj } from "@storybook/react-vite";
  import type React from "react";
  ```
- External packages first, then internal modules (no blank line between groups)
- Relative paths for all internal imports — no path aliases
- Direct file imports, not barrel re-exports: `../ui/alert/alert` not `../ui/alert`

### Error Handling

- Context hooks must throw when used outside their provider:
  ```ts
  if (!context) {
    throw new Error("useX must be used within XProvider");
  }
  ```
- Form validation: pass `error` prop (string | string[]) to input components
- Use `aria-invalid` and `aria-describedby` on invalid form fields
- Use the `Alert` component for form-level success/error messages
- Loading states: `loading` prop on Button (disables + shows wait cursor)

### Accessibility

- ARIA attributes on all interactive elements: `aria-label`, `aria-invalid`, `aria-describedby`, `aria-modal`, `role`
- Keyboard navigation: `useKeyboardShortcuts` hook, vim-style keys for tables (j/k, arrows)
- Skip keyboard shortcuts when focused on input/textarea/select (except Escape)
- Skip shortcuts when modifier keys (Ctrl/Alt/Meta/Shift) are held

### Styling

- **Tailwind CSS only** — no CSS modules, styled-components, or inline styles
- Dark theme only — all components use the dark palette
- Custom colors in `tailwind.config.js`:
  - `primary-1` (#2dd4bf) — teal, main accent
  - `primary-2` (#4cedd9) — light teal, hover states
  - `secondary-1` (#0f172a) — dark navy, backgrounds
  - `secondary-2` (#1e293b) — slightly lighter bg
  - `secondary-3` (#334155) — borders, subtle elements
  - `secondary-4` (#94a3b8) — muted text

### State Management

- React built-ins only: `useState`, `useContext`, `useCallback`, `useMemo`, `useEffect`, `useRef`
- Context API for cross-cutting state (e.g., balance visibility)
- `localStorage` for persisting preferences
- No external state libraries (no Redux, Zustand, Jotai, etc.)

### Storybook

- Stories live alongside components in the same folder
- Pattern: `{name}.stories.tsx`
- Use `satisfies Meta<typeof Component>` for the default export
- Use `StoryObj<typeof meta>` for individual stories

## Auto-Generated Files (Do Not Edit)

- `src/routeTree.gen.ts` — TanStack Router route tree
- `convex/_generated/` — Convex API types and server utilities
