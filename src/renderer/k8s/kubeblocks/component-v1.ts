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
