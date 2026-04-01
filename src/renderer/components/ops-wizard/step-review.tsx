import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { useState } from "react";
import type { OpsRequestType } from "../../k8s/kubeblocks/types";
import { defaultYamlDumpOptions, getHeight } from "../../utils";
import type { OpsConfig } from "./step-configure";
import styles from "./ops-wizard.module.scss";

const {
  Component: { MonacoEditor },
} = Renderer;

export interface StepReviewProps {
  clusterName: string;
  namespace: string;
  opsType: OpsRequestType;
  config: OpsConfig;
  yamlValue: string;
  onYamlChange: (yaml: string) => void;
}

export function StepReview({ yamlValue, onYamlChange }: StepReviewProps) {
  return (
    <div>
      <p>Review and edit the OpsRequest manifest before submitting:</p>
      <MonacoEditor
        style={{ minHeight: getHeight(yamlValue), height: 360 }}
        value={yamlValue}
        language="yaml"
        onChange={onYamlChange}
        options={{ scrollbar: { alwaysConsumeMouseWheel: false } }}
      />
    </div>
  );
}

export function buildOpsRequestYaml(
  clusterName: string,
  namespace: string,
  opsType: OpsRequestType,
  config: OpsConfig,
): string {
  const name = `${clusterName}-${opsType.toLowerCase()}-${Date.now()}`;
  const manifest: any = {
    apiVersion: "apps.kubeblocks.io/v1alpha1",
    kind: "OpsRequest",
    metadata: { name, namespace },
    spec: { clusterName, type: opsType },
  };

  switch (opsType) {
    case "HorizontalScaling":
      manifest.spec.horizontalScaling = [
        { componentName: config.componentName, replicas: parseInt(config.replicas) || 1 },
      ];
      break;
    case "VerticalScaling":
      manifest.spec.verticalScaling = [
        {
          componentName: config.componentName,
          resources: {
            requests: { cpu: config.cpu, memory: config.memory },
            limits: { cpu: config.cpu, memory: config.memory },
          },
        },
      ];
      break;
    case "VolumeExpansion":
      manifest.spec.volumeExpansion = [
        { componentName: config.componentName, volumeClaimTemplates: [{ name: "data", storage: config.storage }] },
      ];
      break;
    case "Upgrade":
      manifest.spec.upgrade = { serviceVersion: config.serviceVersion };
      break;
    case "Backup":
      manifest.spec.backup = { backupMethod: config.backupMethod };
      break;
    case "Restore":
      manifest.spec.restore = { backupName: config.backupName };
      break;
    case "Expose":
      manifest.spec.expose = [
        { componentName: config.componentName, services: [{ serviceType: config.serviceType }] },
      ];
      break;
    case "Switchover":
      manifest.spec.switchover = [
        { componentName: config.componentName, instanceName: config.instanceName },
      ];
      break;
  }

  return yaml.dump(manifest, defaultYamlDumpOptions);
}
