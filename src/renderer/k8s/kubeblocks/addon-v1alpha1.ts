import { Renderer } from "@freelensapp/extensions";
import type { AddonInstallSpec, AddonPhase, KubeBlocksKubeObjectCRD, KubeBlocksKubeObjectStatus } from "./types";

export interface AddonSpec {
  description?: string;
  type?: string;
  provider?: string;
  version?: string;
  defaultInstallValues?: AddonInstallSpec[];
  installSpec?: AddonInstallSpec;
}

export interface AddonStatus extends KubeBlocksKubeObjectStatus {
  phase?: AddonPhase;
  observedGeneration?: number;
}

export class Addon extends Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  AddonStatus,
  AddonSpec
> {
  static readonly kind = "Addon";
  static readonly namespaced = false;
  static readonly apiBase = "/apis/extensions.kubeblocks.io/v1alpha1/addons";

  static readonly crd: KubeBlocksKubeObjectCRD = {
    apiVersions: ["extensions.kubeblocks.io/v1alpha1"],
    plural: "addons",
    singular: "addon",
    shortNames: ["addon"],
    title: "Addons",
  };

  static getPhase(object: Addon): string {
    return object.status?.phase ?? "Unknown";
  }

  static getType(object: Addon): string {
    return object.spec?.type ?? "";
  }

  static getProvider(object: Addon): string {
    return object.spec?.provider ?? "";
  }

  static getVersion(object: Addon): string {
    return object.spec?.version ?? "";
  }

  static getDescription(object: Addon): string {
    return object.spec?.description ?? "";
  }

  static isEnabled(object: Addon): boolean {
    return object.status?.phase === "Enabled";
  }
}

export class AddonApi extends Renderer.K8sApi.KubeApi<Addon> {}
export class AddonStore extends Renderer.K8sApi.KubeObjectStore<Addon> {}
