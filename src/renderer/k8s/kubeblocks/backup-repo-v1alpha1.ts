import { Renderer } from "@freelensapp/extensions";
import type { KubeBlocksKubeObjectCRD, KubeBlocksKubeObjectStatus } from "./types";

export interface BackupRepoSpec {
  storageProviderRef?: string;
  accessMethod?: string;
  pvReclaimPolicy?: string;
  pathPrefix?: string;
  volumeCapacity?: string;
  config?: Record<string, string>;
  credential?: { name?: string; namespace?: string };
}

export interface BackupRepoStatus extends KubeBlocksKubeObjectStatus {
  phase?: string;
  isDefault?: boolean;
  generatedStorageClassName?: string;
  backupPVCName?: string;
  observedGeneration?: number;
}

export class BackupRepo extends Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  BackupRepoStatus,
  BackupRepoSpec
> {
  static readonly kind = "BackupRepo";
  static readonly namespaced = false;
  static readonly apiBase = "/apis/dataprotection.kubeblocks.io/v1alpha1/backuprepos";

  static readonly crd: KubeBlocksKubeObjectCRD = {
    apiVersions: ["dataprotection.kubeblocks.io/v1alpha1"],
    plural: "backuprepos",
    singular: "backuprepo",
    shortNames: [],
    title: "Backup Locations",
  };

  static getPhase(object: BackupRepo): string {
    return object.status?.phase ?? "Unknown";
  }

  static getProvider(object: BackupRepo): string {
    return object.spec?.storageProviderRef ?? "";
  }

  static getAccessMethod(object: BackupRepo): string {
    return object.spec?.accessMethod ?? "";
  }

  static isDefault(object: BackupRepo): boolean {
    return object.status?.isDefault ?? false;
  }

  static getBucket(object: BackupRepo): string {
    return object.spec?.config?.bucket ?? object.spec?.config?.container ?? "";
  }

  static getRegion(object: BackupRepo): string {
    return object.spec?.config?.region ?? "";
  }

  static getEndpoint(object: BackupRepo): string {
    return object.spec?.config?.endpoint ?? "";
  }
}

export class BackupRepoApi extends Renderer.K8sApi.KubeApi<BackupRepo> {}
export class BackupRepoStore extends Renderer.K8sApi.KubeObjectStore<BackupRepo> {}
