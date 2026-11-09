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
  declare kind: "OpsRequest";
  declare apiVersion: "operations.kubeblocks.io/v1alpha1";

  static readonly kind = "OpsRequest";
  static readonly namespaced = true;
  static readonly apiBase = "/apis/operations.kubeblocks.io/v1alpha1/opsrequests";

  static readonly crd: KubeBlocksKubeObjectCRD = {
    apiVersions: ["operations.kubeblocks.io/v1alpha1"],
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
export class OpsRequestStore extends Renderer.K8sApi.KubeObjectStore<OpsRequest, OpsRequestApi> {}
