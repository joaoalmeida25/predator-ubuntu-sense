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

The React frontend is not a hardware-control layer. Keep hardware rules, Linux integration details, sysfs access, shell execution, and privileged operations out of React.

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
├── app/                # App shell, shell state, app-level layout components
├── assets/             # Global frontend assets shared by app/features
├── features/           # Feature folders
├── shared/             # Shared components, services, styles, types, utils
└── main.tsx

apps/desktop/src-tauri/src/
├── commands/
├── lib.rs
└── main.rs
```

## Frontend asset rules

Global UI assets must live under `apps/desktop/src/assets`, not under `shared/assets`.

Use this structure:

```text
apps/desktop/src/assets/
├── brand/
│   └── predator-ubuntu-mark.svg
├── device/
│   ├── predator-laptop.webp
│   ├── predator-laptop-thumb.webp
│   └── thermal-underside.webp
└── icons/
    ├── navigation/
    └── performance-profiles/
```

Rules:

- Use WebP for heavy generated visual assets such as notebook and thermal renders when transparency works correctly.
- Use SVG for brand marks, UI icons, navigation icons, and profile icons.
- Do not commit official Acer/Predator artwork or proprietary logos.
- Do not keep duplicate asset trees under `shared/assets`.
- Import global assets from `src/assets/...`.
- Keep feature-specific assets inside the feature only when the asset is truly not reused anywhere else.

## React architecture rules

Use feature folders and keep responsibilities separated for all non-trivial components, hooks, services, contexts, and utilities.

Responsibility split:

- Controller/component: orchestrates a feature or component, calls hooks, derives callbacks, passes props to views, does not call Tauri `invoke` directly.
- View: render-only, receives all data and callbacks through typed props, does not call hooks, services, context providers, or Tauri.
- Hook: owns React state, async state transitions, loading/success/error handling, and refresh/reload functions.
- Service: external integration only, calls Tauri `invoke`, does not know React or components.
- Context: owns provider wiring and state distribution only; keep business/data loading in hooks or services.

Required folder shape for a feature:

```text
features/example/
├── components/
│   └── example/
│       ├── example.component.tsx           # controller/orchestration
│       ├── example-view.component.tsx      # render-only view
│       ├── example-view.types.ts           # view props and local view types
│       └── example.module.css              # component CSS module
├── hooks/
│   └── use-example/
│       ├── use-example.hook.ts
│       └── use-example.types.ts
├── services/
│   └── example-action/
│       ├── example-action.service.ts
│       └── example-action.types.ts         # only when needed
├── mocks/
│   └── example.mock.ts
└── types/
    └── example.type.ts
```

A feature component folder may contain additional local subcomponents only if each follows the same controller/view split when it has logic, state, derived rendering, or non-trivial props.

Pure, tiny static components may be view-only, but prefer the full split whenever the component is part of a page, card, shell, or reusable UI area.

## App shell structure

The `app` directory must also follow folder-per-component organization. App shell components are not feature screens, but they still follow controller/view separation when they contain behavior or meaningful props.

Expected app shell shape:

```text
apps/desktop/src/app/
├── app.component.tsx
├── app.types.ts
├── app-navigation.config.ts
└── components/
    ├── app-layout/
    │   ├── app-layout.component.tsx
    │   ├── app-layout-view.component.tsx
    │   ├── app-layout-view.types.ts
    │   └── app-layout.module.css
    ├── app-header/
    │   ├── app-header.component.tsx
    │   ├── app-header-view.component.tsx
    │   ├── app-header-view.types.ts
    │   └── app-header.module.css
    └── app-sidebar/
        ├── app-sidebar.component.tsx
        ├── app-sidebar-view.component.tsx
        ├── app-sidebar-view.types.ts
        └── app-sidebar.module.css
```

Rules:

- `app.component.tsx` owns app-level active page state until routing is explicitly introduced.
- `app-layout.component.tsx` should orchestrate layout-level props only.
- `app-header-view.component.tsx` and `app-sidebar-view.component.tsx` must be render-only.
- Do not introduce React Router until explicitly requested.
- Future sidebar entries must remain disabled with a subtle `Soon` status until the feature is implemented.

## Component naming and file naming

Use these suffixes consistently:

```text
*.component.tsx        # controller/orchestrator component
*-view.component.tsx   # render-only component
*-view.types.ts        # props for the view
*.hook.ts              # hook implementation
*.service.ts           # service implementation
*.type.ts              # shared/domain-like type definitions
*.types.ts             # grouped local types when multiple are needed
*.mock.ts              # mock data
*.module.css           # CSS Module
```

Use kebab-case for file and folder names:

```text
app-header.component.tsx
use-dashboard-status.hook.ts
get-performance-profiles.service.ts
performance-profile-card-view.component.tsx
```

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

import { DashboardView } from "./dashboard-view.component";

export const Dashboard = (): ReactElement => {
  return <DashboardView />;
};
```

