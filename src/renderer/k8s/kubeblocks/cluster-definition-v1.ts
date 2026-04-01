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
