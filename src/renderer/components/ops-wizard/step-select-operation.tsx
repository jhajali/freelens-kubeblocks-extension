import { Renderer } from "@freelensapp/extensions";
import type { OpsRequestType } from "../../k8s/kubeblocks/types";
import { getOpsTypeIcon } from "../../utils";
import styles from "./ops-wizard.module.scss";

const {
  Component: { Icon },
} = Renderer;

const operations: { type: OpsRequestType; label: string; description: string }[] = [
  { type: "Restart", label: "Restart", description: "Restart all pods" },
  { type: "Stop", label: "Stop", description: "Stop the cluster" },
  { type: "Start", label: "Start", description: "Start a stopped cluster" },
  { type: "HorizontalScaling", label: "Horizontal Scale", description: "Change replica count" },
  { type: "VerticalScaling", label: "Vertical Scale", description: "Change CPU/memory" },
  { type: "VolumeExpansion", label: "Volume Expand", description: "Increase storage size" },
  { type: "Upgrade", label: "Upgrade", description: "Upgrade service version" },
  { type: "Backup", label: "Backup", description: "Create a backup" },
  { type: "Restore", label: "Restore", description: "Restore from backup" },
  { type: "Expose", label: "Expose", description: "Expose services" },
  { type: "Switchover", label: "Switchover", description: "Switch primary instance" },
  { type: "Reconfiguring", label: "Reconfigure", description: "Change configuration" },
];

export interface StepSelectOperationProps {
  selectedType: OpsRequestType | "";
  onSelect: (type: OpsRequestType) => void;
}

export function StepSelectOperation({ selectedType, onSelect }: StepSelectOperationProps) {
  return (
    <div className={styles.operationGrid}>
      {operations.map((op) => (
        <div
          key={op.type}
          className={`${styles.operationCard} ${selectedType === op.type ? styles.selected : ""}`}
          onClick={() => onSelect(op.type)}
        >
          <Icon material={getOpsTypeIcon(op.type)} />
          <span><b>{op.label}</b></span>
          <span>{op.description}</span>
        </div>
      ))}
    </div>
  );
}