## Service organization rules

Shared integration services belong under `apps/desktop/src/shared/services`.

Use folder-per-service organization:

```text
shared/services/
└── performance/
    ├── get-performance-profiles/
    │   └── get-performance-profiles.service.ts
    └── set-performance-profile/
        └── set-performance-profile.service.ts
```

Rules:

- A service calls Tauri `invoke` or another integration boundary.
- A service must not import React.
- A service must not use hooks.
- A service must not know about component props.
- A service must have an explicit return type.
- Keep feature-specific services under the feature only when they are not reusable.

## Hook organization rules

Hooks must live in their own folder:

```text
features/dashboard/hooks/
└── use-dashboard-status/
    ├── use-dashboard-status.hook.ts
    └── use-dashboard-status.types.ts
```

Rules:

- Hooks own state and async transitions.
- Hooks may call services.
- Hooks must not render JSX.
- Hooks must not contain CSS or DOM layout assumptions.
- Hooks must have explicit return types.

## Styling rules

- Use CSS Modules for feature-specific and component-specific styles.
- Do not add `styled-components`.
- Keep `shared/styles/global.css` limited to reset/base styles, design tokens, `body`, `:root`, and universal selectors.
- Do not put feature-specific classes such as dashboard cards or grids in global CSS.
- CSS Modules should consume global tokens rather than hardcoding repeated colors, radii, spacing, and shadows.

Design tokens should cover:

```text
colors
font sizes
font weights
spacing
radii
shadows
glow values
z-index
transitions
minimum shell sizes
```

## Desktop window and layout conventions

The desktop app is desktop-first.

Target defaults:

```text
Default window width: 1560
Default window height: 840
Minimum window width: 1280
Minimum window height: 760
```

Rules:

- Configure the Tauri window with the default/minimum dimensions above unless a task changes the target.
- The app shell should use `height: 100vh` and avoid main-window scroll at the default size.
- Allow internal content scrolling only when the viewport is below the minimum comfortable layout height.
- Dashboard and Performance should be optimized for the default window size first.
- Do not attempt full mobile responsiveness; this is a desktop control-center app.
- Keep cards and grids stable at common laptop resolutions such as 1366x768, 1440x900, 1536x864, and 1920x1080.

## Desktop shell and visual placeholders

- The desktop app uses an internal React app shell with sidebar/header state instead of React Router.
- Keep page navigation local to the shell until routing is explicitly required.
- The Dashboard AI Core is a CSS/SVG placeholder component prepared for a future WebGL implementation.
- Do not replace the AI Core placeholder with Three.js or React Three Fiber until that integration is requested.
- Do not surface internal implementation notes such as "mock", "placeholder", or "future replacement" in user-facing UI unless the purpose is explicit diagnostics.

## Header conventions

The app header should remain minimal.

Allowed current header content:

```text
current page context
active performance mode
runtime status
OS version
```

Do not reintroduce inactive alert/settings/AI-assistant button clutter unless the corresponding feature is implemented.

## Sidebar conventions

- Sidebar icons and app branding must use original project artwork.
- Do not ship official Acer/Predator logos or proprietary assets.
- Dashboard and Performance are active pages.
- Future entries should remain visible but disabled with a subtle `Soon` status.
- Disabled items must not look clickable.
- Keep icon stroke, size, spacing, hover, focus, and selected states consistent.

## Mock and placeholder rules

Mocked telemetry and future improvements are tracked in `docs/frontend-improvements-backlog.md`.

Rules:

- Mock telemetry must be isolated in feature mock files.
- Do not scatter literal mock values across views.
- Do not show the word "mock" in normal user-facing UI.
- Prefer "Not available" over invented values when the value would mislead the user.
- Visual placeholders are acceptable for future features only when clearly tracked in backlog.

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

Current performance command contracts:

```text
get_current_performance_profile
list_performance_profiles
set_performance_profile
```

## Change discipline

- Do not add new libraries unless there is a concrete need.
- Do not add routing until a task requires it.
- Do not implement new feature screens as part of refactor-only tasks.
- Do not change install scripts or packaging behavior unless requested.
- Preserve current Dashboard and Performance behavior when refactoring visual structure.
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
