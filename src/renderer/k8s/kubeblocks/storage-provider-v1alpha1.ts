import { Renderer } from "@freelensapp/extensions";
import type { KubeBlocksKubeObjectCRD, KubeBlocksKubeObjectStatus } from "./types";

export interface StorageProviderSpec {
  csiDriverName?: string;
  csiDriverSecretTemplate?: string;
  storageClassTemplate?: string;
  datasafedConfigTemplate?: string;
  parametersSchema?: {
    openAPIV3Schema?: {
      properties?: Record<string, { type?: string; description?: string }>;
    };
    credentialFields?: string[];
  };
}

export interface StorageProviderStatus extends KubeBlocksKubeObjectStatus {
  phase?: string;
}

export class StorageProvider extends Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  StorageProviderStatus,
  StorageProviderSpec
> {
  static readonly kind = "StorageProvider";
  static readonly namespaced = false;
  static readonly apiBase = "/apis/dataprotection.kubeblocks.io/v1alpha1/storageproviders";

  static readonly crd: KubeBlocksKubeObjectCRD = {
    apiVersions: ["dataprotection.kubeblocks.io/v1alpha1"],
    plural: "storageproviders",
    singular: "storageprovider",
    shortNames: [],
    title: "Storage Providers",
  };

  static getConfigFields(object: StorageProvider): string[] {
    const props = object.spec?.parametersSchema?.openAPIV3Schema?.properties ?? {};
    const creds = object.spec?.parametersSchema?.credentialFields ?? [];
    return Object.keys(props).filter((k) => !creds.includes(k));
  }

  static getCredentialFields(object: StorageProvider): string[] {
    return object.spec?.parametersSchema?.credentialFields ?? [];
  }

  static getFieldDescription(object: StorageProvider, field: string): string {
    return object.spec?.parametersSchema?.openAPIV3Schema?.properties?.[field]?.description ?? "";
  }
}

export class StorageProviderApi extends Renderer.K8sApi.KubeApi<StorageProvider> {}
export class StorageProviderStore extends Renderer.K8sApi.KubeObjectStore<StorageProvider> {}
