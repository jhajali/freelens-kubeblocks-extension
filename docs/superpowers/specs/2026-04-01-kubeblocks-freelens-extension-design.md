# Freelens KubeBlocks Extension — Design Spec

## Overview

A Freelens extension that provides a full UI for managing KubeBlocks resources, replacing the need to work with raw manifests. Single extension with lazy-loaded sections and graceful degradation per CRD group via `withErrorPage()`.

## Architecture

- **Approach:** Single extension, internally organized by domain (core, dataprotection, addons)
- **Dual-version support:** CRDs available in both `v1` and `v1alpha1` register `v1` as primary with silent fallback
- **Pattern base:** Follows the validated freelens-argocd-extension architecture exactly

## CRD Registry

| CRD | API Group | Versions | Namespaced | Short Names |
|-----|-----------|----------|------------|-------------|
| Cluster | `apps.kubeblocks.io` | `v1`, `v1alpha1` | yes | `cl` |
| Component | `apps.kubeblocks.io` | `v1`, `v1alpha1` | yes | `cmp` |
| OpsRequest | `apps.kubeblocks.io` | `v1alpha1` | yes | `ops` |
| ClusterDefinition | `apps.kubeblocks.io` | `v1`, `v1alpha1` | no | `cd` |
| ComponentDefinition | `apps.kubeblocks.io` | `v1`, `v1alpha1` | no | `cmpd` |
| Backup | `dataprotection.kubeblocks.io` | `v1alpha1` | yes | `bp` |
| Restore | `dataprotection.kubeblocks.io` | `v1alpha1` | yes | `rt` |
| Addon | `extensions.kubeblocks.io` | `v1alpha1` | no | `addon` |

### File Structure

```
src/renderer/k8s/kubeblocks/
├── types.ts
├── cluster-v1.ts
├── component-v1.ts
├── opsrequest-v1alpha1.ts
├── cluster-definition-v1.ts
├── component-definition-v1.ts
├── backup-v1alpha1.ts
├── restore-v1alpha1.ts
└── addon-v1alpha1.ts
```

Each class extends `LensExtensionKubeObject` with static `kind`, `namespaced`, `apiBase`, `crd`, plus getter methods.

## Sidebar Navigation

```
KubeBlocks (custom SVG icon)
├── Overview
├── Clusters
├── Components
├── Operations
├── Backups
├── Restores
├── Definitions
└── Addons
```

All IDs prefixed with `kubeblocks-` to avoid collisions.

## Pages

### Overview (Multi-section Dashboard)

4 sections:
1. Cluster summary with pie charts (phase distribution)
2. Active OpsRequests table
3. Recent Backups/Restores table
4. KubeBlocks Events stream

Uses store loading pattern with AbortController and cleanup.

### Clusters

Columns: Name, Namespace, Definition, Components, Phase, Status, Age
Phase badges: Running=success, Stopped=info, Failed=error, Creating/Updating=warning

### Components

Columns: Name, Namespace, Cluster, Definition, Replicas, Phase, Age

### Operations

Columns: Name, Namespace, Cluster, Type, Phase, Progress, Age

### Backups

Columns: Name, Namespace, Cluster, Method, Status, Size, Duration, Age

### Restores

Columns: Name, Namespace, Backup Source, Target Cluster, Status, Age

### Definitions

TabLayout with two tabs:
- ClusterDefinitions: Name, Provider, Description
- ComponentDefinitions: Name, Service Kind, Service Version, Description

### Addons

Columns: Name, Type, Status, Provider, Version, Age
Enable/Disable actions available.

All pages use `KubeObjectListLayout` with sorting, search filters, and `withErrorPage()`.

## Detail Views

### Cluster Details
- Core: Definition, Termination Policy, Phase (badge), Status Message
- Components table: name, type, replicas, CPU/memory, storage
- Services: type and ports
- Spec YAML (Monaco, read-only)
- Status Conditions table

### Component Details
- Core: Cluster, Definition, Replicas, Phase (badge)
- Resource requests/limits
- Spec YAML (Monaco)
- Status Conditions

### OpsRequest Details
- Core: Cluster, Type (badge), Phase (badge), Progress
- Dynamic parameters section based on type
- Timeline: start, completion, duration
- Status Conditions
- Spec YAML (Monaco)

### Backup Details
- Core: Cluster, Method, Status (badge), Size, Duration
- Source info: snapshot, PVC, repository
- Time fields: start, completion, expiration
- Spec YAML (Monaco)

### Restore Details
- Core: Source Backup, Target Cluster, Status (badge)
- Parameters and volume claims
- Time fields
- Spec YAML (Monaco)

### ClusterDefinition Details
- Core: Provider, Description
- Component definition references
- Spec YAML (Monaco)

### ComponentDefinition Details
- Core: Service Kind, Service Version, Description
- Runtime, roles, volumes, lifecycle
- Spec YAML (Monaco)

### Addon Details
- Core: Type, Provider, Version, Status (badge)
- Install spec (Helm chart, values)
- Spec YAML (Monaco)

## Context Menu Actions

### On Clusters

