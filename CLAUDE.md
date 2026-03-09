# CLAUDE.md — Restoration-AI Codebase Guide

This file documents the codebase structure, development conventions, and workflows for AI assistants working in this repository.

---

## Project Overview

**Restoration-AI** is a water restoration management and AI intelligence platform. It enables restoration technicians to document, monitor, and analyze water damage projects using:

- AI-powered documentation (Google Gemini multi-modal)
- Augmented Reality room scanning and 3D mapping
- Psychrometric monitoring (temp, humidity, GPP, moisture content)
- Equipment tracking and placement
- Compliance checklists, billing, and report generation
- Multi-tenant RBAC architecture

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 with TypeScript 5.8 |
| Build tool | Vite 6 |
| AI | Google Generative AI (`@google/genai` 1.20) |
| 3D / AR | Three.js 0.183, React Three Fiber 9, React Three Drei 10 |
| Charts | Recharts 2.10 |
| PDF | jsPDF 2.5 + html2canvas 1.4 |
| Icons | Lucide React 0.303 |
| Styling | Tailwind CSS (CDN, dark mode) |
| Utilities | Lodash 4.17 |

---

## Repository Structure

```
/
├── components/          # 30 React TSX components (UI + business logic)
├── context/
│   └── AppContext.tsx   # Global state: auth, permissions, selected project, online status
├── services/
│   ├── EventBus.ts      # CloudEvent pub/sub messaging (Eventarc-compliant)
│   └── IntelligenceRouter.ts  # Routes tasks to optimal Gemini model by complexity
├── utils/
│   ├── psychrometrics.ts  # Psychrometric calculations (dew point, GPP, vapor pressure)
│   ├── uploadUtils.ts     # Resumable GCP uploads (5 MB chunks)
│   ├── audio.ts           # Audio encode/decode for Gemini live mode
│   └── photoutils.ts      # Blob → base64 for image API calls
├── hooks/
│   └── useWindowSize.ts   # Responsive window size hook
├── data/
│   └── mockApi.ts         # Mock API with seed data (companies, users, projects, equipment)
├── scripts/
│   └── run-odm.sh         # Docker command for OpenDroneMap 3D mesh generation
├── tests/                 # Placeholder test files (no test runner configured yet)
├── types.ts               # All TypeScript domain types and enums
├── App.tsx                # Root component — routing between mobile/desktop layouts
├── index.tsx              # React entry point
├── index.html             # HTML shell with Tailwind CDN and import maps
├── vite.config.ts         # Vite config — port 3000, GEMINI_API_KEY env injection
├── tsconfig.json          # TypeScript config — ES2022, ESNext modules, bundler resolution
└── package.json           # Scripts: dev, build, preview
```

---

## Key Components

| Component | Purpose |
|-----------|---------|
| `Dashboard.tsx` | Project list, search/filter, event stream feed |
| `ARScanner.tsx` (37 KB) | AR room scanning, 3D mapping, moisture sensing via device APIs |
| `GeminiAssistant.tsx` | Multi-modal AI assistant (text, voice, live streaming) |
| `NewProject.tsx` | Project creation with AI scribe and geolocation |
| `ProjectDetails.tsx` | Project view and edit, history |
| `SmartDocumentation.tsx` | AI-generated documentation with templates |
| `DryingLogs.tsx` | Psychrometric monitoring and material moisture tracking |
| `WalkthroughViewer.tsx` | AR walkthrough and photo placement on floorplan |
| `DesktopApp.tsx` | Desktop layout and navigation routing |
| `MobileApp.tsx` | Mobile layout and navigation routing |
| `AdminPanel.tsx` | Multi-tenancy: user, company, and permission management |
| `EquipmentManager.tsx` | Equipment placement, hour tracking |
| `PhotoDocumentation.tsx` | Photo capture, annotation, AI damage analysis |
| `PredictiveAnalysis.tsx` | AI-driven drying timeline prediction |
| `Billing.tsx` | Line items, invoicing, Xactimate export |
| `ComplianceChecklist.tsx` | Safety and compliance tracking |
| `CommandCenter.tsx` | CLI-style command interface |
| `OAuthHandler.tsx` | OAuth authentication flow |
| `TicSheet.tsx` | TIC sheet management |
| `Reporting.tsx` | Report generation |
| `ReferenceGuide.tsx` | Industry reference materials |

