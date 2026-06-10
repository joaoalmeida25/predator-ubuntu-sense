# AGENTS.md

Guidance for coding assistants working in this repository.

## Project overview

Predator Ubuntu Sense is an unofficial Linux control center for Acer Predator laptops. It is a modular monorepo with Rust system-integration crates and a Tauri + React desktop app.

Primary runtime boundary:

```text
React UI -> Tauri commands -> predatorctl -> predator-core -> Linux interfaces
                                      |
                                      └-> predator-helper for privileged writes
```

The React frontend is not a hardware-control layer. Keep hardware rules and privileged operations out of React.

## Monorepo structure

```text
crates/
├── predator-core       # Shared domain logic and Linux adapters
├── predatorctl         # CLI used by users and Tauri commands
└── predator-helper     # Privileged helper for protected writes

apps/
└── desktop             # Tauri + React desktop application
```

Important desktop paths:

```text
apps/desktop/src/
├── app/
├── features/
├── shared/services/
├── shared/styles/
└── shared/types/

apps/desktop/src-tauri/src/
├── commands/
├── lib.rs
└── main.rs
```

## React architecture rules

Use feature folders and keep responsibilities separated:

- Controller/component: orchestrates a feature, calls hooks, passes props to views, does not call Tauri `invoke` directly.
- View: render-only, receives all data and callbacks through typed props, does not call hooks, services, or Tauri.
- Hook: owns React state, async state transitions, loading/success/error handling, and refresh/reload functions.
- Service: external integration only, calls Tauri `invoke`, does not know React or components.

Preferred folder shape for a feature:

```text
features/example/
├── components/
│   ├── example.component.tsx
│   ├── example-view.component.tsx
│   ├── example-view.types.ts
│   └── example-view.module.css
└── hooks/
    ├── use-example.hook.ts
    └── use-example.types.ts
```

Shared integration services belong under `apps/desktop/src/shared/services`.

## TypeScript and React style

- Do not use default exports in repository-owned frontend code.
- Use named exports for components, hooks, services, types, and utilities.
- Use arrow functions for components, hooks, services, and handlers.
- Do not use `React.FC` as the default component style.
- Components should return `ReactElement` when applicable.
- Import React types with `import type`.
- Props must always be explicitly typed.
- Avoid `any`; use `unknown` plus narrowing when needed.
- Services must declare explicit return types, for example `Promise<string>`.
- Hooks must declare explicit return types.
- Use the shared `AsyncState<TData>` type for async UI state.

Example:

```tsx
import type { ReactElement } from "react";

export const Dashboard = (): ReactElement => {
  return <DashboardView />;
};
```

## Styling rules

- Use CSS Modules for feature-specific and component-specific styles.
- Do not add `styled-components`.
- Keep `shared/styles/global.css` limited to reset/base styles, design tokens, `body`, `:root`, and universal selectors.
- Do not put feature-specific classes such as dashboard cards or grids in global CSS.

## Desktop shell and visual placeholders

- The desktop app uses an internal React app shell with sidebar/header state instead of React Router.
- Keep page navigation local to the shell until routing is explicitly required.
- The Dashboard AI Core is a CSS/SVG placeholder component prepared for a future WebGL implementation.
- Do not replace the AI Core placeholder with Three.js or React Three Fiber until that integration is requested.

## Tauri and Rust boundaries

- React must not call `sysfs`, `pkexec`, `sudo`, shell scripts, or privileged commands directly.
- React services call Tauri `invoke` only.
- Tauri commands call `predatorctl` for system data and actions.
- `predatorctl` delegates privileged writes to `predator-helper`.
- Privileged operations must remain centralized in `predator-helper`.
- Do not alter hardware/runtime logic unless the task explicitly asks for it.
- Preserve existing Tauri command names unless a coordinated migration is required.

Current dashboard command contracts:

```text
get_system_status
get_driver_status
```

## Change discipline

- Do not add new libraries unless there is a concrete need.
- Do not add routing until a task requires it.
- Do not implement Performance, RGB, or other new UI screens as part of refactor-only tasks.
- Do not change install scripts or packaging behavior unless requested.
- Preserve the current dashboard behavior when refactoring.
- Keep commits focused by architectural area or feature when possible.

## Required validation before finishing

Run these commands before handing work back when the change touches relevant areas:

```bash
cargo fmt
cargo check

cd apps/desktop
pnpm build
pnpm tauri dev
```

If `pnpm tauri dev` is interactive or cannot be kept running in the current environment, start it long enough to verify compilation and report exactly what happened.
