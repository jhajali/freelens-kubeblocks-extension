# KubeBlocks Freelens Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Freelens extension that provides full UI management for all KubeBlocks CRDs — Cluster, Component, OpsRequest, Backup, Restore, ClusterDefinition, ComponentDefinition, and Addon — with dual API version support, context menu actions, and an OpsRequest creation wizard.

**Architecture:** Single Freelens extension following the validated ArgoCD extension pattern. Renderer-process entry registers pages, menus, detail views, and context menu actions. Each CRD is a `LensExtensionKubeObject` subclass. Pages use `KubeObjectListLayout` wrapped with `withErrorPage()` for graceful degradation when CRDs are missing. The OpsRequest wizard is a multi-step modal dialog using Freelens's built-in `Dialog` component.

**Tech Stack:** React 17, MobX 6, TypeScript 5.9, electron-vite, SCSS modules, @freelensapp/extensions ^1.5.3, js-yaml, moment

---

## File Structure

```
src/
├── main/
│   └── index.ts                              # Main process shell
└── renderer/
    ├── index.tsx                              # Extension registration
    ├── utils.ts                               # Shared utilities
    ├── vars.scss                              # SCSS variables
    ├── icons/
    │   └── kubeblocks.svg                     # Sidebar icon
    ├── k8s/kubeblocks/
    │   ├── types.ts                           # Shared interfaces
    │   ├── cluster-v1.ts                      # Cluster CRD
    │   ├── component-v1.ts                    # Component CRD
    │   ├── opsrequest-v1alpha1.ts             # OpsRequest CRD
    │   ├── cluster-definition-v1.ts           # ClusterDefinition CRD
    │   ├── component-definition-v1.ts         # ComponentDefinition CRD
    │   ├── backup-v1alpha1.ts                 # Backup CRD
    │   ├── restore-v1alpha1.ts                # Restore CRD
    │   └── addon-v1alpha1.ts                  # Addon CRD
    ├── components/
    │   ├── error-page.tsx                     # Error boundary wrapper
    │   ├── error-page.module.scss
    │   ├── info-page.tsx                      # Loading display
    │   ├── info-page.module.scss
    │   ├── pie-chart.tsx                      # Status pie charts
    │   ├── pie-chart.module.scss
    │   ├── kubeblocks-events.tsx              # Filtered event stream
    │   ├── duration-absolute.tsx              # Timestamps
    │   ├── status-conditions.ts               # Status → CSS mapping
    │   ├── confirmation-dialog.tsx            # Confirm dialog for ops
    │   ├── confirmation-dialog.module.scss
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

---

### Task 1: Project Scaffolding & Build Config

**Files:**
- Create: `package.json`
- Create: `electron.vite.config.js`
- Create: `tsconfig.json`
- Create: `biome.jsonc`
- Create: `Makefile`
- Create: `.gitignore`
- Create: `src/main/index.ts`
- Create: `src/renderer/vars.scss`
- Create: `src/renderer/icons/kubeblocks.svg`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@freelensapp/kubeblocks-extension",
  "version": "0.1.0",
  "description": "Freelens extension for KubeBlocks",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/jhajali/freelens-kubeblocks-extension.git",
    "directory": "."
  },
  "main": "out/main/index.js",
  "renderer": "out/renderer/index.js",
  "files": [
    "out/**/*"
  ],
  "engines": {
    "node": ">= 22.16.0",
    "freelens": "^1.6.0"
  },
  "license": "MIT",
  "scripts": {
    "type:check": "tsc --noEmit -p tsconfig.json --composite false",
    "prebuild": "pnpm type:check",
    "build": "electron-vite build",
    "build:force": "electron-vite build",
    "clean": "rm -rf out",
    "pack:dev": "pnpm version prerelease --no-commit-hooks --no-git-tag-version && pnpm build:force && pnpm pack"
  },
  "devDependencies": {
    "@babel/plugin-proposal-decorators": "^7.29.0",
    "@electron-toolkit/tsconfig": "^2.0.0",
    "@freelensapp/extensions": "^1.5.3",
    "@freelensapp/kube-object": "^1.6.2",
    "@types/node": "^22.16.4",
    "@types/react": "^17.0.91",
    "@types/react-router-dom": "^5.3.3",
    "@vitejs/plugin-react": "^5.1.4",
    "electron-vite": "^5.0.0",
    "js-yaml": "^4.1.1",
    "@types/js-yaml": "^4.0.9",
    "mobx": "6.13.7",
    "mobx-react": "7.6.0",
    "moment": "^2.30.1",
    "react": "17.0.2",
    "sass": "^1.97.3",
    "typescript": "5.9.3",
    "vite": "^7.3.1",
    "vite-plugin-external": "^6.2.2",
    "vite-plugin-sass-dts": "^1.3.35"
  },
  "packageManager": "pnpm@10.29.3"
}
```

- [ ] **Step 2: Create electron.vite.config.js**

```javascript
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import pluginExternal from "vite-plugin-external";
import sassDts from "vite-plugin-sass-dts";

export default defineConfig({
  main: {
    build: {
      lib: {
        entry: resolve(__dirname, "src/main/index.ts"),
        formats: ["cjs"],
      },
      rollupOptions: {
        output: {
          exports: "named",
          preserveModules: (process.env.VITE_PRESERVE_MODULES ?? "true") === "true",
          preserveModulesRoot: "src/main",
        },
      },
      sourcemap: true,
    },
    plugins: [
      externalizeDepsPlugin({
        include: ["@freelensapp/extensions", "mobx"],
      }),
      pluginExternal({
        externals: {
          "@freelensapp/extensions": "global.LensExtensions",
          mobx: "global.Mobx",
        },
      }),
      react({
        babel: {
          plugins: [
            ["@babel/plugin-proposal-decorators", { version: "2023-05" }],
          ],
        },
      }),
    ],
  },
  preload: {
    build: {
      lib: {
        entry: resolve(__dirname, "src/renderer/index.tsx"),
        formats: ["cjs"],
      },
      outDir: "out/renderer",
      rollupOptions: {
        output: {
          exports: "named",
          preserveModules: (process.env.VITE_PRESERVE_MODULES ?? "true") === "true",
          preserveModulesRoot: "src/renderer",
        },
      },
      sourcemap: true,
    },
    css: {
      modules: {
        localsConvention: "camelCaseOnly",
      },
    },
    plugins: [
      sassDts({
        enabledMode: ["development", "production"],
      }),
      react({
        babel: {
          plugins: [
            ["@babel/plugin-proposal-decorators", { version: "2023-05" }],
          ],
        },
      }),
      externalizeDepsPlugin({
        include: [
          "@freelensapp/extensions",
          "electron",
          "mobx",
          "mobx-react",
          "react",
          "react-dom",
          "react-router-dom",
        ],
        exclude: [],
      }),
      pluginExternal({
        externals: {
          "@freelensapp/extensions": "global.LensExtensions",
          mobx: "global.Mobx",
          "mobx-react": "global.MobxReact",
          react: "global.React",
          "react-dom": "global.ReactDom",
          "react-router-dom": "global.ReactRouterDom",
          "react/jsx-runtime": "global.ReactJsxRuntime",
        },
      }),
    ],
  },
});
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "extends": "@electron-toolkit/tsconfig/tsconfig.node.json",
  "include": ["*.ts", "src/**/*"],
  "compilerOptions": {
    "composite": true,
    "esModuleInterop": true,
    "moduleResolution": "node10",
    "jsx": "react-jsx",
    "types": ["vite/client", "electron-vite/node"]
  }
}
```

- [ ] **Step 4: Create biome.jsonc**

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/2.3.14/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 120
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "all"
    }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": false,
      "complexity": {
        "noUselessThisAlias": "error",
        "noUselessTypeConstraint": "error"
      },
      "correctness": {
        "noInvalidUseBeforeDeclaration": "error"
      },
      "style": {
        "noNamespace": "error",
        "useAsConstAssertion": "error"
      },
      "suspicious": {
        "noExtraNonNullAssertion": "error",
        "noMisleadingInstantiator": "error",
        "useNamespaceKeyword": "error"
      }
    }
  },
  "vcs": {
    "clientKind": "git",
    "enabled": true,
    "useIgnoreFile": true
  }
}
```

- [ ] **Step 5: Create Makefile**

```makefile
.PHONY: install build build-force clean pack type-check lint help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	pnpm install

build: ## Build with type checking
	pnpm build

build-force: ## Build without type checking
	pnpm build:force

type-check: ## Run TypeScript type checker
	pnpm type:check

clean: ## Remove build output
	rm -rf out
	rm -f *.tgz

pack: build ## Build and pack into .tgz
	pnpm pack

lint: ## Run linter
	pnpm type:check
```

- [ ] **Step 6: Create .gitignore**

```
*.exe
*.exe~
*.dll
*.so
*.dylib
*.test
*.out
coverage.*
*.coverprofile
profile.cov
go.work
go.work.sum
.env
node_modules
out
*.tgz
```

- [ ] **Step 7: Create src/main/index.ts**

```typescript
import { Main } from "@freelensapp/extensions";

export default class KubeBlocksExtensionMain extends Main.LensExtension {}
```

- [ ] **Step 8: Create src/renderer/vars.scss**

```scss
// Dimensions
$unit: 8px;
$padding: $unit;
$margin: $unit;
$gap: $padding;
```

- [ ] **Step 9: Create src/renderer/icons/kubeblocks.svg**

Create a simple SVG icon for KubeBlocks (a database/cube icon):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L6.04 7.5 12 10.85l5.96-3.35L12 4.15zM5 15.91l6 3.37v-6.73L5 9.18v6.73zm14 0v-6.73l-6 3.37v6.73l6-3.37z"/>
</svg>
```

- [ ] **Step 10: Install dependencies**

Run: `pnpm install`
Expected: Successful install with lockfile generated.

- [ ] **Step 11: Verify build scaffolding compiles**

We need a minimal renderer entry to test the build. Create a temporary `src/renderer/index.tsx`:

```typescript
import { Renderer } from "@freelensapp/extensions";

export default class KubeBlocksExtension extends Renderer.LensExtension {}
```

Run: `pnpm build:force`
Expected: Build succeeds, `out/` directory created.

- [ ] **Step 12: Commit**

```bash
git add package.json pnpm-lock.yaml electron.vite.config.js tsconfig.json biome.jsonc Makefile .gitignore src/main/index.ts src/renderer/index.tsx src/renderer/vars.scss src/renderer/icons/kubeblocks.svg
git commit -m "feat: scaffold KubeBlocks extension project"
```

---

### Task 2: Shared Utilities & Components

**Files:**
- Create: `src/renderer/utils.ts`
- Create: `src/renderer/components/error-page.tsx`
- Create: `src/renderer/components/error-page.module.scss`
- Create: `src/renderer/components/info-page.tsx`
- Create: `src/renderer/components/info-page.module.scss`
- Create: `src/renderer/components/duration-absolute.tsx`
- Create: `src/renderer/components/status-conditions.ts`

- [ ] **Step 1: Create src/renderer/utils.ts**

```typescript
import { Renderer } from "@freelensapp/extensions";
import type { DumpOptions } from "js-yaml";

const {
  Navigation: { getDetailsUrl },
} = Renderer;

export function getMaybeDetailsUrl(url?: string): string {
  if (url) {
    return getDetailsUrl(url);
  } else {
    return "";
  }
}

export function getHeight(data?: string): number {
  const lineHeight = 18;
  if (!data) return lineHeight;

  const lines = data.split("\n").length;
  if (lines < 5) return 5 * lineHeight;
  if (lines > 20) return 20 * lineHeight;
  return lines * lineHeight;
}

export const defaultYamlDumpOptions: DumpOptions = {
  noArrayIndent: true,
  noCompatMode: true,
  noRefs: true,
  quotingType: '"',
  sortKeys: true,
};

export function createEnumFromKeys<T extends Record<string, any>>(obj: T): Record<keyof T, keyof T> {
  return Object.keys(obj).reduce(
    (acc, key) => {
      acc[key as keyof T] = key as keyof T;
      return acc;
    },
    {} as Record<keyof T, keyof T>,
  );
}

export function getPhaseClass(phase?: string): string {
  switch (phase) {
    case "Running":
    case "Healthy":
    case "Completed":
    case "Succeed":
    case "Available":
      return "success";
    case "Failed":
    case "Abnormal":
    case "ConditionsError":
      return "error";
    case "Creating":
    case "Updating":
    case "Deleting":
    case "Progressing":
    case "Pending":
    case "Running":
      return "warning";
    case "Stopped":
    case "Suspended":
    case "Disabled":
      return "info";
    default:
      return "";
  }
}

export function getOpsTypeIcon(type?: string): string {
  switch (type) {
    case "Restart":
      return "restart_alt";
    case "Stop":
      return "stop";
    case "Start":
      return "play_arrow";
    case "VerticalScaling":
      return "straighten";
    case "HorizontalScaling":
      return "width_normal";
    case "VolumeExpansion":
      return "storage";
    case "Upgrade":
      return "upgrade";
    case "Backup":
      return "backup";
    case "Restore":
      return "restore";
    case "Expose":
      return "public";
    case "Switchover":
      return "swap_horiz";
    case "Reconfiguring":
      return "settings";
    default:
      return "build";
  }
}
```

- [ ] **Step 2: Create src/renderer/components/error-page.tsx**

```typescript
import { Common } from "@freelensapp/extensions";
import React from "react";
import styles from "./error-page.module.scss";
import stylesInline from "./error-page.module.scss?inline";

export interface ErrorPageProps {
  error?: unknown;
  children?: React.ReactNode;
}

export function ErrorPage({ error, children }: ErrorPageProps) {
  if (error) {
    Common.logger.error(`[@freelensapp/kubeblocks-extension]: ${error}`);
  }
  return (
    <>
      <style>{stylesInline}</style>
      <div className={styles.errorPage}>
        {error ? <p className={styles.errorMessage}>{String(error)}</p> : <></>}
        {children}
      </div>
    </>
  );
}

export function withErrorPage(wrapped: () => JSX.Element) {
  try {
    return wrapped();
  } catch (error) {
    const errorMessage = String(error);

    if (errorMessage.includes("not registered") || errorMessage.includes("getStore")) {
      Common.logger.debug(`[@freelensapp/kubeblocks-extension]: API not available - ${error}`);
      return null;
    }

    return <ErrorPage error={error} />;
  }
}
```

- [ ] **Step 3: Create src/renderer/components/error-page.module.scss**

```scss
.errorPage {
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.errorMessage {
  display: flex;
  align-items: center;
  color: var(--colorError);
}
```

- [ ] **Step 4: Create src/renderer/components/info-page.tsx**

```typescript
import styles from "./info-page.module.scss";
import stylesInline from "./info-page.module.scss?inline";

export interface InfoPageProps {
  message?: string;
}

export function InfoPage({ message }: InfoPageProps) {
  return (
    <>
      <style>{stylesInline}</style>
      <div className={styles.infoPage}>
        <p className={styles.infoMessage}>{message}</p>
      </div>
    </>
  );
}
```

- [ ] **Step 5: Create src/renderer/components/info-page.module.scss**

```scss
@use "../vars";

.infoPage {
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.infoMessage {
  display: flex;
  align-items: center;
  color: var(--colorInfo);
}
```

- [ ] **Step 6: Create src/renderer/components/duration-absolute.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";

const {
  Component: { LocaleDate, ReactiveDuration },
} = Renderer;

export interface DurationAbsoluteTimestampProps {
  timestamp: string | undefined;
}

export const DurationAbsoluteTimestamp = ({ timestamp }: DurationAbsoluteTimestampProps) => {
  if (!timestamp) {
    return <>{"<unknown>"}</>;
  }

  return (
    <>
      <ReactiveDuration timestamp={timestamp} />
      {" ago "}
      (<LocaleDate date={timestamp} />)
    </>
  );
};
```

- [ ] **Step 7: Create src/renderer/components/status-conditions.ts**

```typescript
import type { Condition } from "@freelensapp/kube-object";

export function getPhaseText(phase?: string): string {
  return phase || "Unknown";
}

export function getPhaseClass(phase?: string): string {
  switch (phase) {
    case "Running":
    case "Healthy":
    case "Completed":
    case "Succeed":
    case "Available":
    case "Enabled":
      return "success";
    case "Failed":
    case "Abnormal":
    case "ConditionsError":
      return "error";
    case "Creating":
    case "Updating":
    case "Deleting":
    case "Progressing":
    case "Pending":
      return "warning";
    case "Stopped":
    case "Suspended":
    case "Disabled":
      return "info";
    default:
      return "";
  }
}

export function getConditionText(conditions?: Condition[]): string {
  if (!conditions || conditions.length === 0) return "OK";
  const errors = conditions.filter((c) => c.type === "Error" || c.status === "False");
  if (errors.length > 0) return `${errors.length} Error(s)`;
  return "OK";
}

export function getConditionClass(conditions?: Condition[]): string {
  if (!conditions || conditions.length === 0) return "success";
  const errors = conditions.filter((c) => c.type === "Error" || c.status === "False");
  if (errors.length > 0) return "error";
  return "success";
}

