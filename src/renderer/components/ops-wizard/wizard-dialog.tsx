import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { useState } from "react";
import type { OpsRequestType } from "../../k8s/kubeblocks/types";
import { StepConfigure, type OpsConfig } from "./step-configure";
import styles from "./ops-wizard.module.scss";
import stylesInline from "./ops-wizard.module.scss?inline";
import { StepReview, buildOpsRequestYaml } from "./step-review";
import { StepSelectCluster } from "./step-select-cluster";
import { StepSelectOperation } from "./step-select-operation";

const {
  Component: { Button, Icon },
} = Renderer;

export interface WizardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCluster?: string;
  preselectedNamespace?: string;
  preselectedType?: OpsRequestType;
}

const STEP_LABELS = ["Select Cluster", "Select Operation", "Configure", "Review & Submit"];
const emptyConfig: OpsConfig = {
  componentName: "",
  replicas: "",
  cpu: "",
  memory: "",
  storage: "",
  serviceVersion: "",
  backupMethod: "",
  backupName: "",
  serviceType: "ClusterIP",
  instanceName: "",
};

export function WizardDialog({ isOpen, onClose, preselectedCluster, preselectedNamespace, preselectedType }: WizardDialogProps) {
  const [step, setStep] = useState(preselectedCluster ? (preselectedType ? 2 : 1) : 0);
  const [clusterName, setClusterName] = useState(preselectedCluster ?? "");
  const [namespace, setNamespace] = useState(preselectedNamespace ?? "");
  const [opsType, setOpsType] = useState<OpsRequestType | "">(preselectedType ?? "");
  const [config, setConfig] = useState<OpsConfig>({ ...emptyConfig });
  const [reviewYaml, setReviewYaml] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const canNext = () => {
    switch (step) {
      case 0: return clusterName !== "";
      case 1: return opsType !== "";
      case 2: return true;
      case 3: return reviewYaml !== "";
      default: return false;
    }
  };

  const goNext = () => {
    if (step === 2 && opsType) {
      setReviewYaml(buildOpsRequestYaml(clusterName, namespace, opsType, config));
    }
    setStep(step + 1);
  };

  const goBack = () => setStep(step - 1);

  const doSubmit = async () => {
    setSubmitting(true);
    try {
      const manifest = yaml.load(reviewYaml) as any;
      const ns = manifest.metadata?.namespace ?? namespace;
      const apiBase = `/apis/apps.kubeblocks.io/v1alpha1/namespaces/${ns}/opsrequests`;

      await fetch(`/api-kube${apiBase}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manifest),
      });

      onClose();
    } catch (error) {
      console.error("Failed to create OpsRequest:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{stylesInline}</style>
      <div className={styles.wizardOverlay} onClick={onClose}>
        <div className={styles.wizard} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <h5>Create Operation</h5>
            <Icon material="close" onClick={onClose} interactive />
          </div>

          <div className={styles.steps}>
            {STEP_LABELS.map((label, i) => (
              <div
                key={label}
                className={`${styles.step} ${i === step ? styles.active : ""} ${i < step ? styles.completed : ""}`}
              >
                {label}
              </div>
            ))}
          </div>

          <div className={styles.content}>
            {step === 0 && (
              <StepSelectCluster
                selectedCluster={clusterName}
                selectedNamespace={namespace}
                onSelect={(name, ns) => { setClusterName(name); setNamespace(ns); }}
              />
            )}
            {step === 1 && (
              <StepSelectOperation selectedType={opsType} onSelect={(t) => setOpsType(t)} />
            )}
            {step === 2 && (
              <StepConfigure opsType={opsType} config={config} onChange={setConfig} />
            )}
            {step === 3 && (
              <StepReview
                clusterName={clusterName}
                namespace={namespace}
                opsType={opsType as OpsRequestType}
                config={config}
                yamlValue={reviewYaml}
                onYamlChange={setReviewYaml}
              />
            )}
          </div>

          <div className={styles.footer}>
            {step > 0 && <Button plain onClick={goBack}>Back</Button>}
            {step < 3 && (
              <Button primary onClick={goNext} disabled={!canNext()}>
                Next
              </Button>
            )}
            {step === 3 && (
              <Button primary onClick={doSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

