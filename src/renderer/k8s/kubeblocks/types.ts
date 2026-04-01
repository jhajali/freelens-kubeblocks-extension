import { Renderer } from "@freelensapp/extensions";
import type { Condition } from "@freelensapp/kube-object";

export interface KubeBlocksKubeObjectCRD extends Renderer.K8sApi.LensExtensionKubeObjectCRD {
  title: string;
}

export interface KubeBlocksKubeObjectStatus {
  conditions?: Condition[];
  phase?: string;
  message?: string;
  observedGeneration?: number;
}

// Cluster types
export type ClusterPhase =
  | "Creating"
  | "Running"
  | "Updating"
  | "Stopping"
  | "Stopped"
  | "Deleting"
  | "Failed"
  | "Abnormal"
  | "";

export interface ClusterComponentSpec {
  name?: string;
  componentDef?: string;
  componentDefRef?: string;
  replicas?: number;
  resources?: {
    requests?: { cpu?: string; memory?: string };
    limits?: { cpu?: string; memory?: string };
  };
  volumeClaimTemplates?: {
    name?: string;
    spec?: {
      accessModes?: string[];
      resources?: { requests?: { storage?: string } };
      storageClassName?: string;
    };
  }[];
  serviceVersion?: string;
}

export interface ClusterService {
  name?: string;
  serviceName?: string;
  componentSelector?: string;
  type?: string;
  ports?: { name?: string; port?: number; targetPort?: number; protocol?: string }[];
}

// OpsRequest types
export type OpsRequestType =
  | "Upgrade"
  | "VerticalScaling"
  | "VolumeExpansion"
  | "HorizontalScaling"
  | "Restart"
  | "Reconfiguring"
  | "Start"
  | "Stop"
  | "Expose"
  | "Switchover"
  | "Backup"
  | "Restore"
  | "Custom";

export type OpsRequestPhase =
  | "Pending"
  | "Creating"
  | "Running"
  | "Cancelling"
  | "Cancelled"
  | "Succeed"
  | "Failed"
  | "";

export interface OpsRequestComponentSpec {
  componentName?: string;
  replicas?: number;
  resources?: {
    requests?: { cpu?: string; memory?: string };
    limits?: { cpu?: string; memory?: string };
  };
  volumeClaimTemplates?: {
    name?: string;
    storage?: string;
  }[];
  serviceVersion?: string;
  instances?: { name?: string }[];
}

// Backup types
export type BackupPhase = "New" | "InProgress" | "Running" | "Completed" | "Failed" | "Deleting" | "";

export interface BackupMethod {
  name?: string;
  actionSetName?: string;
  snapshotVolumes?: boolean;
}

// Restore types
export type RestorePhase = "Running" | "Completed" | "Failed" | "AsDataSource" | "";

// Addon types
export type AddonPhase = "Enabled" | "Disabled" | "Enabling" | "Disabling" | "Failed" | "";

export interface AddonInstallSpec {
  enabled?: boolean;
  addonInstallType?: string;
  helm?: {
    chartLocationURL?: string;
    chartsImage?: string;
    chartsPathInImage?: string;
    installOptions?: Record<string, string>;
    installValues?: {
      configMapRefs?: { name?: string; key?: string }[];
      secretRefs?: { name?: string; key?: string }[];
      setValues?: string[];
      setJSONValues?: string[];
    };
    valuesMapping?: Record<string, any>;
  };
}