export function getStatusMessage(conditions?: Condition[]): string | undefined {
  if (!conditions || conditions.length === 0) return undefined;
  return conditions[0]?.message;
}
```

- [ ] **Step 8: Verify build**

Run: `pnpm build:force`
Expected: Build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/renderer/utils.ts src/renderer/components/
git commit -m "feat: add shared utilities and base components"
```

---

### Task 3: KubeBlocks CRD Types & Classes

**Files:**
- Create: `src/renderer/k8s/kubeblocks/types.ts`
- Create: `src/renderer/k8s/kubeblocks/cluster-v1.ts`
- Create: `src/renderer/k8s/kubeblocks/component-v1.ts`
- Create: `src/renderer/k8s/kubeblocks/opsrequest-v1alpha1.ts`
- Create: `src/renderer/k8s/kubeblocks/cluster-definition-v1.ts`
- Create: `src/renderer/k8s/kubeblocks/component-definition-v1.ts`
- Create: `src/renderer/k8s/kubeblocks/backup-v1alpha1.ts`
- Create: `src/renderer/k8s/kubeblocks/restore-v1alpha1.ts`
- Create: `src/renderer/k8s/kubeblocks/addon-v1alpha1.ts`

- [ ] **Step 1: Create src/renderer/k8s/kubeblocks/types.ts**

```typescript
import { Renderer } from "@freelensapp/extensions";
import type { Condition } from "@freelensapp/kube-object";

export interface KubeBlocksKubeObjectCRD extends Renderer.K8sApi.LensExtensionKubeObjectCRD {
  title: string;
}

export interface KubeBlocksKubeObjectStatus {
  conditions?: Condition[];
  phase?: string;
  message?: string;
  observedGeneration?: number;
}

// Cluster types
export type ClusterPhase =
  | "Creating"
  | "Running"
  | "Updating"
  | "Stopping"
  | "Stopped"
  | "Deleting"
  | "Failed"
  | "Abnormal"
  | "";

export interface ClusterComponentSpec {
  name?: string;
  componentDef?: string;
  componentDefRef?: string;
  replicas?: number;
  resources?: {
    requests?: { cpu?: string; memory?: string };
    limits?: { cpu?: string; memory?: string };
  };
  volumeClaimTemplates?: {
    name?: string;
    spec?: {
      accessModes?: string[];
      resources?: { requests?: { storage?: string } };
      storageClassName?: string;
    };
  }[];
  serviceVersion?: string;
}

export interface ClusterService {
  name?: string;
  serviceName?: string;
  componentSelector?: string;
  type?: string;
  ports?: { name?: string; port?: number; targetPort?: number; protocol?: string }[];
}

// OpsRequest types
export type OpsRequestType =
  | "Upgrade"
  | "VerticalScaling"
  | "VolumeExpansion"
  | "HorizontalScaling"
  | "Restart"
  | "Reconfiguring"
  | "Start"
  | "Stop"
  | "Expose"
  | "Switchover"
  | "Backup"
  | "Restore"
  | "Custom";

export type OpsRequestPhase =
  | "Pending"
  | "Creating"
  | "Running"
  | "Cancelling"
  | "Cancelled"
  | "Succeed"
  | "Failed"
  | "";

export interface OpsRequestComponentSpec {
  componentName?: string;
  replicas?: number;
  resources?: {
    requests?: { cpu?: string; memory?: string };
    limits?: { cpu?: string; memory?: string };
  };
  volumeClaimTemplates?: {
    name?: string;
    storage?: string;
  }[];
  serviceVersion?: string;
  instances?: { name?: string }[];
}

// Backup types
export type BackupPhase = "New" | "InProgress" | "Running" | "Completed" | "Failed" | "Deleting" | "";

export interface BackupMethod {
  name?: string;
  actionSetName?: string;
  snapshotVolumes?: boolean;
}

// Restore types
export type RestorePhase = "Running" | "Completed" | "Failed" | "AsDataSource" | "";

// Addon types
export type AddonPhase = "Enabled" | "Disabled" | "Enabling" | "Disabling" | "Failed" | "";

export interface AddonInstallSpec {
  enabled?: boolean;
  addonInstallType?: string;
  helm?: {
    chartLocationURL?: string;
    chartsImage?: string;
    chartsPathInImage?: string;
    installOptions?: Record<string, string>;
    installValues?: {
      configMapRefs?: { name?: string; key?: string }[];
      secretRefs?: { name?: string; key?: string }[];
      setValues?: string[];
      setJSONValues?: string[];
    };
    valuesMapping?: Record<string, any>;
  };
}
```

- [ ] **Step 2: Create src/renderer/k8s/kubeblocks/cluster-v1.ts**

```typescript
import { Renderer } from "@freelensapp/extensions";
import type {
  ClusterComponentSpec,
  ClusterPhase,
  ClusterService,
  KubeBlocksKubeObjectCRD,
  KubeBlocksKubeObjectStatus,
} from "./types";

export interface ClusterSpec {
  clusterDefinitionRef?: string;
  clusterDef?: string;
  topology?: string;
  terminationPolicy?: string;
  componentSpecs?: ClusterComponentSpec[];
  services?: ClusterService[];
  backup?: { enabled?: boolean; cronExpression?: string; method?: string; retentionPeriod?: string };
}

export interface ClusterStatus extends KubeBlocksKubeObjectStatus {
  phase?: ClusterPhase;
  components?: Record<string, { phase?: string; message?: string }>;
  clusterDefGeneration?: number;
}

export class Cluster extends Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  ClusterStatus,
  ClusterSpec
> {
  static readonly kind = "Cluster";
  static readonly namespaced = true;
  static readonly apiBase = "/apis/apps.kubeblocks.io/v1/clusters";

  static readonly crd: KubeBlocksKubeObjectCRD = {
    apiVersions: ["apps.kubeblocks.io/v1", "apps.kubeblocks.io/v1alpha1"],
    plural: "clusters",
    singular: "cluster",
    shortNames: ["cl"],
    title: "Clusters",
  };

  static getPhase(object: Cluster): string {
    return object.status?.phase ?? "Unknown";
  }

  static getDefinition(object: Cluster): string {
    return object.spec?.clusterDef ?? object.spec?.clusterDefinitionRef ?? "";
  }

  static getTerminationPolicy(object: Cluster): string {
    return object.spec?.terminationPolicy ?? "";
  }

  static getComponentCount(object: Cluster): number {
    return object.spec?.componentSpecs?.length ?? 0;
  }

  static getStatusMessage(object: Cluster): string {
    return object.status?.message ?? "";
  }

  static getComponentSpecs(object: Cluster): ClusterComponentSpec[] {
    return object.spec?.componentSpecs ?? [];
  }

  static getServices(object: Cluster): ClusterService[] {
    return object.spec?.services ?? [];
  }
}

export class ClusterApi extends Renderer.K8sApi.KubeApi<Cluster> {}
export class ClusterStore extends Renderer.K8sApi.KubeObjectStore<Cluster> {}
```

- [ ] **Step 3: Create src/renderer/k8s/kubeblocks/component-v1.ts**

```typescript
import { Renderer } from "@freelensapp/extensions";
import type { KubeBlocksKubeObjectCRD, KubeBlocksKubeObjectStatus } from "./types";

export interface ComponentSpec {
  compDef?: string;
  componentDef?: string;
  replicas?: number;
  resources?: {
    requests?: { cpu?: string; memory?: string };
    limits?: { cpu?: string; memory?: string };
  };
  volumeClaimTemplates?: {
    name?: string;
    spec?: {
      accessModes?: string[];
      resources?: { requests?: { storage?: string } };
      storageClassName?: string;
    };
  }[];
  serviceVersion?: string;
}

export interface ComponentStatus extends KubeBlocksKubeObjectStatus {
  phase?: string;
  message?: string;
}

export class Component extends Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  ComponentStatus,
  ComponentSpec
> {
  static readonly kind = "Component";
  static readonly namespaced = true;
  static readonly apiBase = "/apis/apps.kubeblocks.io/v1/components";

  static readonly crd: KubeBlocksKubeObjectCRD = {
    apiVersions: ["apps.kubeblocks.io/v1", "apps.kubeblocks.io/v1alpha1"],
    plural: "components",
    singular: "component",
    shortNames: ["cmp"],
    title: "Components",
  };

  static getPhase(object: Component): string {
    return object.status?.phase ?? "Unknown";
  }

  static getDefinition(object: Component): string {
    return object.spec?.compDef ?? object.spec?.componentDef ?? "";
  }

  static getReplicas(object: Component): number {
    return object.spec?.replicas ?? 0;
  }

  static getClusterName(object: Component): string {
    return object.metadata?.labels?.["app.kubernetes.io/instance"] ?? "";
  }
}

export class ComponentApi extends Renderer.K8sApi.KubeApi<Component> {}
export class ComponentStore extends Renderer.K8sApi.KubeObjectStore<Component> {}
```

- [ ] **Step 4: Create src/renderer/k8s/kubeblocks/opsrequest-v1alpha1.ts**

```typescript
import { Renderer } from "@freelensapp/extensions";
import type {
  KubeBlocksKubeObjectCRD,
  KubeBlocksKubeObjectStatus,
  OpsRequestComponentSpec,
  OpsRequestPhase,
  OpsRequestType,
} from "./types";

export interface OpsRequestSpec {
  clusterName?: string;
  clusterRef?: string;
  type?: OpsRequestType;
  ttlSecondsAfterSucceed?: number;
  restart?: OpsRequestComponentSpec[];
  verticalScaling?: OpsRequestComponentSpec[];
  horizontalScaling?: OpsRequestComponentSpec[];
  volumeExpansion?: OpsRequestComponentSpec[];
  upgrade?: { clusterVersionRef?: string; serviceVersion?: string };
  expose?: { componentName?: string; services?: { name?: string; serviceType?: string; ports?: any[] }[] }[];
  switchover?: { componentName?: string; instanceName?: string }[];
  backup?: { backupName?: string; backupMethod?: string; deletionPolicy?: string; retentionPeriod?: string };
  restore?: { backupName?: string; restorePointInTime?: string; volumeRestorePolicy?: string };
}

export interface OpsRequestStatus extends KubeBlocksKubeObjectStatus {
  phase?: OpsRequestPhase;
  progress?: string;
  startTimestamp?: string;
  completionTimestamp?: string;
  components?: Record<string, { phase?: string; message?: string; progressDetails?: any[] }>;
}

export class OpsRequest extends Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  OpsRequestStatus,
  OpsRequestSpec
> {
  static readonly kind = "OpsRequest";
  static readonly namespaced = true;
  static readonly apiBase = "/apis/apps.kubeblocks.io/v1alpha1/opsrequests";

  static readonly crd: KubeBlocksKubeObjectCRD = {
    apiVersions: ["apps.kubeblocks.io/v1alpha1"],
    plural: "opsrequests",
    singular: "opsrequest",
    shortNames: ["ops"],
    title: "Operations",
  };

  static getClusterName(object: OpsRequest): string {
    return object.spec?.clusterName ?? object.spec?.clusterRef ?? "";
  }

  static getType(object: OpsRequest): string {
    return object.spec?.type ?? "";
  }

  static getPhase(object: OpsRequest): string {
    return object.status?.phase ?? "Unknown";
  }

  static getProgress(object: OpsRequest): string {
    return object.status?.progress ?? "";
  }

  static getStartTimestamp(object: OpsRequest): string | undefined {
    return object.status?.startTimestamp;
  }

  static getCompletionTimestamp(object: OpsRequest): string | undefined {
    return object.status?.completionTimestamp;
  }
}

export class OpsRequestApi extends Renderer.K8sApi.KubeApi<OpsRequest> {}
export class OpsRequestStore extends Renderer.K8sApi.KubeObjectStore<OpsRequest> {}
```

- [ ] **Step 5: Create src/renderer/k8s/kubeblocks/cluster-definition-v1.ts**

```typescript
import { Renderer } from "@freelensapp/extensions";
import type { KubeBlocksKubeObjectCRD, KubeBlocksKubeObjectStatus } from "./types";

export interface ClusterDefinitionSpec {
  topologies?: { name?: string; components?: { name?: string; compDef?: string }[]; default?: boolean }[];
}

export interface ClusterDefinitionStatus extends KubeBlocksKubeObjectStatus {
  phase?: string;
  observedGeneration?: number;
}

export class ClusterDefinition extends Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  ClusterDefinitionStatus,
  ClusterDefinitionSpec
> {
  static readonly kind = "ClusterDefinition";
  static readonly namespaced = false;
  static readonly apiBase = "/apis/apps.kubeblocks.io/v1/clusterdefinitions";

  static readonly crd: KubeBlocksKubeObjectCRD = {
    apiVersions: ["apps.kubeblocks.io/v1", "apps.kubeblocks.io/v1alpha1"],
    plural: "clusterdefinitions",
    singular: "clusterdefinition",
    shortNames: ["cd"],
    title: "Cluster Definitions",
  };

  static getProvider(object: ClusterDefinition): string {
    return object.metadata?.labels?.["app.kubernetes.io/name"] ?? "";
  }

  static getDescription(object: ClusterDefinition): string {
    return object.metadata?.annotations?.["apps.kubeblocks.io/description"] ?? "";
  }

  static getTopologies(object: ClusterDefinition): string[] {
    return object.spec?.topologies?.map((t) => t.name ?? "") ?? [];
  }
}

export class ClusterDefinitionApi extends Renderer.K8sApi.KubeApi<ClusterDefinition> {}
export class ClusterDefinitionStore extends Renderer.K8sApi.KubeObjectStore<ClusterDefinition> {}
```

- [ ] **Step 6: Create src/renderer/k8s/kubeblocks/component-definition-v1.ts**

```typescript
import { Renderer } from "@freelensapp/extensions";
import type { KubeBlocksKubeObjectCRD, KubeBlocksKubeObjectStatus } from "./types";

export interface ComponentDefinitionSpec {
  provider?: string;
  description?: string;
  serviceKind?: string;
  serviceVersion?: string;
  runtime?: any;
  roles?: { name?: string; serviceable?: boolean; writable?: boolean; votable?: boolean }[];
  volumes?: { name?: string; needSnapshot?: boolean }[];
  lifecycleActions?: Record<string, any>;
  services?: any[];
}

export interface ComponentDefinitionStatus extends KubeBlocksKubeObjectStatus {
  phase?: string;
  observedGeneration?: number;
}

export class ComponentDefinition extends Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  ComponentDefinitionStatus,
  ComponentDefinitionSpec
> {
  static readonly kind = "ComponentDefinition";
  static readonly namespaced = false;
  static readonly apiBase = "/apis/apps.kubeblocks.io/v1/componentdefinitions";

  static readonly crd: KubeBlocksKubeObjectCRD = {
    apiVersions: ["apps.kubeblocks.io/v1", "apps.kubeblocks.io/v1alpha1"],
    plural: "componentdefinitions",
    singular: "componentdefinition",
    shortNames: ["cmpd"],
    title: "Component Definitions",
  };

  static getProvider(object: ComponentDefinition): string {
    return object.spec?.provider ?? object.metadata?.labels?.["app.kubernetes.io/name"] ?? "";
  }

  static getDescription(object: ComponentDefinition): string {
    return object.spec?.description ?? "";
  }

  static getServiceKind(object: ComponentDefinition): string {
    return object.spec?.serviceKind ?? "";
  }

  static getServiceVersion(object: ComponentDefinition): string {
    return object.spec?.serviceVersion ?? "";
  }
}

export class ComponentDefinitionApi extends Renderer.K8sApi.KubeApi<ComponentDefinition> {}
export class ComponentDefinitionStore extends Renderer.K8sApi.KubeObjectStore<ComponentDefinition> {}
```

- [ ] **Step 7: Create src/renderer/k8s/kubeblocks/backup-v1alpha1.ts**

```typescript
import { Renderer } from "@freelensapp/extensions";
import type { BackupMethod, BackupPhase, KubeBlocksKubeObjectCRD, KubeBlocksKubeObjectStatus } from "./types";

export interface BackupSpec {
  backupPolicyName?: string;
  backupMethod?: string;
  deletionPolicy?: string;
  retentionPeriod?: string;
}

export interface BackupStatus extends KubeBlocksKubeObjectStatus {
  phase?: BackupPhase;
  startTimestamp?: string;
  completionTimestamp?: string;
  expiration?: string;
  duration?: string;
  totalSize?: string;
  backupMethod?: BackupMethod;
  backupRepoName?: string;
  path?: string;
}

export class Backup extends Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  BackupStatus,
  BackupSpec
> {
  static readonly kind = "Backup";
  static readonly namespaced = true;
  static readonly apiBase = "/apis/dataprotection.kubeblocks.io/v1alpha1/backups";

  static readonly crd: KubeBlocksKubeObjectCRD = {
    apiVersions: ["dataprotection.kubeblocks.io/v1alpha1"],
    plural: "backups",
    singular: "backup",
    shortNames: ["bp"],
    title: "Backups",
  };

  static getPhase(object: Backup): string {
    return object.status?.phase ?? "Unknown";
  }

  static getClusterName(object: Backup): string {
    return object.metadata?.labels?.["app.kubernetes.io/instance"] ?? "";
  }

  static getMethod(object: Backup): string {
    return object.spec?.backupMethod ?? object.status?.backupMethod?.name ?? "";
  }

  static getSize(object: Backup): string {
    return object.status?.totalSize ?? "";
  }

  static getDuration(object: Backup): string {
    return object.status?.duration ?? "";
  }

  static getStartTimestamp(object: Backup): string | undefined {
    return object.status?.startTimestamp;
  }

  static getCompletionTimestamp(object: Backup): string | undefined {
    return object.status?.completionTimestamp;
  }
}

export class BackupApi extends Renderer.K8sApi.KubeApi<Backup> {}
export class BackupStore extends Renderer.K8sApi.KubeObjectStore<Backup> {}
```

