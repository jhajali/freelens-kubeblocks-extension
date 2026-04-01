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
