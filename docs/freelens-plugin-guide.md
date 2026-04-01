# Freelens Plugin Development Guide

Reference document for building Freelens extensions that integrate Kubernetes CRDs into the Freelens IDE. Based on patterns validated in the ArgoCD and Kargo extensions.

---

## Architecture Overview

A Freelens extension has two entry points:

- **Main process** (`src/main/index.ts`) — runs in Electron's main process. Usually an empty shell unless you need background tasks.
- **Renderer process** (`src/renderer/index.tsx`) — runs in the browser/renderer. This is where all UI, CRD registration, pages, menus, and detail views live.

The renderer entry exports a class extending `Renderer.LensExtension` with these key properties:

| Property | Purpose |
|----------|---------|
| `clusterPages` | Page components shown in the cluster view |
| `clusterPageMenus` | Sidebar menu entries linking to pages |
| `kubeObjectDetailItems` | Detail panels shown when selecting a K8s resource |
| `kubeObjectMenuItems` | Context menu actions on K8s resources |

---

## Project Structure Template

```
my-extension/
├── src/
│   ├── main/
│   │   └── index.ts                    # Main process shell
│   └── renderer/
│       ├── index.tsx                    # Extension registration (pages, menus, details, actions)
│       ├── utils.ts                     # Shared utilities (URL helpers, YAML dump, height calc)
│       ├── vars.scss                    # SCSS variables
│       ├── icons/
│       │   └── my-icon.svg             # Extension icon (used in sidebar menu)
│       ├── k8s/<name>/
│       │   ├── types.ts                # Shared TypeScript interfaces for all CRDs
│       │   └── <kind>-v1alpha1.ts      # One file per CRD kind
│       ├── components/
│       │   ├── details/
│       │   │   ├── <kind>-details.tsx   # Detail panel for each CRD
│       │   │   └── <kind>-details.module.scss
│       │   ├── <name>-events.tsx        # Filtered K8s event stream
│       │   ├── pie-chart.tsx            # Status pie charts
│       │   ├── duration-absolute.tsx    # Relative + absolute timestamps
│       │   ├── status-conditions.ts     # Status → CSS class mapping
│       │   ├── error-page.tsx           # Error boundary wrapper
│       │   ├── error-page.module.scss
│       │   ├── info-page.tsx            # Loading/info display
│       │   └── info-page.module.scss
│       ├── menus/
│       │   └── <action>-menu-item.tsx   # Context menu actions
│       └── pages/
│           ├── overview.tsx             # Dashboard page
│           ├── overview.module.scss
│           ├── <resource>.tsx           # List page per CRD
│           └── <resource>.module.scss
├── package.json
├── tsconfig.json
├── electron.vite.config.js
├── biome.jsonc
├── Makefile
├── .gitignore
└── .github/workflows/
    ├── check.yaml                      # CI: type-check + build
    └── release.yaml                    # Release on tag push
```

---

## Tech Stack (Exact Versions)

```json
{
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
  "engines": {
    "node": ">= 22.16.0",
    "freelens": "^1.6.0"
  },
  "packageManager": "pnpm@10.29.3"
}
```

**Important:** React 17, NOT 18. MobX 6, NOT 7. These must match what Freelens provides at runtime.

---

## Critical Patterns & Gotchas

### 1. ID Namespacing (CRITICAL — causes enable/disable flicker)

All `clusterPages` and `clusterPageMenus` IDs MUST be prefixed with your extension name to avoid collisions with other extensions.

```typescript
// BAD — will conflict with other extensions using "dashboard"
clusterPages = [{ id: "dashboard", ... }];

// GOOD — namespaced to avoid collisions
clusterPages = [{ id: "myext-dashboard", ... }];
```

This applies to ALL IDs: pages, menus, and `parentId`/`pageId` references.

### 2. No Extension Prop on Pages (CRITICAL — causes enable/disable flicker)

Page components MUST use no-arg arrow functions. Passing the `extension` prop triggers a re-render cascade that causes Freelens to flicker between enabled/disabled.

```typescript
// BAD — causes flicker loop
Page: (props: { extension: Renderer.LensExtension }) => <MyPage {...props} />

// GOOD — no props
Page: () => <MyPage />
```

### 3. External Globals (Build Config)

These packages are provided by Freelens at runtime and MUST be externalized in the build config, NOT bundled:

```javascript
// electron.vite.config.js externals mapping
{
  "@freelensapp/extensions": "global.LensExtensions",
  mobx: "global.Mobx",
  "mobx-react": "global.MobxReact",
  react: "global.React",
  "react-dom": "global.ReactDom",
  "react-router-dom": "global.ReactRouterDom",
  "react/jsx-runtime": "global.ReactJsxRuntime",
}
```