- [ ] **Step 8: Create src/renderer/k8s/kubeblocks/restore-v1alpha1.ts**

```typescript
import { Renderer } from "@freelensapp/extensions";
import type { KubeBlocksKubeObjectCRD, KubeBlocksKubeObjectStatus, RestorePhase } from "./types";

export interface RestoreSpec {
  backup?: { name?: string; namespace?: string };
  restoreTime?: string;
  prepareDataConfig?: any;
  readyConfig?: any;
}

export interface RestoreStatus extends KubeBlocksKubeObjectStatus {
  phase?: RestorePhase;
  startTimestamp?: string;
  completionTimestamp?: string;
  duration?: string;
}

export class Restore extends Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  RestoreStatus,
  RestoreSpec
> {
  static readonly kind = "Restore";
  static readonly namespaced = true;
  static readonly apiBase = "/apis/dataprotection.kubeblocks.io/v1alpha1/restores";

  static readonly crd: KubeBlocksKubeObjectCRD = {
    apiVersions: ["dataprotection.kubeblocks.io/v1alpha1"],
    plural: "restores",
    singular: "restore",
    shortNames: ["rt"],
    title: "Restores",
  };

  static getPhase(object: Restore): string {
    return object.status?.phase ?? "Unknown";
  }

  static getBackupName(object: Restore): string {
    return object.spec?.backup?.name ?? "";
  }

  static getTargetCluster(object: Restore): string {
    return object.metadata?.labels?.["app.kubernetes.io/instance"] ?? "";
  }

  static getStartTimestamp(object: Restore): string | undefined {
    return object.status?.startTimestamp;
  }

  static getCompletionTimestamp(object: Restore): string | undefined {
    return object.status?.completionTimestamp;
  }
}

export class RestoreApi extends Renderer.K8sApi.KubeApi<Restore> {}
export class RestoreStore extends Renderer.K8sApi.KubeObjectStore<Restore> {}
```

- [ ] **Step 9: Create src/renderer/k8s/kubeblocks/addon-v1alpha1.ts**

```typescript
import { Renderer } from "@freelensapp/extensions";
import type { AddonInstallSpec, AddonPhase, KubeBlocksKubeObjectCRD, KubeBlocksKubeObjectStatus } from "./types";

export interface AddonSpec {
  description?: string;
  type?: string;
  provider?: string;
  version?: string;
  defaultInstallValues?: AddonInstallSpec[];
  installSpec?: AddonInstallSpec;
}

export interface AddonStatus extends KubeBlocksKubeObjectStatus {
  phase?: AddonPhase;
  observedGeneration?: number;
}

export class Addon extends Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  AddonStatus,
  AddonSpec
> {
  static readonly kind = "Addon";
  static readonly namespaced = false;
  static readonly apiBase = "/apis/extensions.kubeblocks.io/v1alpha1/addons";

  static readonly crd: KubeBlocksKubeObjectCRD = {
    apiVersions: ["extensions.kubeblocks.io/v1alpha1"],
    plural: "addons",
    singular: "addon",
    shortNames: ["addon"],
    title: "Addons",
  };

  static getPhase(object: Addon): string {
    return object.status?.phase ?? "Unknown";
  }

  static getType(object: Addon): string {
    return object.spec?.type ?? "";
  }

  static getProvider(object: Addon): string {
    return object.spec?.provider ?? "";
  }

  static getVersion(object: Addon): string {
    return object.spec?.version ?? "";
  }

  static getDescription(object: Addon): string {
    return object.spec?.description ?? "";
  }

  static isEnabled(object: Addon): boolean {
    return object.status?.phase === "Enabled";
  }
}

export class AddonApi extends Renderer.K8sApi.KubeApi<Addon> {}
export class AddonStore extends Renderer.K8sApi.KubeObjectStore<Addon> {}
```

- [ ] **Step 10: Verify build**

Run: `pnpm build:force`
Expected: Build succeeds.

- [ ] **Step 11: Commit**

```bash
git add src/renderer/k8s/
git commit -m "feat: add KubeBlocks CRD types and classes for all 8 resources"
```

---

### Task 4: List Pages (Clusters, Components, Operations)

**Files:**
- Create: `src/renderer/pages/clusters.tsx`
- Create: `src/renderer/pages/clusters.module.scss`
- Create: `src/renderer/pages/components.tsx`
- Create: `src/renderer/pages/components.module.scss`
- Create: `src/renderer/pages/operations.tsx`
- Create: `src/renderer/pages/operations.module.scss`

- [ ] **Step 1: Create src/renderer/pages/clusters.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { withErrorPage } from "../components/error-page";
import { getPhaseClass, getPhaseText } from "../components/status-conditions";
import { Cluster, type ClusterApi } from "../k8s/kubeblocks/cluster-v1";
import styles from "./clusters.module.scss";
import stylesInline from "./clusters.module.scss?inline";

const {
  Component: { Badge, KubeObjectListLayout, KubeObjectAge, NamespaceSelectBadge, WithTooltip },
} = Renderer;

const sortingCallbacks = {
  name: (object: Cluster) => object.getName(),
  namespace: (object: Cluster) => object.getNs(),
  definition: (object: Cluster) => Cluster.getDefinition(object),
  components: (object: Cluster) => Cluster.getComponentCount(object),
  phase: (object: Cluster) => Cluster.getPhase(object),
  age: (object: Cluster) => object.getCreationTimestamp(),
};

const renderTableHeader = [
  { title: "Name", sortBy: "name" as const },
  { title: "Namespace", sortBy: "namespace" as const },
  { title: "Definition", sortBy: "definition" as const, className: styles.definition },
  { title: "Components", sortBy: "components" as const, className: styles.components },
  { title: "Phase", sortBy: "phase" as const, className: styles.phase },
  { title: "Age", sortBy: "age" as const, className: styles.age },
];

export const ClustersPage = observer(() =>
  withErrorPage(() => {
    const store = Cluster.getStore<Cluster>();

    return (
      <>
        <style>{stylesInline}</style>
        <KubeObjectListLayout<Cluster, ClusterApi>
          tableId={`${Cluster.crd.plural}Table`}
          className={styles.page}
          store={store}
          sortingCallbacks={sortingCallbacks}
          searchFilters={[(object: Cluster) => object.getSearchFields()]}
          renderHeaderTitle={Cluster.crd.title}
          renderTableHeader={renderTableHeader}
          renderTableContents={(object: Cluster) => [
            <WithTooltip>{object.getName()}</WithTooltip>,
            <NamespaceSelectBadge key="namespace" namespace={object.getNs() ?? ""} />,
            <WithTooltip>{Cluster.getDefinition(object)}</WithTooltip>,
            Cluster.getComponentCount(object),
            <Badge label={getPhaseText(Cluster.getPhase(object))} className={getPhaseClass(Cluster.getPhase(object))} />,
            <KubeObjectAge object={object} key="age" />,
          ]}
        />
      </>
    );
  }),
);
```

- [ ] **Step 2: Create src/renderer/pages/clusters.module.scss**

```scss
.page {
  :global(.TableCell) {
    &.definition {
      flex-grow: 0.8;
    }

    &.components {
      flex-grow: 0.4;
    }

    &.phase {
      flex-grow: 0.5;
    }

    &.age {
      flex-grow: 0.3;
    }
  }
}
```

- [ ] **Step 3: Create src/renderer/pages/components.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { withErrorPage } from "../components/error-page";
import { getPhaseClass, getPhaseText } from "../components/status-conditions";
import { Component, type ComponentApi } from "../k8s/kubeblocks/component-v1";
import styles from "./components.module.scss";
import stylesInline from "./components.module.scss?inline";

const {
  Component: { Badge, KubeObjectListLayout, KubeObjectAge, NamespaceSelectBadge, WithTooltip },
} = Renderer;

const sortingCallbacks = {
  name: (object: Component) => object.getName(),
  namespace: (object: Component) => object.getNs(),
  cluster: (object: Component) => Component.getClusterName(object),
  definition: (object: Component) => Component.getDefinition(object),
  replicas: (object: Component) => Component.getReplicas(object),
  phase: (object: Component) => Component.getPhase(object),
  age: (object: Component) => object.getCreationTimestamp(),
};

const renderTableHeader = [
  { title: "Name", sortBy: "name" as const },
  { title: "Namespace", sortBy: "namespace" as const },
  { title: "Cluster", sortBy: "cluster" as const, className: styles.cluster },
  { title: "Definition", sortBy: "definition" as const, className: styles.definition },
  { title: "Replicas", sortBy: "replicas" as const, className: styles.replicas },
  { title: "Phase", sortBy: "phase" as const, className: styles.phase },
  { title: "Age", sortBy: "age" as const, className: styles.age },
];

export const ComponentsPage = observer(() =>
  withErrorPage(() => {
    const store = Component.getStore<Component>();

    return (
      <>
        <style>{stylesInline}</style>
        <KubeObjectListLayout<Component, ComponentApi>
          tableId={`${Component.crd.plural}Table`}
          className={styles.page}
          store={store}
          sortingCallbacks={sortingCallbacks}
          searchFilters={[(object: Component) => object.getSearchFields()]}
          renderHeaderTitle={Component.crd.title}
          renderTableHeader={renderTableHeader}
          renderTableContents={(object: Component) => [
            <WithTooltip>{object.getName()}</WithTooltip>,
            <NamespaceSelectBadge key="namespace" namespace={object.getNs() ?? ""} />,
            <WithTooltip>{Component.getClusterName(object)}</WithTooltip>,
            <WithTooltip>{Component.getDefinition(object)}</WithTooltip>,
            Component.getReplicas(object),
            <Badge label={getPhaseText(Component.getPhase(object))} className={getPhaseClass(Component.getPhase(object))} />,
            <KubeObjectAge object={object} key="age" />,
          ]}
        />
      </>
    );
  }),
);
```

- [ ] **Step 4: Create src/renderer/pages/components.module.scss**

```scss
.page {
  :global(.TableCell) {
    &.cluster {
      flex-grow: 0.8;
    }

    &.definition {
      flex-grow: 0.8;
    }

    &.replicas {
      flex-grow: 0.3;
    }

    &.phase {
      flex-grow: 0.5;
    }

    &.age {
      flex-grow: 0.3;
    }
  }
}
```

- [ ] **Step 5: Create src/renderer/pages/operations.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { withErrorPage } from "../components/error-page";
import { getPhaseClass, getPhaseText } from "../components/status-conditions";
import { OpsRequest, type OpsRequestApi } from "../k8s/kubeblocks/opsrequest-v1alpha1";
import { getOpsTypeIcon } from "../utils";
import styles from "./operations.module.scss";
import stylesInline from "./operations.module.scss?inline";

const {
  Component: { Badge, Icon, KubeObjectListLayout, KubeObjectAge, NamespaceSelectBadge, WithTooltip },
} = Renderer;

const sortingCallbacks = {
  name: (object: OpsRequest) => object.getName(),
  namespace: (object: OpsRequest) => object.getNs(),
  cluster: (object: OpsRequest) => OpsRequest.getClusterName(object),
  type: (object: OpsRequest) => OpsRequest.getType(object),
  phase: (object: OpsRequest) => OpsRequest.getPhase(object),
  progress: (object: OpsRequest) => OpsRequest.getProgress(object),
  age: (object: OpsRequest) => object.getCreationTimestamp(),
};

const renderTableHeader = [
  { title: "Name", sortBy: "name" as const },
  { title: "Namespace", sortBy: "namespace" as const },
  { title: "Cluster", sortBy: "cluster" as const, className: styles.cluster },
  { title: "Type", sortBy: "type" as const, className: styles.type },
  { title: "Phase", sortBy: "phase" as const, className: styles.phase },
  { title: "Progress", sortBy: "progress" as const, className: styles.progress },
  { title: "Age", sortBy: "age" as const, className: styles.age },
];

export const OperationsPage = observer(() =>
  withErrorPage(() => {
    const store = OpsRequest.getStore<OpsRequest>();

    return (
      <>
        <style>{stylesInline}</style>
        <KubeObjectListLayout<OpsRequest, OpsRequestApi>
          tableId={`${OpsRequest.crd.plural}Table`}
          className={styles.page}
          store={store}
          sortingCallbacks={sortingCallbacks}
          searchFilters={[(object: OpsRequest) => object.getSearchFields()]}
          renderHeaderTitle={OpsRequest.crd.title}
          renderTableHeader={renderTableHeader}
          renderTableContents={(object: OpsRequest) => [
            <WithTooltip>{object.getName()}</WithTooltip>,
            <NamespaceSelectBadge key="namespace" namespace={object.getNs() ?? ""} />,
            <WithTooltip>{OpsRequest.getClusterName(object)}</WithTooltip>,
            <>
              <Icon small material={getOpsTypeIcon(OpsRequest.getType(object))} />
              {" "}
              {OpsRequest.getType(object)}
            </>,
            <Badge label={getPhaseText(OpsRequest.getPhase(object))} className={getPhaseClass(OpsRequest.getPhase(object))} />,
            <WithTooltip>{OpsRequest.getProgress(object)}</WithTooltip>,
            <KubeObjectAge object={object} key="age" />,
          ]}
        />
      </>
    );
  }),
);
```

- [ ] **Step 6: Create src/renderer/pages/operations.module.scss**

```scss
.page {
  :global(.TableCell) {
    &.cluster {
      flex-grow: 0.8;
    }

    &.type {
      flex-grow: 0.6;
    }

    &.phase {
      flex-grow: 0.5;
    }

    &.progress {
      flex-grow: 0.5;
    }

    &.age {
      flex-grow: 0.3;
    }
  }
}
```

- [ ] **Step 7: Verify build**

Run: `pnpm build:force`
Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/renderer/pages/clusters.tsx src/renderer/pages/clusters.module.scss src/renderer/pages/components.tsx src/renderer/pages/components.module.scss src/renderer/pages/operations.tsx src/renderer/pages/operations.module.scss
git commit -m "feat: add Clusters, Components, and Operations list pages"
```

---

### Task 5: List Pages (Backups, Restores, Definitions, Addons)

**Files:**
- Create: `src/renderer/pages/backups.tsx`
- Create: `src/renderer/pages/backups.module.scss`
- Create: `src/renderer/pages/restores.tsx`
- Create: `src/renderer/pages/restores.module.scss`
- Create: `src/renderer/pages/definitions.tsx`
- Create: `src/renderer/pages/definitions.module.scss`
- Create: `src/renderer/pages/addons.tsx`
- Create: `src/renderer/pages/addons.module.scss`

- [ ] **Step 1: Create src/renderer/pages/backups.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { withErrorPage } from "../components/error-page";
import { getPhaseClass, getPhaseText } from "../components/status-conditions";
import { Backup, type BackupApi } from "../k8s/kubeblocks/backup-v1alpha1";
import styles from "./backups.module.scss";
import stylesInline from "./backups.module.scss?inline";

const {
  Component: { Badge, KubeObjectListLayout, KubeObjectAge, NamespaceSelectBadge, WithTooltip },
} = Renderer;

const sortingCallbacks = {
  name: (object: Backup) => object.getName(),
  namespace: (object: Backup) => object.getNs(),
  cluster: (object: Backup) => Backup.getClusterName(object),
  method: (object: Backup) => Backup.getMethod(object),
  status: (object: Backup) => Backup.getPhase(object),
  size: (object: Backup) => Backup.getSize(object),
  duration: (object: Backup) => Backup.getDuration(object),
  age: (object: Backup) => object.getCreationTimestamp(),
};

const renderTableHeader = [
  { title: "Name", sortBy: "name" as const },
  { title: "Namespace", sortBy: "namespace" as const },
  { title: "Cluster", sortBy: "cluster" as const, className: styles.cluster },
  { title: "Method", sortBy: "method" as const, className: styles.method },
  { title: "Status", sortBy: "status" as const, className: styles.status },
  { title: "Size", sortBy: "size" as const, className: styles.size },
  { title: "Duration", sortBy: "duration" as const, className: styles.duration },
  { title: "Age", sortBy: "age" as const, className: styles.age },
];

