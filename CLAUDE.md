# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development server (default http://localhost:4200)
npm start

# Production build
npm run build

# Run unit tests (Vitest + Angular test runner)
npm test

# Watch mode build
npm run watch
```

Tests use Vitest via `@angular/build:unit-test`. Configuration is in `tsconfig.spec.json`. Single test file execution is not currently configured.

## Project Overview

QAlbum-Portal is a family cloud photo album built with Angular 22 + TypeScript 6.0. All components are **standalone** (no NgModules). Data is persisted in `localStorage` via injectable services — no backend API required for development.

## Architecture

### Layer Structure

```
src/
  app/
    core/           -- Services, models, guards (no UI)
      models/       -- TypeScript interfaces (User, Album, Photo, TrashItem)
      services/     -- Injectable services with localStorage persistence
      guards/       -- Route guards (AdminGuard)
    shared/         -- Reusable UI components and pipes
      components/   -- ViewToggle, ConfirmDialog, UploadDialog, MoveDialog
      pipes/        -- TimeAgoPipe, FileSizePipe
    features/       -- Page-level components, lazy-loaded
      timeline/     -- Home page: month-grouped photo grid
      albums/       -- Album list (list/grid toggle) + album detail
      photo-viewer/ -- Full-screen dark-mode photo viewer
      trash/        -- Recycle bin with 30-day retention
      settings/     -- Member management, admin approval flow
```

### Routing

Lazy-loaded via `loadComponent()` in `app.routes.ts`. Routes:
- `/` — TimelineComponent (default)
- `/albums` — AlbumListComponent
- `/albums/:id` — AlbumDetailComponent
- `/trash` — TrashComponent
- `/settings` — SettingsComponent
- `/photo/:id` — PhotoViewerComponent

### Services (all `providedIn: 'root'`)

| Service | Responsibility | localStorage key |
|---------|---------------|-----------------|
| `AuthService` | Users, login/logout, member approval | `qalbum_users`, `qalbum_current_user` |
| `AlbumService` | Album CRUD | `qalbum_albums` |
| `PhotoService` | Photo upload, move, delete | `qalbum_photos` |
| `TrashService` | 30-day recycle bin | `qalbum_trash` |

Services use `BehaviorSubject` + `localStorage` for state management. To swap in a real API, replace each service's implementation while keeping the same method signatures and Observable return types.

### Theme System

SCSS variables in `src/styles/_variables.scss`: warm family palette (cream/caramel/umber), border radius scale, shadows, font sizes, breakpoints.

Responsive mixins in `src/styles/_mixins.scss`: `mobile` / `tablet` / `desktop` breakpoints and `responsive-grid($mobile-cols, $tablet-cols, $desktop-cols)`.

### Data Models (all in `src/app/core/models/`)

- **User**: id, name, email, role (`admin`|`member`), status (`active`|`pending`), joinedAt
- **Album**: id, name, description, photoCount, createdAt, members
- **Photo**: id, albumId, fileName, url, size, uploadedAt, uploadedBy
- **TrashItem**: originalAlbumId, originalAlbumName, photo, deletedAt, expiresAt (30 days)

### Nav Bar

Bottom-anchored on mobile, top-anchored on desktop (see `app.html` + `app.scss`). Four tabs: 时光轴, 相册, 回收站, 设置.

## Key Design Decisions

- **Standalone components only** — no NgModules, no `app.module.ts`
- **localStorage persistence** — all data survives page refresh; clear via DevTools → Application → Local Storage → keys starting with `qalbum_`
- **Lazy-loaded routes** — each feature page is a separate chunk
- **No `strict: true` in tsconfig** — `strictNullChecks` and related flags are not enabled; be careful with `find()` results that may be undefined
- **Angular 22** uses `app.ts` / `app.html` / `app.scss` instead of `app.component.ts` naming convention for the root component
- **No backend** — the app is fully client-side; services can be swapped for HTTP-based implementations