### 4. CSS Modules Pattern

Every `.module.scss` file needs TWO imports — one for class names, one for inline injection:

```typescript
import styles from "./my-component.module.scss";
import stylesInline from "./my-component.module.scss?inline";

// In JSX:
<>
  <style>{stylesInline}</style>
  <div className={styles.myClass}>...</div>
</>
```

The `vite-plugin-sass-dts` plugin auto-generates `.module.d.scss.ts` type declarations. Commit these.

### 5. Error Boundary Wrapper

Wrap all page components with `withErrorPage()` to handle missing CRDs gracefully:

```typescript
export const MyPage = observer(() =>
  withErrorPage(() => {
    const store = MyCRD.getStore<MyCRD>();
    return <KubeObjectListLayout store={store} ... />;
  }),
);
```

The wrapper returns `null` for "not registered" / "getStore" errors, allowing graceful degradation when CRDs aren't installed in the cluster.

### 6. Store Loading Pattern (Overview/Dashboard Pages)

```typescript
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

    for (const object of [MyCRD1, MyCRD2]) {
      try {
        const store = object.getStore();
        if (!store) continue;
        await store.loadAll({ namespaces, reqInit: { signal: abortController.current.signal } });
        watches.current.push(store.subscribe());
      } catch (_) { continue; }
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
```

### 7. Sorting Callbacks Must Return string | number

`KubeObjectListLayout` sorting callbacks must return `string | number | undefined`. Booleans will cause a type error:

```typescript
// BAD
autoPromotion: (object) => object.isEnabled(),  // returns boolean

// GOOD
autoPromotion: (object) => object.isEnabled() ? 1 : 0,
```

---

## CRD Class Template

Each Kubernetes CRD gets its own class extending `LensExtensionKubeObject`:

```typescript
import { Renderer } from "@freelensapp/extensions";

export interface MyResourceSpec {
  // spec fields
}

export interface MyResourceStatus {
  // status fields
}

export class MyResource extends Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  MyResourceStatus,
  MyResourceSpec
> {
  static readonly kind = "MyResource";
  static readonly namespaced = true;  // or false for cluster-scoped
  static readonly apiBase = "/apis/mygroup.io/v1alpha1/myresources";

  static readonly crd = {
    apiVersions: ["mygroup.io/v1alpha1"],
    plural: "myresources",
    singular: "myresource",
    shortNames: [],
    title: "My Resources",  // shown in sidebar menu
  };

  // Static helper methods for extracting data
  static getSomeField(object: MyResource): string {
    return object.spec?.someField ?? "";
  }
}

export class MyResourceApi extends Renderer.K8sApi.KubeApi<MyResource> {}
export class MyResourceStore extends Renderer.K8sApi.KubeObjectStore<MyResource> {}
```

---

## Context Menu Action Template

Actions that patch annotations to trigger controller behavior:

```typescript
import { Renderer } from "@freelensapp/extensions";
import type { MyResource } from "../k8s/my-resource";

const { Component: { MenuItem, Icon } } = Renderer;

type KubeObject = Renderer.K8sApi.LensExtensionKubeObject<Renderer.K8sApi.KubeObjectMetadata, unknown, unknown>;
type KubeObjectCtor = typeof Renderer.K8sApi.LensExtensionKubeObject<Renderer.K8sApi.KubeObjectMetadata, unknown, unknown>;

export interface MyActionMenuItemProps extends Renderer.Component.KubeObjectMenuProps<MyResource> {
  resource: KubeObjectCtor;
}

export function MyActionMenuItem(props: MyActionMenuItemProps) {
  const { object, toolbar, resource } = props;
  if (!object) return <></>;

  const store = resource.getStore<KubeObject>();
  if (!store) return <></>;

  const doAction = async () => {
    await store.patch(object, {
      metadata: {
        annotations: { "mygroup.io/my-action": new Date().toISOString() },
      },
    } as any, "merge");
  };

  return (
    <MenuItem onClick={doAction}>
      <Icon material="sync" interactive={toolbar} title="My Action" />
      <span className="title">My Action</span>
    </MenuItem>
  );
}
```

---

## List Page Template