export const BackupsPage = observer(() =>
  withErrorPage(() => {
    const store = Backup.getStore<Backup>();

    return (
      <>
        <style>{stylesInline}</style>
        <KubeObjectListLayout<Backup, BackupApi>
          tableId={`${Backup.crd.plural}Table`}
          className={styles.page}
          store={store}
          sortingCallbacks={sortingCallbacks}
          searchFilters={[(object: Backup) => object.getSearchFields()]}
          renderHeaderTitle={Backup.crd.title}
          renderTableHeader={renderTableHeader}
          renderTableContents={(object: Backup) => [
            <WithTooltip>{object.getName()}</WithTooltip>,
            <NamespaceSelectBadge key="namespace" namespace={object.getNs() ?? ""} />,
            <WithTooltip>{Backup.getClusterName(object)}</WithTooltip>,
            <WithTooltip>{Backup.getMethod(object)}</WithTooltip>,
            <Badge label={getPhaseText(Backup.getPhase(object))} className={getPhaseClass(Backup.getPhase(object))} />,
            <WithTooltip>{Backup.getSize(object)}</WithTooltip>,
            <WithTooltip>{Backup.getDuration(object)}</WithTooltip>,
            <KubeObjectAge object={object} key="age" />,
          ]}
        />
      </>
    );
  }),
);
```

- [ ] **Step 2: Create src/renderer/pages/backups.module.scss**

```scss
.page {
  :global(.TableCell) {
    &.cluster {
      flex-grow: 0.8;
    }

    &.method {
      flex-grow: 0.5;
    }

    &.status {
      flex-grow: 0.5;
    }

    &.size {
      flex-grow: 0.3;
    }

    &.duration {
      flex-grow: 0.4;
    }

    &.age {
      flex-grow: 0.3;
    }
  }
}
```

- [ ] **Step 3: Create src/renderer/pages/restores.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { withErrorPage } from "../components/error-page";
import { getPhaseClass, getPhaseText } from "../components/status-conditions";
import { Restore, type RestoreApi } from "../k8s/kubeblocks/restore-v1alpha1";
import styles from "./restores.module.scss";
import stylesInline from "./restores.module.scss?inline";

const {
  Component: { Badge, KubeObjectListLayout, KubeObjectAge, NamespaceSelectBadge, WithTooltip },
} = Renderer;

const sortingCallbacks = {
  name: (object: Restore) => object.getName(),
  namespace: (object: Restore) => object.getNs(),
  backup: (object: Restore) => Restore.getBackupName(object),
  targetCluster: (object: Restore) => Restore.getTargetCluster(object),
  status: (object: Restore) => Restore.getPhase(object),
  age: (object: Restore) => object.getCreationTimestamp(),
};

const renderTableHeader = [
  { title: "Name", sortBy: "name" as const },
  { title: "Namespace", sortBy: "namespace" as const },
  { title: "Backup Source", sortBy: "backup" as const, className: styles.backup },
  { title: "Target Cluster", sortBy: "targetCluster" as const, className: styles.targetCluster },
  { title: "Status", sortBy: "status" as const, className: styles.status },
  { title: "Age", sortBy: "age" as const, className: styles.age },
];

export const RestoresPage = observer(() =>
  withErrorPage(() => {
    const store = Restore.getStore<Restore>();

    return (
      <>
        <style>{stylesInline}</style>
        <KubeObjectListLayout<Restore, RestoreApi>
          tableId={`${Restore.crd.plural}Table`}
          className={styles.page}
          store={store}
          sortingCallbacks={sortingCallbacks}
          searchFilters={[(object: Restore) => object.getSearchFields()]}
          renderHeaderTitle={Restore.crd.title}
          renderTableHeader={renderTableHeader}
          renderTableContents={(object: Restore) => [
            <WithTooltip>{object.getName()}</WithTooltip>,
            <NamespaceSelectBadge key="namespace" namespace={object.getNs() ?? ""} />,
            <WithTooltip>{Restore.getBackupName(object)}</WithTooltip>,
            <WithTooltip>{Restore.getTargetCluster(object)}</WithTooltip>,
            <Badge label={getPhaseText(Restore.getPhase(object))} className={getPhaseClass(Restore.getPhase(object))} />,
            <KubeObjectAge object={object} key="age" />,
          ]}
        />
      </>
    );
  }),
);
```

- [ ] **Step 4: Create src/renderer/pages/restores.module.scss**

```scss
.page {
  :global(.TableCell) {
    &.backup {
      flex-grow: 0.8;
    }

    &.targetCluster {
      flex-grow: 0.8;
    }

    &.status {
      flex-grow: 0.5;
    }

    &.age {
      flex-grow: 0.3;
    }
  }
}
```

- [ ] **Step 5: Create src/renderer/pages/definitions.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { withErrorPage } from "../components/error-page";
import { ClusterDefinition, type ClusterDefinitionApi } from "../k8s/kubeblocks/cluster-definition-v1";
import { ComponentDefinition, type ComponentDefinitionApi } from "../k8s/kubeblocks/component-definition-v1";
import styles from "./definitions.module.scss";
import stylesInline from "./definitions.module.scss?inline";

const {
  Component: { KubeObjectListLayout, KubeObjectAge, WithTooltip, TabLayout },
} = Renderer;

const cdSortingCallbacks = {
  name: (object: ClusterDefinition) => object.getName(),
  provider: (object: ClusterDefinition) => ClusterDefinition.getProvider(object),
  description: (object: ClusterDefinition) => ClusterDefinition.getDescription(object),
  age: (object: ClusterDefinition) => object.getCreationTimestamp(),
};

const cdRenderTableHeader = [
  { title: "Name", sortBy: "name" as const },
  { title: "Provider", sortBy: "provider" as const, className: styles.provider },
  { title: "Description", sortBy: "description" as const, className: styles.description },
  { title: "Age", sortBy: "age" as const, className: styles.age },
];

const cmpSortingCallbacks = {
  name: (object: ComponentDefinition) => object.getName(),
  serviceKind: (object: ComponentDefinition) => ComponentDefinition.getServiceKind(object),
  serviceVersion: (object: ComponentDefinition) => ComponentDefinition.getServiceVersion(object),
  provider: (object: ComponentDefinition) => ComponentDefinition.getProvider(object),
  age: (object: ComponentDefinition) => object.getCreationTimestamp(),
};

const cmpRenderTableHeader = [
  { title: "Name", sortBy: "name" as const },
  { title: "Service Kind", sortBy: "serviceKind" as const, className: styles.serviceKind },
  { title: "Service Version", sortBy: "serviceVersion" as const, className: styles.serviceVersion },
  { title: "Provider", sortBy: "provider" as const, className: styles.provider },
  { title: "Age", sortBy: "age" as const, className: styles.age },
];

const ClusterDefinitionsTab = observer(() =>
  withErrorPage(() => {
    const store = ClusterDefinition.getStore<ClusterDefinition>();

    return (
      <KubeObjectListLayout<ClusterDefinition, ClusterDefinitionApi>
        tableId={`${ClusterDefinition.crd.plural}Table`}
        className={styles.page}
        store={store}
        sortingCallbacks={cdSortingCallbacks}
        searchFilters={[(object: ClusterDefinition) => object.getSearchFields()]}
        renderHeaderTitle={ClusterDefinition.crd.title}
        renderTableHeader={cdRenderTableHeader}
        renderTableContents={(object: ClusterDefinition) => [
          <WithTooltip>{object.getName()}</WithTooltip>,
          <WithTooltip>{ClusterDefinition.getProvider(object)}</WithTooltip>,
          <WithTooltip>{ClusterDefinition.getDescription(object)}</WithTooltip>,
          <KubeObjectAge object={object} key="age" />,
        ]}
      />
    );
  }),
);

const ComponentDefinitionsTab = observer(() =>
  withErrorPage(() => {
    const store = ComponentDefinition.getStore<ComponentDefinition>();

    return (
      <KubeObjectListLayout<ComponentDefinition, ComponentDefinitionApi>
        tableId={`${ComponentDefinition.crd.plural}Table`}
        className={styles.page}
        store={store}
        sortingCallbacks={cmpSortingCallbacks}
        searchFilters={[(object: ComponentDefinition) => object.getSearchFields()]}
        renderHeaderTitle={ComponentDefinition.crd.title}
        renderTableHeader={cmpRenderTableHeader}
        renderTableContents={(object: ComponentDefinition) => [
          <WithTooltip>{object.getName()}</WithTooltip>,
          <WithTooltip>{ComponentDefinition.getServiceKind(object)}</WithTooltip>,
          <WithTooltip>{ComponentDefinition.getServiceVersion(object)}</WithTooltip>,
          <WithTooltip>{ComponentDefinition.getProvider(object)}</WithTooltip>,
          <KubeObjectAge object={object} key="age" />,
        ]}
      />
    );
  }),
);

export const DefinitionsPage = observer(() => {
  return (
    <>
      <style>{stylesInline}</style>
      <TabLayout>
        <div data-tab-id="cluster-definitions" data-title="Cluster Definitions">
          <ClusterDefinitionsTab />
        </div>
        <div data-tab-id="component-definitions" data-title="Component Definitions">
          <ComponentDefinitionsTab />
        </div>
      </TabLayout>
    </>
  );
});
```

- [ ] **Step 6: Create src/renderer/pages/definitions.module.scss**

```scss
.page {
  :global(.TableCell) {
    &.provider {
      flex-grow: 0.6;
    }

    &.description {
      flex-grow: 1.5;
    }

    &.serviceKind {
      flex-grow: 0.6;
    }

    &.serviceVersion {
      flex-grow: 0.5;
    }

    &.age {
      flex-grow: 0.3;
    }
  }
}
```

- [ ] **Step 7: Create src/renderer/pages/addons.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { withErrorPage } from "../components/error-page";
import { getPhaseClass, getPhaseText } from "../components/status-conditions";
import { Addon, type AddonApi } from "../k8s/kubeblocks/addon-v1alpha1";
import styles from "./addons.module.scss";
import stylesInline from "./addons.module.scss?inline";

const {
  Component: { Badge, KubeObjectListLayout, KubeObjectAge, WithTooltip },
} = Renderer;

const sortingCallbacks = {
  name: (object: Addon) => object.getName(),
  type: (object: Addon) => Addon.getType(object),
  status: (object: Addon) => Addon.getPhase(object),
  provider: (object: Addon) => Addon.getProvider(object),
  version: (object: Addon) => Addon.getVersion(object),
  age: (object: Addon) => object.getCreationTimestamp(),
};

const renderTableHeader = [
  { title: "Name", sortBy: "name" as const },
  { title: "Type", sortBy: "type" as const, className: styles.type },
  { title: "Status", sortBy: "status" as const, className: styles.status },
  { title: "Provider", sortBy: "provider" as const, className: styles.provider },
  { title: "Version", sortBy: "version" as const, className: styles.version },
  { title: "Age", sortBy: "age" as const, className: styles.age },
];

export const AddonsPage = observer(() =>
  withErrorPage(() => {
    const store = Addon.getStore<Addon>();

    return (
      <>
        <style>{stylesInline}</style>
        <KubeObjectListLayout<Addon, AddonApi>
          tableId={`${Addon.crd.plural}Table`}
          className={styles.page}
          store={store}
          sortingCallbacks={sortingCallbacks}
          searchFilters={[(object: Addon) => object.getSearchFields()]}
          renderHeaderTitle={Addon.crd.title}
          renderTableHeader={renderTableHeader}
          renderTableContents={(object: Addon) => [
            <WithTooltip>{object.getName()}</WithTooltip>,
            <WithTooltip>{Addon.getType(object)}</WithTooltip>,
            <Badge label={getPhaseText(Addon.getPhase(object))} className={getPhaseClass(Addon.getPhase(object))} />,
            <WithTooltip>{Addon.getProvider(object)}</WithTooltip>,
            <WithTooltip>{Addon.getVersion(object)}</WithTooltip>,
            <KubeObjectAge object={object} key="age" />,
          ]}
        />
      </>
    );
  }),
);
```

- [ ] **Step 8: Create src/renderer/pages/addons.module.scss**

```scss
.page {
  :global(.TableCell) {
    &.type {
      flex-grow: 0.5;
    }

    &.status {
      flex-grow: 0.5;
    }

    &.provider {
      flex-grow: 0.6;
    }

    &.version {
      flex-grow: 0.4;
    }

    &.age {
      flex-grow: 0.3;
    }
  }
}
```

- [ ] **Step 9: Verify build**

Run: `pnpm build:force`
Expected: Build succeeds.

- [ ] **Step 10: Commit**

```bash
git add src/renderer/pages/backups.tsx src/renderer/pages/backups.module.scss src/renderer/pages/restores.tsx src/renderer/pages/restores.module.scss src/renderer/pages/definitions.tsx src/renderer/pages/definitions.module.scss src/renderer/pages/addons.tsx src/renderer/pages/addons.module.scss
git commit -m "feat: add Backups, Restores, Definitions, and Addons list pages"
```

---

### Task 6: Overview Dashboard & Events

**Files:**
- Create: `src/renderer/components/pie-chart.tsx`
- Create: `src/renderer/components/pie-chart.module.scss`
- Create: `src/renderer/components/kubeblocks-events.tsx`
- Create: `src/renderer/pages/overview.tsx`
- Create: `src/renderer/pages/overview.module.scss`

- [ ] **Step 1: Create src/renderer/components/pie-chart.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import styles from "./pie-chart.module.scss";
import stylesInline from "./pie-chart.module.scss?inline";

import type React from "react";
import type { Cluster } from "../k8s/kubeblocks/cluster-v1";

const getPhaseStats = (objects: Cluster[]) => {
  const running = objects.filter((o) => o.status?.phase === "Running").length;
  const stopped = objects.filter((o) => o.status?.phase === "Stopped").length;
  const failed = objects.filter((o) => o.status?.phase === "Failed" || o.status?.phase === "Abnormal").length;
  const creating = objects.filter((o) => o.status?.phase === "Creating" || o.status?.phase === "Updating").length;
  const other = objects.length - running - stopped - failed - creating;
  return { running, stopped, failed, creating, other };
};

export interface ClusterPhasePieChartProps {
  objects: Cluster[];
  title: string;
}