| Action | Behavior |
|--------|----------|
| Restart | Creates OpsRequest type=Restart (confirmation dialog) |
| Stop | Creates OpsRequest type=Stop (confirmation dialog) |
| Start | Creates OpsRequest type=Start (confirmation dialog) |
| Vertical Scale | Opens wizard pre-filled |
| Horizontal Scale | Opens wizard pre-filled |
| Volume Expand | Opens wizard pre-filled |
| Upgrade | Opens wizard pre-filled |
| Backup | Opens wizard pre-filled |
| Expose | Opens wizard pre-filled |
| Switchover | Opens wizard pre-filled |
| Custom Operation | Opens wizard blank |

Simple ops (Restart, Stop, Start) execute via `store.create()` with confirmation dialog.

### On Addons

| Action | Behavior |
|--------|----------|
| Enable | Patches addon to enable |
| Disable | Patches addon to disable |

## OpsRequest Wizard

4-step modal dialog:

1. **Select Cluster** — dropdown, pre-filled from context menu
2. **Select Operation** — card grid with icons/descriptions, pre-selected from context menu
3. **Configure** — dynamic form per operation type:
   - HScale: component + replica count
   - VScale: component + CPU/memory
   - VolumeExpansion: component + storage size
   - Upgrade: target service version
   - Backup: method, retention
   - Restore: source backup, target cluster
   - Expose: service type, ports
   - Switchover: target instance
4. **Review & Submit** — editable YAML preview in Monaco + Submit

## Shared Components

| Component | Purpose |
|-----------|---------|
| `kubeblocks-events.tsx` | Filtered events for KB API groups |
| `pie-chart.tsx` | Status pie charts |
| `duration-absolute.tsx` | Relative + absolute timestamps |
| `status-conditions.tsx` | Conditions table renderer |
| `error-page.tsx` | `withErrorPage()` wrapper |
| `info-page.tsx` | Loading display |
| `confirmation-dialog.tsx` | Confirm/cancel for immediate ops |
| `ops-wizard/` | 4-step wizard (dialog, 4 step components, scss) |

## Utilities

- `defaultYamlDumpOptions` — consistent YAML config
- `getHeight(yaml)` — Monaco editor height calculation
- `getPhaseClass(phase)` — phase to CSS class mapping
- `getOpsTypeIcon(type)` — operation type to material icon
- `buildOpsRequestManifest(...)` — generate OpsRequest from wizard state

## Full File Structure

```
src/
├── main/
│   └── index.ts
└── renderer/
    ├── index.tsx
    ├── utils.ts
    ├── vars.scss
    ├── icons/
    │   └── kubeblocks.svg
    ├── k8s/kubeblocks/
    │   ├── types.ts
    │   ├── cluster-v1.ts
    │   ├── component-v1.ts
    │   ├── opsrequest-v1alpha1.ts
    │   ├── cluster-definition-v1.ts
    │   ├── component-definition-v1.ts
    │   ├── backup-v1alpha1.ts
    │   ├── restore-v1alpha1.ts
    │   └── addon-v1alpha1.ts
    ├── components/
    │   ├── details/
    │   │   ├── cluster-details.tsx
    │   │   ├── cluster-details.module.scss
    │   │   ├── component-details.tsx
    │   │   ├── component-details.module.scss
    │   │   ├── opsrequest-details.tsx
    │   │   ├── opsrequest-details.module.scss
    │   │   ├── backup-details.tsx
    │   │   ├── backup-details.module.scss
    │   │   ├── restore-details.tsx
    │   │   ├── restore-details.module.scss
    │   │   ├── cluster-definition-details.tsx
    │   │   ├── cluster-definition-details.module.scss
    │   │   ├── component-definition-details.tsx
    │   │   ├── component-definition-details.module.scss
    │   │   ├── addon-details.tsx
    │   │   └── addon-details.module.scss
    │   ├── kubeblocks-events.tsx
    │   ├── pie-chart.tsx
    │   ├── duration-absolute.tsx
    │   ├── status-conditions.tsx
    │   ├── confirmation-dialog.tsx
    │   ├── error-page.tsx
    │   ├── error-page.module.scss
    │   ├── info-page.tsx
    │   ├── info-page.module.scss
    │   └── ops-wizard/
    │       ├── wizard-dialog.tsx
    │       ├── step-select-cluster.tsx
    │       ├── step-select-operation.tsx
    │       ├── step-configure.tsx
    │       ├── step-review.tsx
    │       └── ops-wizard.module.scss
    ├── menus/
    │   ├── cluster-ops-menu-items.tsx
    │   └── addon-menu-items.tsx
    └── pages/
        ├── overview.tsx
        ├── overview.module.scss
        ├── clusters.tsx
        ├── clusters.module.scss
        ├── components.tsx
        ├── components.module.scss
        ├── operations.tsx
        ├── operations.module.scss
        ├── backups.tsx
        ├── backups.module.scss
        ├── restores.tsx
        ├── restores.module.scss
        ├── definitions.tsx
        ├── definitions.module.scss
        ├── addons.tsx
        └── addons.module.scss
```

## Build & CI/CD

Identical to ArgoCD extension:
- `electron.vite.config.js` — same externals, plugins, output
- `tsconfig.json` — same config
- `biome.jsonc` — same formatter/linter
- `Makefile` — same targets
- `package.json` scripts: `type:check`, `build`, `build:force`, `clean`, `pack:dev`
- GitHub workflows: `check.yaml` (CI), `release.yaml` (tag-based release)
