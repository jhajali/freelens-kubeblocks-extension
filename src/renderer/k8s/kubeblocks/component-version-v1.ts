import { Renderer } from "@freelensapp/extensions";

import type { KubeBlocksKubeObjectCRD, KubeBlocksKubeObjectStatus } from "./types";

export interface ComponentVersionRelease {
  serviceVersion?: string;
  images?: Record<string, string>;
}

export interface ComponentVersionSpec {
  compatibilityRules?: { compDefs?: string[]; releases?: string[] }[];
  releases?: ComponentVersionRelease[];
}

export interface ComponentVersionStatus extends KubeBlocksKubeObjectStatus {
  phase?: string;
  observedGeneration?: number;
  serviceVersions?: string;
}

export class ComponentVersion extends Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  ComponentVersionStatus,
  ComponentVersionSpec
> {
  declare kind: "ComponentVersion";
  declare apiVersion: "apps.kubeblocks.io/v1";

  static readonly kind = "ComponentVersion";
  static readonly namespaced = false;
  static readonly apiBase = "/apis/apps.kubeblocks.io/v1/componentversions";

  static readonly crd: KubeBlocksKubeObjectCRD = {
    apiVersions: ["apps.kubeblocks.io/v1"],
    plural: "componentversions",
    singular: "componentversion",
    shortNames: ["cmpv"],
    title: "Component Versions",
  };

  static getServiceVersions(object: ComponentVersion): string[] {
    return object.spec?.releases?.map((r) => r.serviceVersion ?? "").filter(Boolean) ?? [];
  }
}

export class ComponentVersionApi extends Renderer.K8sApi.KubeApi<ComponentVersion> {}
export class ComponentVersionStore extends Renderer.K8sApi.KubeObjectStore<ComponentVersion, ComponentVersionApi> {}