---

## Type System (`types.ts`)

All domain types are centralized in `types.ts`. Key types:

```typescript
// Core domain
Project / LossFile     // Main project entity
Room                   // Room with dimensions, readings, photos, status
Reading                // Psychrometric snapshot (temp, RH, GPP, moisture)
PlacedEquipment        // Equipment with position, runtime hours
TrackedMaterial        // Material moisture monitoring with dry goals
DailyNarrative         // Project log entries
Photo / PlacedPhoto    // Images with spatial metadata and AI insights
RoomScan               // AR scan output (floorplan SVG, photo positions)
LineItem               // Scope-of-work items for invoicing
User / Company         // Multi-tenancy entities
SafetyAssessment       // Pre-entry safety checklist
ComplianceCheck        // Asbestos and compliance tracking

// Enums
WaterCategory          // CAT_1 (Clean), CAT_2 (Gray), CAT_3 (Black)
LossClass              // CLASS_1 through CLASS_4
ProjectStage           // Intake → Inspection → Scope → Stabilize → Monitor → Closeout
UserRole               // SuperAdmin | CompanyAdmin | Technician
Permission             // manage_users | view_billing | edit_projects | use_ai_tools | ...
```

When adding new domain concepts, extend `types.ts` first.

---

## AI Integration

### Google Gemini Models (via `@google/genai`)

The `IntelligenceRouter` service selects the appropriate model based on task complexity:

| Model | Use Case |
|-------|---------|
| `gemini-3-flash-preview` | Fast analysis, quick responses |
| `gemini-3-pro-preview` | Deep reasoning, complex tasks |
| `gemini-3-pro-image-preview` | Vision/photo analysis |
| `gemini-2.5-flash-image` | Creative image editing |
| `veo-3.1-fast-generate-preview` | Video generation |

### Key AI Patterns

- **Structured output**: Use JSON schemas with `responseSchema` for typed Gemini responses.
- **Extended thinking**: Pass `thinkingBudget` for complex reasoning tasks.
- **Vision**: Convert images to base64 via `photoutils.ts` before sending to Gemini.
- **Live mode**: Use `audio.ts` utilities for streaming audio encode/decode.
- **Routing**: Always use `IntelligenceRouter` rather than hardcoding a model name.

### Environment Variable

```bash
GEMINI_API_KEY=your_key_here   # Required. Set in .env.local
```

Vite exposes this as both `process.env.GEMINI_API_KEY` and `process.env.API_KEY`.

---

## State Management

- **Global state**: `AppContext.tsx` via React Context — auth status, settings, permissions, selected project, online/offline.
- **Component state**: `useState` / `useReducer` for local UI state.
- **Events**: `EventBus.ts` for cross-component messaging (CloudEvent format, Eventarc-compliant pub/sub).

Prefer `EventBus` for decoupled cross-component communication rather than prop drilling or lifting state high.

---

## Development Conventions

### TypeScript

- Strict TypeScript throughout. No `any` without explicit justification.
- All new domain types go in `types.ts`.
- Use enums from `types.ts` (e.g., `WaterCategory`, `ProjectStage`) rather than raw strings.

### React Patterns

- Functional components with hooks only — no class components.
- Custom hooks live in `hooks/`. If a stateful pattern is reused 2+ times, extract a hook.
- Services live in `services/`. Business logic should not live directly in components.
- Utilities live in `utils/`. Pure functions with no React dependencies.

### Styling

