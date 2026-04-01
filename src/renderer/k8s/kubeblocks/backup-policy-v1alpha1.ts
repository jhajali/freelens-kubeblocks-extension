import { Renderer } from "@freelensapp/extensions";
import type { KubeBlocksKubeObjectCRD, KubeBlocksKubeObjectStatus } from "./types";

export interface BackupPolicyMethod {
  name?: string;
  actionSetName?: string;
  snapshotVolumes?: boolean;
  target?: any;
}

export interface BackupPolicySpec {
  backupMethods?: BackupPolicyMethod[];
  target?: any;
  backoffLimit?: number;
}

export interface BackupPolicyStatus extends KubeBlocksKubeObjectStatus {
  phase?: string;
  observedGeneration?: number;
}

export class BackupPolicy extends Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  BackupPolicyStatus,
  BackupPolicySpec
> {
  static readonly kind = "BackupPolicy";
  static readonly namespaced = true;
  static readonly apiBase = "/apis/dataprotection.kubeblocks.io/v1alpha1/backuppolicies";

  static readonly crd: KubeBlocksKubeObjectCRD = {
    apiVersions: ["dataprotection.kubeblocks.io/v1alpha1"],
    plural: "backuppolicies",
    singular: "backuppolicy",
    shortNames: ["bp"],
    title: "Backup Policies",
  };

  static getClusterName(object: BackupPolicy): string {
    return object.metadata?.labels?.["app.kubernetes.io/instance"] ?? "";
  }

  static getMethods(object: BackupPolicy): string[] {
    return object.spec?.backupMethods?.map((m) => m.name ?? "").filter(Boolean) ?? [];
  }
}

export class BackupPolicyApi extends Renderer.K8sApi.KubeApi<BackupPolicy> {}
export class BackupPolicyStore extends Renderer.K8sApi.KubeObjectStore<BackupPolicy> {}
