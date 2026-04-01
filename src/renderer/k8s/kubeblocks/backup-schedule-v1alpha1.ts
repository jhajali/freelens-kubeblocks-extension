import { Renderer } from "@freelensapp/extensions";
import type { KubeBlocksKubeObjectCRD, KubeBlocksKubeObjectStatus } from "./types";

export interface BackupScheduleItem {
  backupMethod?: string;
  cronExpression?: string;
  enabled?: boolean;
  retentionPeriod?: string;
}

export interface BackupScheduleSpec {
  backupPolicyName?: string;
  schedules?: BackupScheduleItem[];
  startingDeadlineMinutes?: number;
}

export interface BackupScheduleStatus extends KubeBlocksKubeObjectStatus {
  phase?: string;
  observedGeneration?: number;
}

export class BackupSchedule extends Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  BackupScheduleStatus,
  BackupScheduleSpec
> {
  static readonly kind = "BackupSchedule";
  static readonly namespaced = true;
  static readonly apiBase = "/apis/dataprotection.kubeblocks.io/v1alpha1/backupschedules";

  static readonly crd: KubeBlocksKubeObjectCRD = {
    apiVersions: ["dataprotection.kubeblocks.io/v1alpha1"],
    plural: "backupschedules",
    singular: "backupschedule",
    shortNames: ["bs"],
    title: "Backup Schedules",
  };

  static getPhase(object: BackupSchedule): string {
    return object.status?.phase ?? "Unknown";
  }

  static getClusterName(object: BackupSchedule): string {
    return object.metadata?.labels?.["app.kubernetes.io/instance"] ?? "";
  }

  static getPolicyName(object: BackupSchedule): string {
    return object.spec?.backupPolicyName ?? "";
  }

  static getSchedules(object: BackupSchedule): BackupScheduleItem[] {
    return object.spec?.schedules ?? [];
  }

  static getEnabledCount(object: BackupSchedule): number {
    return (object.spec?.schedules ?? []).filter((s) => s.enabled).length;
  }

  static getTotalCount(object: BackupSchedule): number {
    return (object.spec?.schedules ?? []).length;
  }
}

export class BackupScheduleApi extends Renderer.K8sApi.KubeApi<BackupSchedule> {}
export class BackupScheduleStore extends Renderer.K8sApi.KubeObjectStore<BackupSchedule> {}
