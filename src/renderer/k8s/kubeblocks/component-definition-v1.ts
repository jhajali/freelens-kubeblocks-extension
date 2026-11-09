import { Renderer } from "@freelensapp/extensions";

import type { KubeBlocksKubeObjectCRD, KubeBlocksKubeObjectStatus } from "./types";

export interface ComponentDefinitionSpec {
  provider?: string;
  description?: string;
  serviceKind?: string;
  serviceVersion?: string;
  runtime?: any;
  roles?: { name?: string; serviceable?: boolean; writable?: boolean; votable?: boolean }[];
  volumes?: { name?: string; needSnapshot?: boolean }[];
  lifecycleActions?: Record<string, any>;
  services?: any[];
}

export interface ComponentDefinitionStatus extends KubeBlocksKubeObjectStatus {
  phase?: string;
  observedGeneration?: number;
}

export class ComponentDefinition extends Renderer.K8sApi.LensExtensionKubeObject<
  Renderer.K8sApi.KubeObjectMetadata,
  ComponentDefinitionStatus,
  ComponentDefinitionSpec
> {
  declare kind: "ComponentDefinition";
  declare apiVersion: "apps.kubeblocks.io/v1" | "apps.kubeblocks.io/v1alpha1";

  static readonly kind = "ComponentDefinition";
  static readonly namespaced = false;
  static readonly apiBase = "/apis/apps.kubeblocks.io/v1/componentdefinitions";

  static readonly crd: KubeBlocksKubeObjectCRD = {
    apiVersions: ["apps.kubeblocks.io/v1", "apps.kubeblocks.io/v1alpha1"],
    plural: "componentdefinitions",
    singular: "componentdefinition",
    shortNames: ["cmpd"],
    title: "Component Definitions",
  };

  static getProvider(object: ComponentDefinition): string {
    return object.spec?.provider ?? object.metadata?.labels?.["app.kubernetes.io/name"] ?? "";
  }

  static getDescription(object: ComponentDefinition): string {
    return object.spec?.description ?? "";
  }

  static getServiceKind(object: ComponentDefinition): string {
    return object.spec?.serviceKind ?? "";
  }

  static getServiceVersion(object: ComponentDefinition): string {
    return object.spec?.serviceVersion ?? "";
  }
}

export class ComponentDefinitionApi extends Renderer.K8sApi.KubeApi<ComponentDefinition> {}
export class ComponentDefinitionStore extends Renderer.K8sApi.KubeObjectStore<
  ComponentDefinition,
  ComponentDefinitionApi
> {}