export function ClusterPhasePieChart(props: ClusterPhasePieChartProps): React.ReactElement {
  const { objects, title } = props;
  const { running, stopped, failed, creating, other } = getPhaseStats(objects);

  const chartData = {
    datasets: [
      {
        data: [running, creating, stopped, failed, other],
        backgroundColor: ["#43a047", "#FF6600", "#3d90ce", "#ce3933", "#3a3a3c"],
        tooltipLabels: [
          (percent: string) => `Running: ${percent}`,
          (percent: string) => `Creating/Updating: ${percent}`,
          (percent: string) => `Stopped: ${percent}`,
          (percent: string) => `Failed: ${percent}`,
          (percent: string) => `Other: ${percent}`,
        ],
      },
    ],
    labels: [
      `Running: ${running}`,
      `Creating/Updating: ${creating}`,
      `Stopped: ${stopped}`,
      `Failed: ${failed}`,
      `Other: ${other}`,
    ],
  } as unknown as Renderer.Component.PieChartData;

  return (
    <>
      <style>{stylesInline}</style>
      <div className={styles.title}>
        <span>{title} ({objects.length})</span>
      </div>
      <Renderer.Component.PieChart data={chartData} />
    </>
  );
}
```

- [ ] **Step 2: Create src/renderer/components/pie-chart.module.scss**

```scss
.title {
  text-align: center;
}
```

- [ ] **Step 3: Create src/renderer/components/kubeblocks-events.tsx**

```typescript
import { Common, Renderer } from "@freelensapp/extensions";
import { computed, makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import moment from "moment";
import React from "react";
import { Link } from "react-router-dom";

const {
  Component: {
    KubeObjectListLayout,
    Icon,
    KubeObjectAge,
    NamespaceSelectBadge,
    WithTooltip,
    TabLayout,
    ReactiveDuration,
  },
  Navigation: { getDetailsUrl },
  K8sApi: { eventStore, apiManager },
} = Renderer;

const {
  Util: { cssNames, stopPropagation },
} = Common;

function isKubeBlocksEvent(event: Renderer.K8sApi.KubeEvent): boolean {
  const apiVersion = event?.involvedObject?.apiVersion ?? "";
  return (
    apiVersion.includes("apps.kubeblocks.io/") ||
    apiVersion.includes("dataprotection.kubeblocks.io/") ||
    apiVersion.includes("extensions.kubeblocks.io/")
  );
}

enum columnId {
  message = "message",
  namespace = "namespace",
  object = "object",
  type = "type",
  count = "count",
  source = "source",
  age = "age",
  lastSeen = "last-seen",
}

export interface KubeBlocksEventsProps {
  className?: string;
  compact?: boolean;
  compactLimit?: number;
}

@observer
export class KubeBlocksEvents extends React.Component<KubeBlocksEventsProps> {
  readonly sorting = observable.object({
    sortBy: columnId.age,
    orderBy: "asc" as "asc" | "desc",
  });

  private sortingCallbacks = {
    [columnId.namespace]: (event: Renderer.K8sApi.KubeEvent) => event.getNs(),
    [columnId.type]: (event: Renderer.K8sApi.KubeEvent) => event.type,
    [columnId.object]: (event: Renderer.K8sApi.KubeEvent) => event.involvedObject.name,
    [columnId.count]: (event: Renderer.K8sApi.KubeEvent) => event.count,
    [columnId.age]: (event: Renderer.K8sApi.KubeEvent) => -event.getCreationTimestamp(),
    [columnId.lastSeen]: (event: Renderer.K8sApi.KubeEvent) =>
      event.lastTimestamp ? -new Date(event.lastTimestamp).getTime() : 0,
  };

  constructor(props: KubeBlocksEventsProps) {
    super(props);
    makeObservable(this);
  }

  @computed get items(): Renderer.K8sApi.KubeEvent[] {
    const items = eventStore.contextItems.filter(isKubeBlocksEvent);
    const { sortBy, orderBy } = this.sorting;

    return [...items].sort((a, b) => {
      const valA = this.sortingCallbacks[sortBy](a);
      const valB = this.sortingCallbacks[sortBy](b);
      if (valA === valB) return 0;
      const compare = valA > valB ? 1 : -1;
      return orderBy === "asc" ? compare : -compare;
    });
  }

  @computed get visibleItems(): Renderer.K8sApi.KubeEvent[] {
    const { compact, compactLimit } = this.props;
    if (compact) {
      return this.items.slice(0, compactLimit);
    }
    return this.items;
  }

  customizeHeader = ({ info, title, ...headerPlaceholders }: any) => {
    const { compact } = this.props;
    const { items, visibleItems } = this;
    const allEventsAreShown = visibleItems.length === items.length;

    if (compact) {
      if (allEventsAreShown) {
        return { title };
      }
      return {
        title,
        info: (
          <span>
            {"("}
            {visibleItems.length}
            {" of "}
            {items.length}
            {")"}
          </span>
        ),
      };
    }

    return {
      info: (
        <>
          {info}
          <Icon small material="help_outline" className="help-icon" tooltip={`Limited to ${eventStore.limit}`} />
        </>
      ),
      title,
      ...headerPlaceholders,
    };
  };

  render() {
    const { compact, className, ...layoutProps } = this.props;

    const events = (
      <KubeObjectListLayout
        {...layoutProps}
        isConfigurable
        tableId="kubeblocks-events"
        store={eventStore}
        className={cssNames("Events", className, { compact })}
        renderHeaderTitle="KubeBlocks Events"
        customizeHeader={this.customizeHeader}
        isSelectable={false}
        getItems={() => this.visibleItems}
        virtual={!compact}
        tableProps={{
          sortSyncWithUrl: false,
          sortByDefault: this.sorting,
          onSort: (params) => Object.assign(this.sorting, params),
        }}
        sortingCallbacks={this.sortingCallbacks}
        searchFilters={[
          (event) => event.getSearchFields(),
          (event) => event.message,
          (event) => event.getSource(),
          (event) => event.involvedObject.name,
        ]}
        renderTableHeader={[
          { title: "Type", className: "type", sortBy: columnId.type, id: columnId.type },
          { title: "Message", className: "message", id: columnId.message },
          { title: "Namespace", className: "namespace", sortBy: columnId.namespace, id: columnId.namespace },
          { title: "Involved Object", className: "object", sortBy: columnId.object, id: columnId.object },
          { title: "Source", className: "source", id: columnId.source },
          { title: "Count", className: "count", sortBy: columnId.count, id: columnId.count },
          { title: "Age", className: "age", sortBy: columnId.age, id: columnId.age },
          { title: "Last Seen", className: "last-seen", sortBy: columnId.lastSeen, id: columnId.lastSeen },
        ]}
        renderTableContents={(event) => {
          const { involvedObject, type, message } = event;
          const isWarning = event.isWarning();

          return [
            <WithTooltip>{type}</WithTooltip>,
            {
              className: cssNames({ warning: isWarning }),
              title: <WithTooltip>{message}</WithTooltip>,
            },
            <NamespaceSelectBadge key="namespace" namespace={event.getNs()} />,
            <Link
              key="link"
              to={getDetailsUrl(apiManager.lookupApiLink(involvedObject, event))}
              onClick={stopPropagation}
            >
              <WithTooltip>{`${involvedObject.kind}: ${involvedObject.name}`}</WithTooltip>
            </Link>,
            <WithTooltip>{event.getSource()}</WithTooltip>,
            event.count,
            <KubeObjectAge key="age" object={event} />,
            <WithTooltip tooltip={event.lastTimestamp ? moment(event.lastTimestamp).toDate() : undefined}>
              <ReactiveDuration key="last-seen" timestamp={event.lastTimestamp} />
            </WithTooltip>,
          ];
        }}
      />
    );

    if (compact) {
      return events;
    }

    return <TabLayout>{events}</TabLayout>;
  }
}
```

- [ ] **Step 4: Create src/renderer/pages/overview.tsx**

```typescript
import { Common, Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { useEffect, useRef, useState } from "react";
import { InfoPage } from "../components/info-page";
import { KubeBlocksEvents } from "../components/kubeblocks-events";
import { ClusterPhasePieChart } from "../components/pie-chart";
import { Backup } from "../k8s/kubeblocks/backup-v1alpha1";
import { Cluster } from "../k8s/kubeblocks/cluster-v1";
import { Component } from "../k8s/kubeblocks/component-v1";
import { OpsRequest } from "../k8s/kubeblocks/opsrequest-v1alpha1";
import { Restore } from "../k8s/kubeblocks/restore-v1alpha1";
import styles from "./overview.module.scss";
import stylesInline from "./overview.module.scss?inline";

const {
  Component: { NamespaceSelectFilter, TabLayout, Badge, WithTooltip, KubeObjectAge },
} = Renderer;

const {
  Util: { cssNames },
} = Common;

export const KubeBlocksOverviewPage = observer(() => {
  const [loaded, setLoaded] = useState(false);
  const watches = useRef<(() => void)[]>([]);
  const abortController = useRef(new AbortController());

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const namespaceStore = Renderer.K8sApi.namespaceStore;
      await namespaceStore.loadAll({ namespaces: [], reqInit: { signal: abortController.current.signal } });
      watches.current.push(namespaceStore.subscribe());

      const namespaces = namespaceStore.items.map((ns) => ns.getName());

      for (const object of [Cluster, Component, OpsRequest, Backup, Restore]) {
        try {
          const store = object.getStore();
          if (!store) continue;
          await store.loadAll({ namespaces, reqInit: { signal: abortController.current.signal } });
          watches.current.push(store.subscribe());
        } catch (_) {
          continue;
        }
      }

      if (isMounted) setLoaded(true);
    })();

    return () => {
      isMounted = false;
      abortController.current.abort();
      watches.current.forEach((w) => w());
      watches.current = [];
    };
  }, []);

  if (!loaded) {
    return <InfoPage message="Loading KubeBlocks resources..." />;
  }

  let clusters: Cluster[] = [];
  try {
    const store = Cluster.getStore<Cluster>();
    if (store) clusters = store.contextItems;
  } catch (_) {}

  let activeOps: OpsRequest[] = [];
  try {
    const store = OpsRequest.getStore<OpsRequest>();
    if (store) {
      activeOps = store.contextItems.filter(
        (o) => o.status?.phase === "Running" || o.status?.phase === "Creating" || o.status?.phase === "Pending",
      );
    }
  } catch (_) {}

  let recentBackups: Backup[] = [];
  try {
    const store = Backup.getStore<Backup>();
    if (store) {
      recentBackups = [...store.contextItems]
        .sort((a, b) => b.getCreationTimestamp() - a.getCreationTimestamp())
        .slice(0, 10);
    }
  } catch (_) {}

  let recentRestores: Restore[] = [];
  try {
    const store = Restore.getStore<Restore>();
    if (store) {
      recentRestores = [...store.contextItems]
        .sort((a, b) => b.getCreationTimestamp() - a.getCreationTimestamp())
        .slice(0, 10);
    }
  } catch (_) {}

  return (
    <>
      <style>{stylesInline}</style>
      <TabLayout>
        <div className={styles.content}>
          <header>
            <h5>KubeBlocks Overview</h5>
            <NamespaceSelectFilter id="kubeblocks-overview-namespace-filter" />
          </header>

          {clusters.length > 0 && (
            <div className={styles.overviewStatuses}>
              <div className={styles.statuses}>
                <div className={cssNames(styles.chartColumn, "column")}>
                  <ClusterPhasePieChart title="Cluster Status" objects={clusters} />
                </div>
              </div>
            </div>
          )}

          {activeOps.length > 0 && (
            <div className={styles.section}>
              <h6>Active Operations ({activeOps.length})</h6>
              <div className={styles.table}>
                {activeOps.map((op) => (
                  <div key={op.getId()} className={styles.tableRow}>
                    <span><WithTooltip>{op.getName()}</WithTooltip></span>
                    <span>{OpsRequest.getClusterName(op)}</span>
                    <span>{OpsRequest.getType(op)}</span>
                    <Badge label={OpsRequest.getPhase(op)} className="warning" />
                    <KubeObjectAge object={op} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {(recentBackups.length > 0 || recentRestores.length > 0) && (
            <div className={styles.section}>
              <h6>Recent Backups & Restores</h6>
              <div className={styles.table}>
                {recentBackups.map((bp) => (
                  <div key={bp.getId()} className={styles.tableRow}>
                    <span><WithTooltip>{bp.getName()}</WithTooltip></span>
                    <span>Backup</span>
                    <span>{Backup.getClusterName(bp)}</span>
                    <Badge label={Backup.getPhase(bp)} className={Backup.getPhase(bp) === "Completed" ? "success" : ""} />
                    <KubeObjectAge object={bp} />
                  </div>
                ))}
                {recentRestores.map((rt) => (
                  <div key={rt.getId()} className={styles.tableRow}>
                    <span><WithTooltip>{rt.getName()}</WithTooltip></span>
                    <span>Restore</span>
                    <span>{Restore.getTargetCluster(rt)}</span>
                    <Badge label={Restore.getPhase(rt)} className={Restore.getPhase(rt) === "Completed" ? "success" : ""} />
                    <KubeObjectAge object={rt} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <KubeBlocksEvents compact compactLimit={100} />
        </div>
      </TabLayout>
    </>
  );
});
```

- [ ] **Step 5: Create src/renderer/pages/overview.module.scss**

```scss
@use "../vars";

.overviewStatuses {
  background: var(--contentColor);
}

.statuses {
  display: grid;
  grid-template-columns: repeat(auto-fit, 120px);
  justify-content: space-evenly;
  grid-gap: 8px;
  padding: 16px;
}

.chartColumn {
  align-self: end;
}

.content {
  --flex-gap: #{vars.$padding * 2};
  min-height: 100%;
  height: 100%;
  overflow-y: auto;

  header {
    background: var(--contentColor);
    position: relative;
    padding: vars.$padding * 2;
    text-align: center;
    padding-bottom: 3em;

    h5 {
      color: var(--textColorPrimary);
    }
  }
}

.section {
  background: var(--contentColor);
  padding: vars.$padding * 2;
  margin-top: vars.$margin;

  h6 {
    color: var(--textColorPrimary);
    margin-bottom: vars.$margin;
  }
}

.table {
  display: flex;
  flex-direction: column;
  gap: vars.$gap;
}

.tableRow {
  display: flex;
  align-items: center;
  gap: vars.$gap * 2;
  padding: vars.$padding;
  border-bottom: 1px solid var(--borderFaintColor);

  span {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
```

- [ ] **Step 6: Verify build**

Run: `pnpm build:force`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/renderer/components/pie-chart.tsx src/renderer/components/pie-chart.module.scss src/renderer/components/kubeblocks-events.tsx src/renderer/pages/overview.tsx src/renderer/pages/overview.module.scss
git commit -m "feat: add Overview dashboard with pie charts and event stream"
```

---

### Task 7: Detail Views (Cluster, Component, OpsRequest)

**Files:**
- Create: `src/renderer/components/details/cluster-details.tsx`
- Create: `src/renderer/components/details/cluster-details.module.scss`
- Create: `src/renderer/components/details/component-details.tsx`
- Create: `src/renderer/components/details/component-details.module.scss`
- Create: `src/renderer/components/details/opsrequest-details.tsx`
- Create: `src/renderer/components/details/opsrequest-details.module.scss`

- [ ] **Step 1: Create src/renderer/components/details/cluster-details.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { observer } from "mobx-react";
import { Cluster } from "../../k8s/kubeblocks/cluster-v1";
import { defaultYamlDumpOptions, getHeight } from "../../utils";
import { DurationAbsoluteTimestamp } from "../duration-absolute";
import { getPhaseClass, getPhaseText } from "../status-conditions";
import styles from "./cluster-details.module.scss";
import stylesInline from "./cluster-details.module.scss?inline";

const {
  Component: { Badge, DrawerItem, DrawerTitle, MonacoEditor, Table, TableCell, TableHead, TableRow, WithTooltip },
} = Renderer;

export const ClusterDetails: React.FC<Renderer.Component.KubeObjectDetailsProps<Cluster>> = observer((props) => {
  const { object } = props;
  const specYaml = yaml.dump(object.spec ?? {}, defaultYamlDumpOptions);
  const componentSpecs = Cluster.getComponentSpecs(object);
  const services = Cluster.getServices(object);

  return (
    <>
      <style>{stylesInline}</style>
      <div className={styles.details}>
        <DrawerItem name="Definition">{Cluster.getDefinition(object)}</DrawerItem>
        <DrawerItem name="Termination Policy">{Cluster.getTerminationPolicy(object)}</DrawerItem>
        <DrawerItem name="Phase">
          <Badge label={getPhaseText(Cluster.getPhase(object))} className={getPhaseClass(Cluster.getPhase(object))} />
        </DrawerItem>
        <DrawerItem name="Status Message" hidden={!Cluster.getStatusMessage(object)}>
          {Cluster.getStatusMessage(object)}
        </DrawerItem>

        {componentSpecs.length > 0 && (
          <div>
            <DrawerTitle>Components ({componentSpecs.length})</DrawerTitle>
            <Table selectable tableId="kubeblocks-cluster-components" scrollable={false} sortSyncWithUrl={false}>
              <TableHead flat sticky={false}>
                <TableCell>Name</TableCell>
                <TableCell>Definition</TableCell>
                <TableCell>Replicas</TableCell>
                <TableCell>CPU</TableCell>
                <TableCell>Memory</TableCell>
                <TableCell>Storage</TableCell>
              </TableHead>
              {componentSpecs.map((comp, i) => (
                <TableRow key={`comp-${i}`} nowrap>
                  <TableCell><WithTooltip>{comp.name ?? ""}</WithTooltip></TableCell>
                  <TableCell><WithTooltip>{comp.componentDef ?? comp.componentDefRef ?? ""}</WithTooltip></TableCell>
                  <TableCell>{comp.replicas ?? 0}</TableCell>
                  <TableCell>{comp.resources?.requests?.cpu ?? comp.resources?.limits?.cpu ?? ""}</TableCell>
                  <TableCell>{comp.resources?.requests?.memory ?? comp.resources?.limits?.memory ?? ""}</TableCell>
                  <TableCell>{comp.volumeClaimTemplates?.[0]?.spec?.resources?.requests?.storage ?? ""}</TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        )}

        {services.length > 0 && (
          <div>
            <DrawerTitle>Services ({services.length})</DrawerTitle>
            {services.map((svc, i) => (
              <DrawerItem key={`svc-${i}`} name={svc.name ?? svc.serviceName ?? `Service ${i}`}>
                Type: {svc.type ?? "ClusterIP"}
                {svc.ports?.map((p) => `, ${p.name ?? ""}:${p.port}`).join("")}
              </DrawerItem>
            ))}
          </div>
        )}

        {object.status?.conditions && object.status.conditions.length > 0 && (
          <div>
            <DrawerTitle>Conditions</DrawerTitle>
            {object.status.conditions.map((condition, i) => (
              <div key={`condition-${i}`}>
                <DrawerItem name="Type">{condition.type}</DrawerItem>
                <DrawerItem name="Status">{condition.status}</DrawerItem>
                <DrawerItem name="Message" hidden={!condition.message}>{condition.message}</DrawerItem>
              </div>
            ))}
          </div>
        )}

        <DrawerTitle>Spec</DrawerTitle>
        <MonacoEditor
          readOnly
          className={styles.editor}
          style={{ minHeight: getHeight(specYaml) }}
          value={specYaml}
          setInitialHeight
          options={{ scrollbar: { alwaysConsumeMouseWheel: false } }}
        />
      </div>
    </>
  );
});
```

- [ ] **Step 2: Create src/renderer/components/details/cluster-details.module.scss**

```scss
@use "../../vars";

.details {
  .title {
    margin-top: vars.$margin * 2;
    margin-bottom: vars.$margin;
  }
}

.editor {
  resize: none;
  overflow: hidden;
  border: 1px solid var(--borderFaintColor);
  border-radius: 4px;
}
```

- [ ] **Step 3: Create src/renderer/components/details/component-details.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { observer } from "mobx-react";
import { Component } from "../../k8s/kubeblocks/component-v1";
import { defaultYamlDumpOptions, getHeight } from "../../utils";
import { getPhaseClass, getPhaseText } from "../status-conditions";
import styles from "./component-details.module.scss";
import stylesInline from "./component-details.module.scss?inline";

const {
  Component: { Badge, DrawerItem, DrawerTitle, MonacoEditor },
} = Renderer;

export const ComponentDetails: React.FC<Renderer.Component.KubeObjectDetailsProps<Component>> = observer((props) => {
  const { object } = props;
  const specYaml = yaml.dump(object.spec ?? {}, defaultYamlDumpOptions);

  return (
    <>
      <style>{stylesInline}</style>
      <div className={styles.details}>
        <DrawerItem name="Cluster">{Component.getClusterName(object)}</DrawerItem>
        <DrawerItem name="Definition">{Component.getDefinition(object)}</DrawerItem>
        <DrawerItem name="Replicas">{Component.getReplicas(object)}</DrawerItem>
        <DrawerItem name="Phase">
          <Badge label={getPhaseText(Component.getPhase(object))} className={getPhaseClass(Component.getPhase(object))} />
        </DrawerItem>

        <DrawerItem name="CPU Request" hidden={!object.spec?.resources?.requests?.cpu}>
          {object.spec?.resources?.requests?.cpu}
        </DrawerItem>
        <DrawerItem name="CPU Limit" hidden={!object.spec?.resources?.limits?.cpu}>
          {object.spec?.resources?.limits?.cpu}
        </DrawerItem>
        <DrawerItem name="Memory Request" hidden={!object.spec?.resources?.requests?.memory}>
          {object.spec?.resources?.requests?.memory}
        </DrawerItem>
        <DrawerItem name="Memory Limit" hidden={!object.spec?.resources?.limits?.memory}>
          {object.spec?.resources?.limits?.memory}
        </DrawerItem>

        {object.status?.conditions && object.status.conditions.length > 0 && (
          <div>
            <DrawerTitle>Conditions</DrawerTitle>
            {object.status.conditions.map((condition, i) => (
              <div key={`condition-${i}`}>
                <DrawerItem name="Type">{condition.type}</DrawerItem>
                <DrawerItem name="Status">{condition.status}</DrawerItem>
                <DrawerItem name="Message" hidden={!condition.message}>{condition.message}</DrawerItem>
              </div>
            ))}
          </div>
        )}

        <DrawerTitle>Spec</DrawerTitle>
        <MonacoEditor
          readOnly
          className={styles.editor}
          style={{ minHeight: getHeight(specYaml) }}
          value={specYaml}
          setInitialHeight
          options={{ scrollbar: { alwaysConsumeMouseWheel: false } }}
        />
      </div>
    </>
  );
});
```

- [ ] **Step 4: Create src/renderer/components/details/component-details.module.scss**

```scss
@use "../../vars";

.details {
  .title {
    margin-top: vars.$margin * 2;
    margin-bottom: vars.$margin;
  }
}

.editor {
  resize: none;
  overflow: hidden;
  border: 1px solid var(--borderFaintColor);
  border-radius: 4px;
}
```

- [ ] **Step 5: Create src/renderer/components/details/opsrequest-details.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { observer } from "mobx-react";
import { OpsRequest } from "../../k8s/kubeblocks/opsrequest-v1alpha1";
import { defaultYamlDumpOptions, getHeight, getOpsTypeIcon } from "../../utils";
import { DurationAbsoluteTimestamp } from "../duration-absolute";
import { getPhaseClass, getPhaseText } from "../status-conditions";
import styles from "./opsrequest-details.module.scss";
import stylesInline from "./opsrequest-details.module.scss?inline";

const {
  Component: { Badge, DrawerItem, DrawerTitle, Icon, MonacoEditor },
} = Renderer;

export const OpsRequestDetails: React.FC<Renderer.Component.KubeObjectDetailsProps<OpsRequest>> = observer((props) => {
  const { object } = props;
  const specYaml = yaml.dump(object.spec ?? {}, defaultYamlDumpOptions);
  const opsType = OpsRequest.getType(object);

  return (
    <>
      <style>{stylesInline}</style>
      <div className={styles.details}>
        <DrawerItem name="Cluster">{OpsRequest.getClusterName(object)}</DrawerItem>
        <DrawerItem name="Type">
          <Icon small material={getOpsTypeIcon(opsType)} /> {opsType}
        </DrawerItem>
        <DrawerItem name="Phase">
          <Badge label={getPhaseText(OpsRequest.getPhase(object))} className={getPhaseClass(OpsRequest.getPhase(object))} />
        </DrawerItem>
        <DrawerItem name="Progress" hidden={!OpsRequest.getProgress(object)}>
          {OpsRequest.getProgress(object)}
        </DrawerItem>

        <DrawerItem name="Started" hidden={!OpsRequest.getStartTimestamp(object)}>
          <DurationAbsoluteTimestamp timestamp={OpsRequest.getStartTimestamp(object)} />
        </DrawerItem>
        <DrawerItem name="Completed" hidden={!OpsRequest.getCompletionTimestamp(object)}>
          <DurationAbsoluteTimestamp timestamp={OpsRequest.getCompletionTimestamp(object)} />
        </DrawerItem>

        {object.status?.conditions && object.status.conditions.length > 0 && (
          <div>
            <DrawerTitle>Conditions</DrawerTitle>
            {object.status.conditions.map((condition, i) => (
              <div key={`condition-${i}`}>
                <DrawerItem name="Type">{condition.type}</DrawerItem>
                <DrawerItem name="Status">{condition.status}</DrawerItem>
                <DrawerItem name="Reason" hidden={!condition.reason}>{condition.reason}</DrawerItem>
                <DrawerItem name="Message" hidden={!condition.message}>{condition.message}</DrawerItem>
              </div>
            ))}
          </div>
        )}

        <DrawerTitle>Spec</DrawerTitle>
        <MonacoEditor
          readOnly
          className={styles.editor}
          style={{ minHeight: getHeight(specYaml) }}
          value={specYaml}
          setInitialHeight
          options={{ scrollbar: { alwaysConsumeMouseWheel: false } }}
        />
      </div>
    </>
  );
});
```

- [ ] **Step 6: Create src/renderer/components/details/opsrequest-details.module.scss**

```scss
@use "../../vars";

.details {
  .title {
    margin-top: vars.$margin * 2;
    margin-bottom: vars.$margin;
  }
}

.editor {
  resize: none;
  overflow: hidden;
  border: 1px solid var(--borderFaintColor);
  border-radius: 4px;
}
```

- [ ] **Step 7: Verify build**

Run: `pnpm build:force`
Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/renderer/components/details/cluster-details.tsx src/renderer/components/details/cluster-details.module.scss src/renderer/components/details/component-details.tsx src/renderer/components/details/component-details.module.scss src/renderer/components/details/opsrequest-details.tsx src/renderer/components/details/opsrequest-details.module.scss
git commit -m "feat: add Cluster, Component, and OpsRequest detail views"
```

---

### Task 8: Detail Views (Backup, Restore, Definitions, Addon)

**Files:**
- Create: `src/renderer/components/details/backup-details.tsx`
- Create: `src/renderer/components/details/backup-details.module.scss`
- Create: `src/renderer/components/details/restore-details.tsx`
- Create: `src/renderer/components/details/restore-details.module.scss`
- Create: `src/renderer/components/details/cluster-definition-details.tsx`
- Create: `src/renderer/components/details/cluster-definition-details.module.scss`
- Create: `src/renderer/components/details/component-definition-details.tsx`
- Create: `src/renderer/components/details/component-definition-details.module.scss`
- Create: `src/renderer/components/details/addon-details.tsx`
- Create: `src/renderer/components/details/addon-details.module.scss`

- [ ] **Step 1: Create src/renderer/components/details/backup-details.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { observer } from "mobx-react";
import { Backup } from "../../k8s/kubeblocks/backup-v1alpha1";
import { defaultYamlDumpOptions, getHeight } from "../../utils";
import { DurationAbsoluteTimestamp } from "../duration-absolute";
import { getPhaseClass, getPhaseText } from "../status-conditions";
import styles from "./backup-details.module.scss";
import stylesInline from "./backup-details.module.scss?inline";

const {
  Component: { Badge, DrawerItem, DrawerTitle, MonacoEditor },
} = Renderer;

export const BackupDetails: React.FC<Renderer.Component.KubeObjectDetailsProps<Backup>> = observer((props) => {
  const { object } = props;
  const specYaml = yaml.dump(object.spec ?? {}, defaultYamlDumpOptions);

  return (
    <>
      <style>{stylesInline}</style>
      <div className={styles.details}>
        <DrawerItem name="Cluster">{Backup.getClusterName(object)}</DrawerItem>
        <DrawerItem name="Method">{Backup.getMethod(object)}</DrawerItem>
        <DrawerItem name="Status">
          <Badge label={getPhaseText(Backup.getPhase(object))} className={getPhaseClass(Backup.getPhase(object))} />
        </DrawerItem>
        <DrawerItem name="Size" hidden={!Backup.getSize(object)}>{Backup.getSize(object)}</DrawerItem>
        <DrawerItem name="Duration" hidden={!Backup.getDuration(object)}>{Backup.getDuration(object)}</DrawerItem>

        <DrawerItem name="Started" hidden={!Backup.getStartTimestamp(object)}>
          <DurationAbsoluteTimestamp timestamp={Backup.getStartTimestamp(object)} />
        </DrawerItem>
        <DrawerItem name="Completed" hidden={!Backup.getCompletionTimestamp(object)}>
          <DurationAbsoluteTimestamp timestamp={Backup.getCompletionTimestamp(object)} />
        </DrawerItem>
        <DrawerItem name="Expiration" hidden={!object.status?.expiration}>
          <DurationAbsoluteTimestamp timestamp={object.status?.expiration} />
        </DrawerItem>
        <DrawerItem name="Repository" hidden={!object.status?.backupRepoName}>
          {object.status?.backupRepoName}
        </DrawerItem>

        <DrawerTitle>Spec</DrawerTitle>
        <MonacoEditor
          readOnly
          className={styles.editor}
          style={{ minHeight: getHeight(specYaml) }}
          value={specYaml}
          setInitialHeight
          options={{ scrollbar: { alwaysConsumeMouseWheel: false } }}
        />
      </div>
    </>
  );
});
```

- [ ] **Step 2: Create src/renderer/components/details/backup-details.module.scss**

```scss
@use "../../vars";

.details {
  .title {
    margin-top: vars.$margin * 2;
    margin-bottom: vars.$margin;
  }
}

.editor {
  resize: none;
  overflow: hidden;
  border: 1px solid var(--borderFaintColor);
  border-radius: 4px;
}
```

- [ ] **Step 3: Create src/renderer/components/details/restore-details.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { observer } from "mobx-react";
import { Restore } from "../../k8s/kubeblocks/restore-v1alpha1";
import { defaultYamlDumpOptions, getHeight } from "../../utils";
import { DurationAbsoluteTimestamp } from "../duration-absolute";
import { getPhaseClass, getPhaseText } from "../status-conditions";
import styles from "./restore-details.module.scss";
import stylesInline from "./restore-details.module.scss?inline";

const {
  Component: { Badge, DrawerItem, DrawerTitle, MonacoEditor },
} = Renderer;

export const RestoreDetails: React.FC<Renderer.Component.KubeObjectDetailsProps<Restore>> = observer((props) => {
  const { object } = props;
  const specYaml = yaml.dump(object.spec ?? {}, defaultYamlDumpOptions);

  return (
    <>
      <style>{stylesInline}</style>
      <div className={styles.details}>
        <DrawerItem name="Backup Source">{Restore.getBackupName(object)}</DrawerItem>
        <DrawerItem name="Target Cluster">{Restore.getTargetCluster(object)}</DrawerItem>
        <DrawerItem name="Status">
          <Badge label={getPhaseText(Restore.getPhase(object))} className={getPhaseClass(Restore.getPhase(object))} />
        </DrawerItem>

        <DrawerItem name="Started" hidden={!Restore.getStartTimestamp(object)}>
          <DurationAbsoluteTimestamp timestamp={Restore.getStartTimestamp(object)} />
        </DrawerItem>
        <DrawerItem name="Completed" hidden={!Restore.getCompletionTimestamp(object)}>
          <DurationAbsoluteTimestamp timestamp={Restore.getCompletionTimestamp(object)} />
        </DrawerItem>

        <DrawerTitle>Spec</DrawerTitle>
        <MonacoEditor
          readOnly
          className={styles.editor}
          style={{ minHeight: getHeight(specYaml) }}
          value={specYaml}
          setInitialHeight
          options={{ scrollbar: { alwaysConsumeMouseWheel: false } }}
        />
      </div>
    </>
  );
});
```

- [ ] **Step 4: Create src/renderer/components/details/restore-details.module.scss**

```scss
@use "../../vars";

.details {
  .title {
    margin-top: vars.$margin * 2;
    margin-bottom: vars.$margin;
  }
}

.editor {
  resize: none;
  overflow: hidden;
  border: 1px solid var(--borderFaintColor);
  border-radius: 4px;
}
```

- [ ] **Step 5: Create src/renderer/components/details/cluster-definition-details.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { observer } from "mobx-react";
import { ClusterDefinition } from "../../k8s/kubeblocks/cluster-definition-v1";
import { defaultYamlDumpOptions, getHeight } from "../../utils";
import styles from "./cluster-definition-details.module.scss";
import stylesInline from "./cluster-definition-details.module.scss?inline";

const {
  Component: { DrawerItem, DrawerTitle, MonacoEditor },
} = Renderer;

export const ClusterDefinitionDetails: React.FC<Renderer.Component.KubeObjectDetailsProps<ClusterDefinition>> = observer(
  (props) => {
    const { object } = props;
    const specYaml = yaml.dump(object.spec ?? {}, defaultYamlDumpOptions);
    const topologies = ClusterDefinition.getTopologies(object);

    return (
      <>
        <style>{stylesInline}</style>
        <div className={styles.details}>
          <DrawerItem name="Provider">{ClusterDefinition.getProvider(object)}</DrawerItem>
          <DrawerItem name="Description" hidden={!ClusterDefinition.getDescription(object)}>
            {ClusterDefinition.getDescription(object)}
          </DrawerItem>
          <DrawerItem name="Topologies" hidden={topologies.length === 0}>
            {topologies.join(", ")}
          </DrawerItem>

          <DrawerTitle>Spec</DrawerTitle>
          <MonacoEditor
            readOnly
            className={styles.editor}
            style={{ minHeight: getHeight(specYaml) }}
            value={specYaml}
            setInitialHeight
            options={{ scrollbar: { alwaysConsumeMouseWheel: false } }}
          />
        </div>
      </>
    );
  },
);
```

- [ ] **Step 6: Create src/renderer/components/details/cluster-definition-details.module.scss**

```scss
@use "../../vars";

.details {
  .title {
    margin-top: vars.$margin * 2;
    margin-bottom: vars.$margin;
  }
}

.editor {
  resize: none;
  overflow: hidden;
  border: 1px solid var(--borderFaintColor);
  border-radius: 4px;
}
```

- [ ] **Step 7: Create src/renderer/components/details/component-definition-details.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { observer } from "mobx-react";
import { ComponentDefinition } from "../../k8s/kubeblocks/component-definition-v1";
import { defaultYamlDumpOptions, getHeight } from "../../utils";
import styles from "./component-definition-details.module.scss";
import stylesInline from "./component-definition-details.module.scss?inline";

const {
  Component: { DrawerItem, DrawerTitle, MonacoEditor },
} = Renderer;

export const ComponentDefinitionDetails: React.FC<Renderer.Component.KubeObjectDetailsProps<ComponentDefinition>> = observer(
  (props) => {
    const { object } = props;
    const specYaml = yaml.dump(object.spec ?? {}, defaultYamlDumpOptions);

    return (
      <>
        <style>{stylesInline}</style>
        <div className={styles.details}>
          <DrawerItem name="Provider">{ComponentDefinition.getProvider(object)}</DrawerItem>
          <DrawerItem name="Service Kind" hidden={!ComponentDefinition.getServiceKind(object)}>
            {ComponentDefinition.getServiceKind(object)}
          </DrawerItem>
          <DrawerItem name="Service Version" hidden={!ComponentDefinition.getServiceVersion(object)}>
            {ComponentDefinition.getServiceVersion(object)}
          </DrawerItem>
          <DrawerItem name="Description" hidden={!ComponentDefinition.getDescription(object)}>
            {ComponentDefinition.getDescription(object)}
          </DrawerItem>

          {object.spec?.roles && object.spec.roles.length > 0 && (
            <div>
              <DrawerTitle>Roles</DrawerTitle>
              {object.spec.roles.map((role, i) => (
                <DrawerItem key={`role-${i}`} name={role.name ?? `Role ${i}`}>
                  Serviceable: {String(!!role.serviceable)}, Writable: {String(!!role.writable)}
                </DrawerItem>
              ))}
            </div>
          )}

          <DrawerTitle>Spec</DrawerTitle>
          <MonacoEditor
            readOnly
            className={styles.editor}
            style={{ minHeight: getHeight(specYaml) }}
            value={specYaml}
            setInitialHeight
            options={{ scrollbar: { alwaysConsumeMouseWheel: false } }}
          />
        </div>
      </>
    );
  },
);
```

- [ ] **Step 8: Create src/renderer/components/details/component-definition-details.module.scss**

```scss
@use "../../vars";

.details {
  .title {
    margin-top: vars.$margin * 2;
    margin-bottom: vars.$margin;
  }
}

.editor {
  resize: none;
  overflow: hidden;
  border: 1px solid var(--borderFaintColor);
  border-radius: 4px;
}
```

- [ ] **Step 9: Create src/renderer/components/details/addon-details.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { observer } from "mobx-react";
import { Addon } from "../../k8s/kubeblocks/addon-v1alpha1";
import { defaultYamlDumpOptions, getHeight } from "../../utils";
import { getPhaseClass, getPhaseText } from "../status-conditions";
import styles from "./addon-details.module.scss";
import stylesInline from "./addon-details.module.scss?inline";

const {
  Component: { Badge, DrawerItem, DrawerTitle, MonacoEditor },
} = Renderer;

export const AddonDetails: React.FC<Renderer.Component.KubeObjectDetailsProps<Addon>> = observer((props) => {
  const { object } = props;
  const specYaml = yaml.dump(object.spec ?? {}, defaultYamlDumpOptions);

  return (
    <>
      <style>{stylesInline}</style>
      <div className={styles.details}>
        <DrawerItem name="Type">{Addon.getType(object)}</DrawerItem>
        <DrawerItem name="Provider">{Addon.getProvider(object)}</DrawerItem>
        <DrawerItem name="Version">{Addon.getVersion(object)}</DrawerItem>
        <DrawerItem name="Status">
          <Badge label={getPhaseText(Addon.getPhase(object))} className={getPhaseClass(Addon.getPhase(object))} />
        </DrawerItem>
        <DrawerItem name="Description" hidden={!Addon.getDescription(object)}>
          {Addon.getDescription(object)}
        </DrawerItem>

        <DrawerTitle>Spec</DrawerTitle>
        <MonacoEditor
          readOnly
          className={styles.editor}
          style={{ minHeight: getHeight(specYaml) }}
          value={specYaml}
          setInitialHeight
          options={{ scrollbar: { alwaysConsumeMouseWheel: false } }}
        />
      </div>
    </>
  );
});
```

- [ ] **Step 10: Create src/renderer/components/details/addon-details.module.scss**

```scss
@use "../../vars";

.details {
  .title {
    margin-top: vars.$margin * 2;
    margin-bottom: vars.$margin;
  }
}

.editor {
  resize: none;
  overflow: hidden;
  border: 1px solid var(--borderFaintColor);
  border-radius: 4px;
}
```

- [ ] **Step 11: Verify build**

Run: `pnpm build:force`
Expected: Build succeeds.

- [ ] **Step 12: Commit**

```bash
git add src/renderer/components/details/
git commit -m "feat: add detail views for Backup, Restore, Definitions, and Addon"
```

---

### Task 9: Context Menu Actions & Confirmation Dialog

**Files:**
- Create: `src/renderer/components/confirmation-dialog.tsx`
- Create: `src/renderer/components/confirmation-dialog.module.scss`
- Create: `src/renderer/menus/cluster-ops-menu-items.tsx`
- Create: `src/renderer/menus/addon-menu-items.tsx`

- [ ] **Step 1: Create src/renderer/components/confirmation-dialog.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import styles from "./confirmation-dialog.module.scss";
import stylesInline from "./confirmation-dialog.module.scss?inline";

const {
  Component: { Button },
} = Renderer;

export interface ConfirmationDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({ message, onConfirm, onCancel }: ConfirmationDialogProps) {
  return (
    <>
      <style>{stylesInline}</style>
      <div className={styles.dialog}>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <Button plain onClick={onCancel}>Cancel</Button>
          <Button primary onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Create src/renderer/components/confirmation-dialog.module.scss**

```scss
@use "../vars";

.dialog {
  padding: vars.$padding * 2;
}

.message {
  margin-bottom: vars.$margin * 2;
  color: var(--textColorPrimary);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: vars.$gap;
}
```

- [ ] **Step 3: Create src/renderer/menus/cluster-ops-menu-items.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import type { Cluster } from "../k8s/kubeblocks/cluster-v1";
import { getOpsTypeIcon } from "../utils";

const {
  Component: { MenuItem, Icon, ConfirmDialog },
} = Renderer;

type KubeObject = Renderer.K8sApi.LensExtensionKubeObject<Renderer.K8sApi.KubeObjectMetadata, unknown, unknown>;
type KubeObjectCtor = typeof Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  unknown,
  unknown
>;

export interface ClusterOpsMenuItemProps extends Renderer.Component.KubeObjectMenuProps<Cluster> {
  resource: KubeObjectCtor;
}

function createOpsRequest(clusterName: string, namespace: string, type: string) {
  const apiBase = "/apis/apps.kubeblocks.io/v1alpha1/namespaces/" + namespace + "/opsrequests";
  const name = `${clusterName}-${type.toLowerCase()}-${Date.now()}`;

  const body: any = {
    apiVersion: "apps.kubeblocks.io/v1alpha1",
    kind: "OpsRequest",
    metadata: { name, namespace },
    spec: { clusterName, type },
  };

  return fetch(`/api-kube${apiBase}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function RestartClusterMenuItem(props: ClusterOpsMenuItemProps) {
  const { object, toolbar } = props;
  if (!object) return <></>;

  const doRestart = () => {
    ConfirmDialog.open({
      ok: async () => {
        await createOpsRequest(object.getName(), object.getNs() ?? "", "Restart");
      },
      labelOk: "Restart",
      message: (
        <p>Restart cluster <b>{object.getName()}</b>?</p>
      ),
    });
  };

  return (
    <MenuItem onClick={doRestart}>
      <Icon material="restart_alt" interactive={toolbar} title="Restart" />
      <span className="title">Restart</span>
    </MenuItem>
  );
}

export function StopClusterMenuItem(props: ClusterOpsMenuItemProps) {
  const { object, toolbar } = props;
  if (!object) return <></>;

  const doStop = () => {
    ConfirmDialog.open({
      ok: async () => {
        await createOpsRequest(object.getName(), object.getNs() ?? "", "Stop");
      },
      labelOk: "Stop",
      message: (
        <p>Stop cluster <b>{object.getName()}</b>?</p>
      ),
    });
  };

  return (
    <MenuItem onClick={doStop}>
      <Icon material="stop" interactive={toolbar} title="Stop" />
      <span className="title">Stop</span>
    </MenuItem>
  );
}

export function StartClusterMenuItem(props: ClusterOpsMenuItemProps) {
  const { object, toolbar } = props;
  if (!object) return <></>;

  const doStart = () => {
    ConfirmDialog.open({
      ok: async () => {
        await createOpsRequest(object.getName(), object.getNs() ?? "", "Start");
      },
      labelOk: "Start",
      message: (
        <p>Start cluster <b>{object.getName()}</b>?</p>
      ),
    });
  };

  return (
    <MenuItem onClick={doStart}>
      <Icon material="play_arrow" interactive={toolbar} title="Start" />
      <span className="title">Start</span>
    </MenuItem>
  );
}
```

- [ ] **Step 4: Create src/renderer/menus/addon-menu-items.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import type { Addon } from "../k8s/kubeblocks/addon-v1alpha1";

const {
  Component: { MenuItem, Icon, ConfirmDialog },
} = Renderer;

type KubeObject = Renderer.K8sApi.LensExtensionKubeObject<Renderer.K8sApi.KubeObjectMetadata, unknown, unknown>;
type KubeObjectCtor = typeof Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  unknown,
  unknown
>;

export interface AddonMenuItemProps extends Renderer.Component.KubeObjectMenuProps<Addon> {
  resource: KubeObjectCtor;
}

export function EnableAddonMenuItem(props: AddonMenuItemProps) {
  const { object, toolbar, resource } = props;
  if (!object) return <></>;

  const store = resource.getStore<KubeObject>();
  if (!store) return <></>;

  if (object.status?.phase === "Enabled" || object.status?.phase === "Enabling") return <></>;

  const doEnable = () => {
    ConfirmDialog.open({
      ok: async () => {
        await store.patch(
          object,
          {
            spec: { installSpec: { enabled: true } },
          } as any,
          "merge",
        );
      },
      labelOk: "Enable",
      message: (
        <p>Enable addon <b>{object.getName()}</b>?</p>
      ),
    });
  };

  return (
    <MenuItem onClick={doEnable}>
      <Icon material="power" interactive={toolbar} title="Enable" />
      <span className="title">Enable</span>
    </MenuItem>
  );
}

export function DisableAddonMenuItem(props: AddonMenuItemProps) {
  const { object, toolbar, resource } = props;
  if (!object) return <></>;

  const store = resource.getStore<KubeObject>();
  if (!store) return <></>;

  if (object.status?.phase === "Disabled" || object.status?.phase === "Disabling") return <></>;

  const doDisable = () => {
    ConfirmDialog.open({
      ok: async () => {
        await store.patch(
          object,
          {
            spec: { installSpec: { enabled: false } },
          } as any,
          "merge",
        );
      },
      labelOk: "Disable",
      message: (
        <p>Disable addon <b>{object.getName()}</b>?</p>
      ),
    });
  };

  return (
    <MenuItem onClick={doDisable}>
      <Icon material="power_off" interactive={toolbar} title="Disable" />
      <span className="title">Disable</span>
    </MenuItem>
  );
}
```

- [ ] **Step 5: Verify build**

Run: `pnpm build:force`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/renderer/components/confirmation-dialog.tsx src/renderer/components/confirmation-dialog.module.scss src/renderer/menus/
git commit -m "feat: add context menu actions for Cluster ops and Addon enable/disable"
```

---

### Task 10: Extension Registration (index.tsx)

**Files:**
- Modify: `src/renderer/index.tsx`

- [ ] **Step 1: Write the full renderer entry**

Replace `src/renderer/index.tsx` with:

```typescript
import { Renderer } from "@freelensapp/extensions";
import { AddonDetails } from "./components/details/addon-details";
import { BackupDetails } from "./components/details/backup-details";
import { ClusterDetails } from "./components/details/cluster-details";
import { ClusterDefinitionDetails } from "./components/details/cluster-definition-details";
import { ComponentDetails } from "./components/details/component-details";
import { ComponentDefinitionDetails } from "./components/details/component-definition-details";
import { OpsRequestDetails } from "./components/details/opsrequest-details";
import { RestoreDetails } from "./components/details/restore-details";
import svgIcon from "./icons/kubeblocks.svg?raw";
import { Addon } from "./k8s/kubeblocks/addon-v1alpha1";
import { Backup } from "./k8s/kubeblocks/backup-v1alpha1";
import { ClusterDefinition } from "./k8s/kubeblocks/cluster-definition-v1";
import { Cluster } from "./k8s/kubeblocks/cluster-v1";
import { ComponentDefinition } from "./k8s/kubeblocks/component-definition-v1";
import { Component } from "./k8s/kubeblocks/component-v1";
import { OpsRequest } from "./k8s/kubeblocks/opsrequest-v1alpha1";
import { Restore } from "./k8s/kubeblocks/restore-v1alpha1";
import {
  type AddonMenuItemProps,
  DisableAddonMenuItem,
  EnableAddonMenuItem,
} from "./menus/addon-menu-items";
import {
  type ClusterOpsMenuItemProps,
  RestartClusterMenuItem,
  StartClusterMenuItem,
  StopClusterMenuItem,
} from "./menus/cluster-ops-menu-items";
import { AddonsPage } from "./pages/addons";
import { BackupsPage } from "./pages/backups";
import { ClustersPage } from "./pages/clusters";
import { ComponentsPage } from "./pages/components";
import { DefinitionsPage } from "./pages/definitions";
import { OperationsPage } from "./pages/operations";
import { KubeBlocksOverviewPage } from "./pages/overview";
import { RestoresPage } from "./pages/restores";

const {
  Component: { Icon },
} = Renderer;

export function KubeBlocksIcon(props: Renderer.Component.IconProps) {
  return <Icon {...props} svg={svgIcon} />;
}

export default class KubeBlocksExtension extends Renderer.LensExtension {
  clusterPages = [
    {
      id: "kubeblocks-dashboard",
      components: {
        Page: () => <KubeBlocksOverviewPage />,
      },
    },
    {
      id: "kubeblocks-clusters",
      components: {
        Page: () => <ClustersPage />,
      },
    },
    {
      id: "kubeblocks-components",
      components: {
        Page: () => <ComponentsPage />,
      },
    },
    {
      id: "kubeblocks-operations",
      components: {
        Page: () => <OperationsPage />,
      },
    },
    {
      id: "kubeblocks-backups",
      components: {
        Page: () => <BackupsPage />,
      },
    },
    {
      id: "kubeblocks-restores",
      components: {
        Page: () => <RestoresPage />,
      },
    },
    {
      id: "kubeblocks-definitions",
      components: {
        Page: () => <DefinitionsPage />,
      },
    },
    {
      id: "kubeblocks-addons",
      components: {
        Page: () => <AddonsPage />,
      },
    },
  ];

  clusterPageMenus = [
    {
      id: "kubeblocks",
      title: "KubeBlocks",
      target: { pageId: "kubeblocks-dashboard" },
      components: {
        Icon: KubeBlocksIcon,
      },
    },
    {
      id: "kubeblocks-dashboard",
      parentId: "kubeblocks",
      target: { pageId: "kubeblocks-dashboard" },
      title: "Overview",
      components: {},
    },
    {
      id: "kubeblocks-clusters",
      parentId: "kubeblocks",
      target: { pageId: "kubeblocks-clusters" },
      title: Cluster.crd.title,
      components: {},
    },
    {
      id: "kubeblocks-components",
      parentId: "kubeblocks",
      target: { pageId: "kubeblocks-components" },
      title: Component.crd.title,
      components: {},
    },
    {
      id: "kubeblocks-operations",
      parentId: "kubeblocks",
      target: { pageId: "kubeblocks-operations" },
      title: OpsRequest.crd.title,
      components: {},
    },
    {
      id: "kubeblocks-backups",
      parentId: "kubeblocks",
      target: { pageId: "kubeblocks-backups" },
      title: Backup.crd.title,
      components: {},
    },
    {
      id: "kubeblocks-restores",
      parentId: "kubeblocks",
      target: { pageId: "kubeblocks-restores" },
      title: Restore.crd.title,
      components: {},
    },
    {
      id: "kubeblocks-definitions",
      parentId: "kubeblocks",
      target: { pageId: "kubeblocks-definitions" },
      title: "Definitions",
      components: {},
    },
    {
      id: "kubeblocks-addons",
      parentId: "kubeblocks",
      target: { pageId: "kubeblocks-addons" },
      title: Addon.crd.title,
      components: {},
    },
  ];

  kubeObjectDetailItems = [
    {
      kind: Cluster.kind,
      apiVersions: Cluster.crd.apiVersions,
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<Cluster>) => <ClusterDetails {...props} />,
      },
    },
    {
      kind: Component.kind,
      apiVersions: Component.crd.apiVersions,
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<Component>) => <ComponentDetails {...props} />,
      },
    },
    {
      kind: OpsRequest.kind,
      apiVersions: OpsRequest.crd.apiVersions,
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<OpsRequest>) => <OpsRequestDetails {...props} />,
      },
    },
    {
      kind: Backup.kind,
      apiVersions: Backup.crd.apiVersions,
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<Backup>) => <BackupDetails {...props} />,
      },
    },
    {
      kind: Restore.kind,
      apiVersions: Restore.crd.apiVersions,
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<Restore>) => <RestoreDetails {...props} />,
      },
    },
    {
      kind: ClusterDefinition.kind,
      apiVersions: ClusterDefinition.crd.apiVersions,
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<ClusterDefinition>) => (
          <ClusterDefinitionDetails {...props} />
        ),
      },
    },
    {
      kind: ComponentDefinition.kind,
      apiVersions: ComponentDefinition.crd.apiVersions,
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<ComponentDefinition>) => (
          <ComponentDefinitionDetails {...props} />
        ),
      },
    },
    {
      kind: Addon.kind,
      apiVersions: Addon.crd.apiVersions,
      priority: 10,
      components: {
        Details: (props: Renderer.Component.KubeObjectDetailsProps<Addon>) => <AddonDetails {...props} />,
      },
    },
  ];

  kubeObjectMenuItems = [
    {
      kind: Cluster.kind,
      apiVersions: Cluster.crd.apiVersions,
      components: {
        MenuItem: (props: ClusterOpsMenuItemProps) => <RestartClusterMenuItem {...props} resource={Cluster} />,
      },
    },
    {
      kind: Cluster.kind,
      apiVersions: Cluster.crd.apiVersions,
      components: {
        MenuItem: (props: ClusterOpsMenuItemProps) => <StopClusterMenuItem {...props} resource={Cluster} />,
      },
    },
    {
      kind: Cluster.kind,
      apiVersions: Cluster.crd.apiVersions,
      components: {
        MenuItem: (props: ClusterOpsMenuItemProps) => <StartClusterMenuItem {...props} resource={Cluster} />,
      },
    },
    {
      kind: Addon.kind,
      apiVersions: Addon.crd.apiVersions,
      components: {
        MenuItem: (props: AddonMenuItemProps) => <EnableAddonMenuItem {...props} resource={Addon} />,
      },
    },
    {
      kind: Addon.kind,
      apiVersions: Addon.crd.apiVersions,
      components: {
        MenuItem: (props: AddonMenuItemProps) => <DisableAddonMenuItem {...props} resource={Addon} />,
      },
    },
  ];
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build:force`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/index.tsx
git commit -m "feat: wire up extension registration with all pages, menus, details, and actions"
```

