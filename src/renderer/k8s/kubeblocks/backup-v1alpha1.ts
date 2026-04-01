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