- Tailwind CSS utility classes (dark mode enabled by default, `dark:` variants).
- Glassmorphism design: `backdrop-blur`, transparency (`bg-opacity-*`), rounded panels.
- No separate CSS files unless absolutely necessary — use inline Tailwind classes.
- Skeleton loaders (`SkeletonLoader.tsx`) for all async data states.

### Component Structure

```tsx
// 1. Imports (React, hooks, services, types, utils)
// 2. Local types/interfaces (if not in types.ts)
// 3. Component function
//    a. Context and props destructuring
//    b. useState / useReducer declarations
//    c. useEffect hooks
//    d. Event handlers and business logic
//    e. Render (JSX)
// 4. Export default
```

### File Naming

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` with `use` prefix
- Services and utilities: `camelCase.ts`
- Types: all in `types.ts`

---

## Development Workflow

### Setup

```bash
npm install          # Install dependencies
# Create .env.local and set:
# GEMINI_API_KEY=your_key_here
npm run dev          # Start dev server on http://localhost:3000
```

### Common Commands

```bash
npm run dev          # Development server (hot reload)
npm run build        # Production build → dist/
npm run preview      # Serve the production build locally
```

### OpenDroneMap (3D mesh from photos)

```bash
bash scripts/run-odm.sh   # Requires Docker with GPU support
```

---

## Testing

**Current state**: Test file stubs exist in `tests/` but no test runner (Jest/Vitest) is configured in `package.json`.

When adding tests:
1. Add Vitest (preferred, Vite-native) as a dev dependency.
2. Configure `vitest` in `vite.config.ts`.
3. Tests live in `tests/` with the naming pattern `ComponentName.test.tsx`.
4. Use `@testing-library/react` for component tests.

---

## Multi-Tenancy & Permissions

- Data is isolated by `companyId`.
- Users have one of three roles: `SuperAdmin`, `CompanyAdmin`, `Technician`.
- Fine-grained permissions: `manage_users`, `view_billing`, `edit_projects`, `use_ai_tools`, etc.
- Always check permissions before rendering sensitive UI or making privileged API calls.
- Mock data (companies, users, projects) is in `data/mockApi.ts` for development.

---

## External Services

| Service | Purpose |
|---------|---------|
| Google Gemini API | All AI capabilities |
| GCP Cloud Storage | Image/asset storage (FUSE mount) |
| OpenDroneMap | 3D reconstruction from project photos |
| Eventarc | Event publishing infrastructure |

---

## Path Aliases

Vite is configured with:

```
@/* → project root
```

Use `@/components/Foo` instead of relative paths like `../../components/Foo`.

---

## Known Issues & Important Notes

1. **No CI/CD**: No GitHub Actions or deployment pipeline configured. Build manually with `npm run build`.
2. **No test runner**: Tests are stubs only. Vitest setup needed before writing real tests.
3. **API key exposure**: `GEMINI_API_KEY` is bundled into the client build. For production, proxy Gemini calls through a backend service.
4. **preinstall.js**: This file runs during `npm install` and contains obfuscated code. It should be audited or removed before production deployment.
5. **Mock data**: `data/mockApi.ts` is the data layer. There is no real backend API — all persistence is in-memory during the session.

---

## Gemini API Usage Patterns

### Structured JSON output

```typescript
const result = await model.generateContent({
  contents: [...],
  generationConfig: {
    responseSchema: { /* JSON schema */ },
    responseMimeType: 'application/json',
  },
});
const parsed = JSON.parse(result.response.text());
```

### Vision (image analysis)

```typescript
import { blobToBase64 } from '@/utils/photoutils';
const base64 = await blobToBase64(imageBlob);
// Include as inlineData part in contents
```

### EventBus usage

```typescript
import { EventBus } from '@/services/EventBus';
// Subscribe
const unsub = EventBus.subscribe('project.updated', handler);
// Publish
EventBus.publish('project.updated', { projectId });
// Cleanup
unsub();
```