---

### Task 11: CI/CD Workflows

**Files:**
- Create: `.github/workflows/check.yaml`
- Create: `.github/workflows/release.yaml`

- [ ] **Step 1: Create .github/workflows/check.yaml**

```yaml
name: Check

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm type:check

      - run: pnpm build
```

- [ ] **Step 2: Create .github/workflows/release.yaml**

```yaml
name: Release

on:
  push:
    tags:
      - "v*"

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm build

      - run: pnpm pack

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: "*.tgz"
          generate_release_notes: true
```

- [ ] **Step 3: Commit**

```bash
git add .github/
git commit -m "feat: add CI check and release workflows"
```

---

### Task 12: OpsRequest Wizard (Guided Dialog)

**Files:**
- Create: `src/renderer/components/ops-wizard/ops-wizard.module.scss`
- Create: `src/renderer/components/ops-wizard/step-select-cluster.tsx`
- Create: `src/renderer/components/ops-wizard/step-select-operation.tsx`
- Create: `src/renderer/components/ops-wizard/step-configure.tsx`
- Create: `src/renderer/components/ops-wizard/step-review.tsx`
- Create: `src/renderer/components/ops-wizard/wizard-dialog.tsx`
- Modify: `src/renderer/menus/cluster-ops-menu-items.tsx` (add wizard launch items)
- Modify: `src/renderer/index.tsx` (register wizard menu items)

