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
  declare kind: "Cluster";
  declare apiVersion: "apps.kubeblocks.io/v1" | "apps.kubeblocks.io/v1alpha1";

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
export class ClusterStore extends Renderer.K8sApi.KubeObjectStore<Cluster, ClusterApi> {}
