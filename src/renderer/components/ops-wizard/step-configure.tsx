import type { OpsRequestType } from "../../k8s/kubeblocks/types";
import styles from "./ops-wizard.module.scss";

export interface OpsConfig {
  componentName: string;
  replicas: string;
  cpu: string;
  memory: string;
  storage: string;
  serviceVersion: string;
  backupMethod: string;
  backupName: string;
  serviceType: string;
  instanceName: string;
}

export interface StepConfigureProps {
  opsType: OpsRequestType | "";
  config: OpsConfig;
  onChange: (config: OpsConfig) => void;
}

export function StepConfigure({ opsType, config, onChange }: StepConfigureProps) {
  const update = (field: keyof OpsConfig, value: string) => {
    onChange({ ...config, [field]: value });
  };

  const renderField = (label: string, field: keyof OpsConfig, placeholder: string) => (
    <div className={styles.formField}>
      <label>{label}</label>
      <input
        type="text"
        value={config[field]}
        placeholder={placeholder}
        onChange={(e) => update(field, e.target.value)}
      />
    </div>
  );

  const componentField = renderField("Component Name", "componentName", "e.g. mysql");

  switch (opsType) {
    case "HorizontalScaling":
      return (
        <div>
          {componentField}
          {renderField("Replicas", "replicas", "e.g. 3")}
        </div>
      );
    case "VerticalScaling":
      return (
        <div>
          {componentField}
          {renderField("CPU", "cpu", "e.g. 500m")}
          {renderField("Memory", "memory", "e.g. 1Gi")}
        </div>
      );
    case "VolumeExpansion":
      return (
        <div>
          {componentField}
          {renderField("Storage", "storage", "e.g. 20Gi")}
        </div>
      );
    case "Upgrade":
      return (
        <div>
          {renderField("Service Version", "serviceVersion", "e.g. 8.0.33")}
        </div>
      );
    case "Backup":
      return (
        <div>
          {renderField("Backup Method", "backupMethod", "e.g. xtrabackup")}
        </div>
      );
    case "Restore":
      return (
        <div>
          {renderField("Backup Name", "backupName", "e.g. my-backup-20240101")}
        </div>
      );
    case "Expose":
      return (
        <div>
          {componentField}
          <div className={styles.formField}>
            <label>Service Type</label>
            <select value={config.serviceType} onChange={(e) => update("serviceType", e.target.value)}>
              <option value="ClusterIP">ClusterIP</option>
              <option value="NodePort">NodePort</option>
              <option value="LoadBalancer">LoadBalancer</option>
            </select>
          </div>
        </div>
      );
    case "Switchover":
      return (
        <div>
          {componentField}
          {renderField("Instance Name", "instanceName", "e.g. mysql-0")}
        </div>
      );
    case "Restart":
    case "Stop":
    case "Start":
      return <p>No additional configuration needed for {opsType}.</p>;
    default:
      return <p>Select an operation type first.</p>;
  }
}