This task is intentionally deferred as a follow-up iteration. The core extension (Tasks 1-11) provides full list/detail/action coverage. The wizard adds guided form-based OpsRequest creation and should be built after the core is validated.

- [ ] **Step 1: Create src/renderer/components/ops-wizard/ops-wizard.module.scss**

```scss
@use "../../vars";

.wizardOverlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.wizard {
  background: var(--mainBackground);
  border-radius: 8px;
  width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  padding: vars.$padding * 3;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: vars.$margin * 2;

  h5 {
    color: var(--textColorPrimary);
    margin: 0;
  }
}

.steps {
  display: flex;
  gap: vars.$gap;
  margin-bottom: vars.$margin * 3;
}

.step {
  flex: 1;
  text-align: center;
  padding: vars.$padding;
  border-bottom: 2px solid var(--borderFaintColor);
  color: var(--textColorSecondary);
  font-size: 12px;

  &.active {
    border-bottom-color: var(--colorPrimary);
    color: var(--textColorPrimary);
    font-weight: 600;
  }

  &.completed {
    border-bottom-color: var(--colorOk);
    color: var(--textColorPrimary);
  }
}

.content {
  min-height: 200px;
  margin-bottom: vars.$margin * 2;
}

.footer {
  display: flex;
  justify-content: flex-end;
  gap: vars.$gap;
}

.operationGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: vars.$gap * 2;
}

.operationCard {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: vars.$padding * 2;
  border: 1px solid var(--borderFaintColor);
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover {
    border-color: var(--colorPrimary);
  }

  &.selected {
    border-color: var(--colorPrimary);
    background: var(--colorPrimary10);
  }

  span {
    margin-top: vars.$margin;
    font-size: 12px;
  }
}

.formField {
  margin-bottom: vars.$margin * 2;

  label {
    display: block;
    margin-bottom: vars.$margin;
    color: var(--textColorSecondary);
    font-size: 12px;
  }

  input, select {
    width: 100%;
    padding: vars.$padding;
    background: var(--inputBackground);
    border: 1px solid var(--borderFaintColor);
    border-radius: 4px;
    color: var(--textColorPrimary);

    &:focus {
      border-color: var(--colorPrimary);
      outline: none;
    }
  }
}
```