```typescript
import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { withErrorPage } from "../components/error-page";
import { MyResource, type MyResourceApi } from "../k8s/my-resource";
import styles from "./my-resources.module.scss";
import stylesInline from "./my-resources.module.scss?inline";

const {
  Component: { Badge, KubeObjectListLayout, KubeObjectAge, NamespaceSelectBadge, WithTooltip },
} = Renderer;

const sortingCallbacks = {
  name: (object: MyResource) => object.getName(),
  namespace: (object: MyResource) => object.getNs(),
  age: (object: MyResource) => object.getCreationTimestamp(),
};

const renderTableHeader = [
  { title: "Name", sortBy: "name" as const },
  { title: "Namespace", sortBy: "namespace" as const },
  { title: "Age", sortBy: "age" as const },
];

export const MyResourcesPage = observer(() =>
  withErrorPage(() => {
    const store = MyResource.getStore<MyResource>();
    return (
      <>
        <style>{stylesInline}</style>
        <KubeObjectListLayout<MyResource, MyResourceApi>
          tableId={`${MyResource.crd.plural}Table`}
          className={styles.page}
          store={store}
          sortingCallbacks={sortingCallbacks}
          searchFilters={[(object) => object.getSearchFields()]}
          renderHeaderTitle={MyResource.crd.title}
          renderTableHeader={renderTableHeader}
          renderTableContents={(object) => [
            <WithTooltip>{object.getName()}</WithTooltip>,
            <NamespaceSelectBadge key="namespace" namespace={object.getNs() ?? ""} />,
            <KubeObjectAge object={object} key="age" />,
          ]}
        />
      </>
    );
  }),
);
```

---

## Detail View Template

```typescript
import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { observer } from "mobx-react";
import { MyResource } from "../../k8s/my-resource";
import { defaultYamlDumpOptions, getHeight } from "../../utils";
import styles from "./my-resource-details.module.scss";
import stylesInline from "./my-resource-details.module.scss?inline";

const {
  Component: { Badge, DrawerItem, DrawerTitle, MonacoEditor },
} = Renderer;

export const MyResourceDetails: React.FC<
  Renderer.Component.KubeObjectDetailsProps<MyResource>
> = observer((props) => {
  const { object } = props;
  const specYaml = yaml.dump(object.spec ?? {}, defaultYamlDumpOptions);

  return (
    <>
      <style>{stylesInline}</style>
      <div className={styles.details}>
        <DrawerItem name="Some Field">
          {MyResource.getSomeField(object)}
        </DrawerItem>

        <DrawerTitle>Spec</DrawerTitle>
        <MonacoEditor
          style={{ height: getHeight(specYaml), minHeight: 100 }}
          value={specYaml}
          language="yaml"
          readOnly
        />
      </div>
    </>
  );
});
```

---

## Event Filtering Template

Filter K8s events to your extension's API group:

```typescript
function isMyExtensionEvent(event: Renderer.K8sApi.KubeEvent): boolean {
  return event?.involvedObject?.apiVersion?.includes("mygroup.io/") ?? false;
}
```

---

## Status Badge Mapping Template

```typescript
export function getMyStatusClass(status?: string): string {
  switch (status) {
    case "Ready":
    case "Healthy":
    case "Succeeded":
      return "success";
    case "Degraded":
    case "Failed":
    case "Error":
      return "error";
    case "Progressing":
    case "Running":
    case "Pending":
      return "warning";
    case "Suspended":
    case "Paused":
      return "info";
    default:
      return "";
  }
}
```

---

## Build & Release

```bash
pnpm install              # Install dependencies
pnpm type:check           # TypeScript validation only
pnpm build                # Type check + build
pnpm build:force          # Build without type check
pnpm pack                 # Create .tgz for installation
pnpm pack:dev             # Version bump + build + pack (dev workflow)
```

**CI/CD:** The `release.yaml` workflow triggers on `v*` tags, builds, packs, and creates a GitHub release with the `.tgz` artifact.

```bash
git tag v0.1.0 -m "v0.1.0: Initial release"
git push origin main && git push origin v0.1.0
```

---

## Existing Extensions for Reference

| Extension | Repo | CRDs |
|-----------|------|------|
| ArgoCD | `github.com/jhajali/freelens-argocd-extension` | Application, ApplicationSet, AppProject |
| Kargo | `github.com/jhajali/freelens-kargo-extension` | Project, Stage, Freight, Warehouse, Promotion, PromotionPolicy, AnalysisTemplate |

---

## Common Issues & Fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Extension flickers enabled/disabled on install | Page/menu ID collision with another extension | Prefix ALL IDs with `<extname>-` |
| Extension flickers enabled/disabled on install | Page component receives `extension` prop | Use `() => <MyPage />` not `(props) => <MyPage {...props} />` |
| "not registered" error in console | CRDs not installed in cluster | Wrap pages with `withErrorPage()` — returns null gracefully |
| Type error on sorting callback | Callback returns boolean | Convert to number: `? 1 : 0` |
| SCSS module types missing | Forgot to commit generated `.d.scss.ts` files | Run build, then `git add **/*.d.scss.ts` |
| Build warning "renderer config is missing" | Expected with electron-vite preload config pattern | Safe to ignore — uses `preload` config for renderer output |