- [ ] **Step 2: Create src/renderer/components/ops-wizard/step-select-cluster.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { Cluster } from "../../k8s/kubeblocks/cluster-v1";
import styles from "./ops-wizard.module.scss";

const {
  Component: { Badge },
} = Renderer;

export interface StepSelectClusterProps {
  selectedCluster: string;
  selectedNamespace: string;
  onSelect: (name: string, namespace: string) => void;
}

export const StepSelectCluster = observer(({ selectedCluster, selectedNamespace, onSelect }: StepSelectClusterProps) => {
  let clusters: Cluster[] = [];
  try {
    const store = Cluster.getStore<Cluster>();
    if (store) clusters = store.contextItems;
  } catch (_) {}

  return (
    <div>
      <div className={styles.formField}>
        <label>Select a cluster:</label>
        <select
          value={`${selectedNamespace}/${selectedCluster}`}
          onChange={(e) => {
            const [ns, name] = e.target.value.split("/");
            onSelect(name, ns);
          }}
        >
          <option value="/">-- Select Cluster --</option>
          {clusters.map((cl) => (
            <option key={cl.getId()} value={`${cl.getNs()}/${cl.getName()}`}>
              {cl.getNs()}/{cl.getName()} ({Cluster.getPhase(cl)})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});
```

- [ ] **Step 3: Create src/renderer/components/ops-wizard/step-select-operation.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import type { OpsRequestType } from "../../k8s/kubeblocks/types";
import { getOpsTypeIcon } from "../../utils";
import styles from "./ops-wizard.module.scss";

const {
  Component: { Icon },
} = Renderer;

const operations: { type: OpsRequestType; label: string; description: string }[] = [
  { type: "Restart", label: "Restart", description: "Restart all pods" },
  { type: "Stop", label: "Stop", description: "Stop the cluster" },
  { type: "Start", label: "Start", description: "Start a stopped cluster" },
  { type: "HorizontalScaling", label: "Horizontal Scale", description: "Change replica count" },
  { type: "VerticalScaling", label: "Vertical Scale", description: "Change CPU/memory" },
  { type: "VolumeExpansion", label: "Volume Expand", description: "Increase storage size" },
  { type: "Upgrade", label: "Upgrade", description: "Upgrade service version" },
  { type: "Backup", label: "Backup", description: "Create a backup" },
  { type: "Restore", label: "Restore", description: "Restore from backup" },
  { type: "Expose", label: "Expose", description: "Expose services" },
  { type: "Switchover", label: "Switchover", description: "Switch primary instance" },
  { type: "Reconfiguring", label: "Reconfigure", description: "Change configuration" },
];

export interface StepSelectOperationProps {
  selectedType: OpsRequestType | "";
  onSelect: (type: OpsRequestType) => void;
}

export function StepSelectOperation({ selectedType, onSelect }: StepSelectOperationProps) {
  return (
    <div className={styles.operationGrid}>
      {operations.map((op) => (
        <div
          key={op.type}
          className={`${styles.operationCard} ${selectedType === op.type ? styles.selected : ""}`}
          onClick={() => onSelect(op.type)}
        >
          <Icon material={getOpsTypeIcon(op.type)} />
          <span><b>{op.label}</b></span>
          <span>{op.description}</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create src/renderer/components/ops-wizard/step-configure.tsx**

```typescript
import type { OpsRequestType } from "../../k8s/kubeblocks/types";
import styles from "./ops-wizard.module.scss";

export interface OpsConfig {
  componentName: string;
  replicas: string;
  cpu: string;
  memory: string;
  storage: string;
  serviceVersion: string;
  backupMethod: string;
  backupName: string;
  serviceType: string;
  instanceName: string;
}

export interface StepConfigureProps {
  opsType: OpsRequestType | "";
  config: OpsConfig;
  onChange: (config: OpsConfig) => void;
}

export function StepConfigure({ opsType, config, onChange }: StepConfigureProps) {
  const update = (field: keyof OpsConfig, value: string) => {
    onChange({ ...config, [field]: value });
  };

  const renderField = (label: string, field: keyof OpsConfig, placeholder: string) => (
    <div className={styles.formField}>
      <label>{label}</label>
      <input
        type="text"
        value={config[field]}
        placeholder={placeholder}
        onChange={(e) => update(field, e.target.value)}
      />
    </div>
  );

  const componentField = renderField("Component Name", "componentName", "e.g. mysql");

  switch (opsType) {
    case "HorizontalScaling":
      return (
        <div>
          {componentField}
          {renderField("Replicas", "replicas", "e.g. 3")}
        </div>
      );
    case "VerticalScaling":
      return (
        <div>
          {componentField}
          {renderField("CPU", "cpu", "e.g. 500m")}
          {renderField("Memory", "memory", "e.g. 1Gi")}
        </div>
      );
    case "VolumeExpansion":
      return (
        <div>
          {componentField}
          {renderField("Storage", "storage", "e.g. 20Gi")}
        </div>
      );
    case "Upgrade":
      return (
        <div>
          {renderField("Service Version", "serviceVersion", "e.g. 8.0.33")}
        </div>
      );
    case "Backup":
      return (
        <div>
          {renderField("Backup Method", "backupMethod", "e.g. xtrabackup")}
        </div>
      );
    case "Restore":
      return (
        <div>
          {renderField("Backup Name", "backupName", "e.g. my-backup-20240101")}
        </div>
      );
    case "Expose":
      return (
        <div>
          {componentField}
          <div className={styles.formField}>
            <label>Service Type</label>
            <select value={config.serviceType} onChange={(e) => update("serviceType", e.target.value)}>
              <option value="ClusterIP">ClusterIP</option>
              <option value="NodePort">NodePort</option>
              <option value="LoadBalancer">LoadBalancer</option>
            </select>
          </div>
        </div>
      );
    case "Switchover":
      return (
        <div>
          {componentField}
          {renderField("Instance Name", "instanceName", "e.g. mysql-0")}
        </div>
      );
    case "Restart":
    case "Stop":
    case "Start":
      return <p>No additional configuration needed for {opsType}.</p>;
    default:
      return <p>Select an operation type first.</p>;
  }
}
```

- [ ] **Step 5: Create src/renderer/components/ops-wizard/step-review.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { useState } from "react";
import type { OpsRequestType } from "../../k8s/kubeblocks/types";
import { defaultYamlDumpOptions, getHeight } from "../../utils";
import type { OpsConfig } from "./step-configure";
import styles from "./ops-wizard.module.scss";

const {
  Component: { MonacoEditor },
} = Renderer;

export interface StepReviewProps {
  clusterName: string;
  namespace: string;
  opsType: OpsRequestType;
  config: OpsConfig;
  yamlValue: string;
  onYamlChange: (yaml: string) => void;
}

export function StepReview({ yamlValue, onYamlChange }: StepReviewProps) {
  return (
    <div>
      <p>Review and edit the OpsRequest manifest before submitting:</p>
      <MonacoEditor
        style={{ minHeight: getHeight(yamlValue), height: 360 }}
        value={yamlValue}
        language="yaml"
        onChange={onYamlChange}
        options={{ scrollbar: { alwaysConsumeMouseWheel: false } }}
      />
    </div>
  );
}

export function buildOpsRequestYaml(
  clusterName: string,
  namespace: string,
  opsType: OpsRequestType,
  config: OpsConfig,
): string {
  const name = `${clusterName}-${opsType.toLowerCase()}-${Date.now()}`;
  const manifest: any = {
    apiVersion: "apps.kubeblocks.io/v1alpha1",
    kind: "OpsRequest",
    metadata: { name, namespace },
    spec: { clusterName, type: opsType },
  };

  switch (opsType) {
    case "HorizontalScaling":
      manifest.spec.horizontalScaling = [
        { componentName: config.componentName, replicas: parseInt(config.replicas) || 1 },
      ];
      break;
    case "VerticalScaling":
      manifest.spec.verticalScaling = [
        {
          componentName: config.componentName,
          resources: {
            requests: { cpu: config.cpu, memory: config.memory },
            limits: { cpu: config.cpu, memory: config.memory },
          },
        },
      ];
      break;
    case "VolumeExpansion":
      manifest.spec.volumeExpansion = [
        { componentName: config.componentName, volumeClaimTemplates: [{ name: "data", storage: config.storage }] },
      ];
      break;
    case "Upgrade":
      manifest.spec.upgrade = { serviceVersion: config.serviceVersion };
      break;
    case "Backup":
      manifest.spec.backup = { backupMethod: config.backupMethod };
      break;
    case "Restore":
      manifest.spec.restore = { backupName: config.backupName };
      break;
    case "Expose":
      manifest.spec.expose = [
        { componentName: config.componentName, services: [{ serviceType: config.serviceType }] },
      ];
      break;
    case "Switchover":
      manifest.spec.switchover = [
        { componentName: config.componentName, instanceName: config.instanceName },
      ];
      break;
  }

  return yaml.dump(manifest, defaultYamlDumpOptions);
}
```

- [ ] **Step 6: Create src/renderer/components/ops-wizard/wizard-dialog.tsx**

```typescript
import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { useState } from "react";
import type { OpsRequestType } from "../../k8s/kubeblocks/types";
import { StepConfigure, type OpsConfig } from "./step-configure";
import styles from "./ops-wizard.module.scss";
import stylesInline from "./ops-wizard.module.scss?inline";
import { StepReview, buildOpsRequestYaml } from "./step-review";
import { StepSelectCluster } from "./step-select-cluster";
import { StepSelectOperation } from "./step-select-operation";

const {
  Component: { Button, Icon },
} = Renderer;

export interface WizardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCluster?: string;
  preselectedNamespace?: string;
  preselectedType?: OpsRequestType;
}

const STEP_LABELS = ["Select Cluster", "Select Operation", "Configure", "Review & Submit"];
const emptyConfig: OpsConfig = {
  componentName: "",
  replicas: "",
  cpu: "",
  memory: "",
  storage: "",
  serviceVersion: "",
  backupMethod: "",
  backupName: "",
  serviceType: "ClusterIP",
  instanceName: "",
};

export function WizardDialog({ isOpen, onClose, preselectedCluster, preselectedNamespace, preselectedType }: WizardDialogProps) {
  const [step, setStep] = useState(preselectedCluster ? (preselectedType ? 2 : 1) : 0);
  const [clusterName, setClusterName] = useState(preselectedCluster ?? "");
  const [namespace, setNamespace] = useState(preselectedNamespace ?? "");
  const [opsType, setOpsType] = useState<OpsRequestType | "">(preselectedType ?? "");
  const [config, setConfig] = useState<OpsConfig>({ ...emptyConfig });
  const [reviewYaml, setReviewYaml] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const canNext = () => {
    switch (step) {
      case 0: return clusterName !== "";
      case 1: return opsType !== "";
      case 2: return true;
      case 3: return reviewYaml !== "";
      default: return false;
    }
  };

  const goNext = () => {
    if (step === 2 && opsType) {
      setReviewYaml(buildOpsRequestYaml(clusterName, namespace, opsType, config));
    }
    setStep(step + 1);
  };

  const goBack = () => setStep(step - 1);

  const doSubmit = async () => {
    setSubmitting(true);
    try {
      const manifest = yaml.load(reviewYaml) as any;
      const ns = manifest.metadata?.namespace ?? namespace;
      const apiBase = `/apis/apps.kubeblocks.io/v1alpha1/namespaces/${ns}/opsrequests`;

      await fetch(`/api-kube${apiBase}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manifest),
      });

      onClose();
    } catch (error) {
      console.error("Failed to create OpsRequest:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{stylesInline}</style>
      <div className={styles.wizardOverlay} onClick={onClose}>
        <div className={styles.wizard} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <h5>Create Operation</h5>
            <Icon material="close" onClick={onClose} interactive />
          </div>

          <div className={styles.steps}>
            {STEP_LABELS.map((label, i) => (
              <div
                key={label}
                className={`${styles.step} ${i === step ? styles.active : ""} ${i < step ? styles.completed : ""}`}
              >
                {label}
              </div>
            ))}
          </div>

          <div className={styles.content}>
            {step === 0 && (
              <StepSelectCluster
                selectedCluster={clusterName}
                selectedNamespace={namespace}
                onSelect={(name, ns) => { setClusterName(name); setNamespace(ns); }}
              />
            )}
            {step === 1 && (
              <StepSelectOperation selectedType={opsType} onSelect={(t) => setOpsType(t)} />
            )}
            {step === 2 && (
              <StepConfigure opsType={opsType} config={config} onChange={setConfig} />
            )}
            {step === 3 && (
              <StepReview
                clusterName={clusterName}
                namespace={namespace}
                opsType={opsType as OpsRequestType}
                config={config}
                yamlValue={reviewYaml}
                onYamlChange={setReviewYaml}
              />
            )}
          </div>

          <div className={styles.footer}>
            {step > 0 && <Button plain onClick={goBack}>Back</Button>}
            {step < 3 && (
              <Button primary onClick={goNext} disabled={!canNext()}>
                Next
              </Button>
            )}
            {step === 3 && (
              <Button primary onClick={doSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Global state for opening the wizard from menu items
let _openWizard: ((props: Partial<WizardDialogProps>) => void) | null = null;

export function registerWizardOpener(opener: (props: Partial<WizardDialogProps>) => void) {
  _openWizard = opener;
}

export function openOpsWizard(props: Partial<WizardDialogProps> = {}) {
  _openWizard?.(props);
}
```

- [ ] **Step 7: Verify build**

Run: `pnpm build:force`
Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/renderer/components/ops-wizard/
git commit -m "feat: add OpsRequest wizard with 4-step guided flow"
```

---

### Task 13: Final Build Verification & Pack

**Files:** None (verification only)

- [ ] **Step 1: Run type check**

Run: `pnpm type:check`
Expected: No type errors.

- [ ] **Step 2: Run full build**

Run: `pnpm build`
Expected: Build succeeds (includes type check via prebuild).

- [ ] **Step 3: Pack the extension**

Run: `pnpm pack`
Expected: Creates `freelensapp-kubeblocks-extension-0.1.0.tgz` in the project root.

- [ ] **Step 4: Verify output structure**

Run: `tar tzf *.tgz | head -20`
Expected: Lists files under `package/out/main/` and `package/out/renderer/`.

- [ ] **Step 5: Commit generated type files**

```bash
git add **/*.d.scss.ts
git commit -m "chore: add generated SCSS module type declarations"
```
