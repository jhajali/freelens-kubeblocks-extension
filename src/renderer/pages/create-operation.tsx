import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { observer } from "mobx-react";
import { useState } from "react";
import { getPhaseClass } from "../components/status-conditions";
import { Cluster } from "../k8s/kubeblocks/cluster-v1";
import type { OpsRequestType } from "../k8s/kubeblocks/types";
import { defaultYamlDumpOptions, getHeight } from "../utils";
import styles from "./create-operation.module.scss";
import stylesInline from "./create-operation.module.scss?inline";

const {
  Component: { Badge, Button, Icon, MonacoEditor, TabLayout },
} = Renderer;

const OPS_TYPES: { type: OpsRequestType; label: string; icon: string; description: string }[] = [
  { type: "Restart", label: "Restart", icon: "restart_alt", description: "Restart all pods" },
  { type: "Stop", label: "Stop", icon: "stop", description: "Stop the cluster" },
  { type: "Start", label: "Start", icon: "play_arrow", description: "Start a stopped cluster" },
  { type: "HorizontalScaling", label: "Horizontal Scale", icon: "width_normal", description: "Change replica count" },
  { type: "VerticalScaling", label: "Vertical Scale", icon: "straighten", description: "Change CPU/memory" },
  { type: "VolumeExpansion", label: "Volume Expand", icon: "storage", description: "Increase storage size" },
  { type: "Upgrade", label: "Upgrade", icon: "upgrade", description: "Upgrade service version" },
  { type: "Backup", label: "Backup", icon: "backup", description: "Create a backup" },
  { type: "Restore", label: "Restore", icon: "restore", description: "Restore from backup" },
  { type: "Expose", label: "Expose", icon: "public", description: "Expose services" },
  { type: "Switchover", label: "Switchover", icon: "swap_horiz", description: "Switch primary instance" },
  { type: "Reconfiguring", label: "Reconfigure", icon: "settings", description: "Change configuration" },
];

function buildManifest(
  clusterName: string,
  namespace: string,
  opsType: OpsRequestType,
  componentName: string,
  replicas: string,
  cpu: string,
  memory: string,
  storage: string,
  serviceVersion: string,
  backupMethod: string,
  backupName: string,
  serviceType: string,
  instanceName: string,
): string {
  const name = `${clusterName}-${opsType.toLowerCase()}-${Math.floor(Date.now() / 1000)}`;
  const manifest: any = {
    apiVersion: "apps.kubeblocks.io/v1alpha1",
    kind: "OpsRequest",
    metadata: { name, namespace },
    spec: { clusterName, type: opsType },
  };

  switch (opsType) {
    case "HorizontalScaling":
      manifest.spec.horizontalScaling = [{ componentName, replicas: parseInt(replicas) || 1 }];
      break;
    case "VerticalScaling":
      manifest.spec.verticalScaling = [{
        componentName,
        resources: { requests: { cpu, memory }, limits: { cpu, memory } },
      }];
      break;
    case "VolumeExpansion":
      manifest.spec.volumeExpansion = [{
        componentName,
        volumeClaimTemplates: [{ name: "data", storage }],
      }];
      break;
    case "Upgrade":
      manifest.spec.upgrade = { serviceVersion };
      break;
    case "Backup":
      manifest.spec.backup = { backupMethod };
      break;
    case "Restore":
      manifest.spec.restore = { backupName };
      break;
    case "Expose":
      manifest.spec.expose = [{ componentName, services: [{ serviceType }] }];
      break;
    case "Switchover":
      manifest.spec.switchover = [{ componentName, instanceName }];
      break;
  }

  return yaml.dump(manifest, defaultYamlDumpOptions);
}

export const CreateOperationPage = observer(() => {
  const [step, setStep] = useState<"cluster" | "type" | "config" | "review">("cluster");
  const [clusterName, setClusterName] = useState("");
  const [namespace, setNamespace] = useState("");
  const [opsType, setOpsType] = useState<OpsRequestType | "">("");
  const [componentName, setComponentName] = useState("");
  const [replicas, setReplicas] = useState("");
  const [cpu, setCpu] = useState("");
  const [memory, setMemory] = useState("");
  const [storage, setStorage] = useState("");
  const [serviceVersion, setServiceVersion] = useState("");
  const [backupMethod, setBackupMethod] = useState("");
  const [backupName, setBackupName] = useState("");
  const [serviceType, setServiceType] = useState("ClusterIP");
  const [instanceName, setInstanceName] = useState("");
  const [reviewYaml, setReviewYaml] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  let clusters: Cluster[] = [];
  try {
    const store = Cluster.getStore<Cluster>();
    if (store) clusters = store.contextItems;
  } catch (_) {}

  const goToReview = () => {
    if (opsType) {
      setReviewYaml(buildManifest(
        clusterName, namespace, opsType, componentName, replicas,
        cpu, memory, storage, serviceVersion, backupMethod, backupName,
        serviceType, instanceName,
      ));
      setStep("review");
    }
  };

  const doSubmit = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const manifest = yaml.load(reviewYaml) as any;
      const ns = manifest.metadata?.namespace ?? namespace;
      const apiBase = `/apis/apps.kubeblocks.io/v1alpha1/namespaces/${ns}/opsrequests`;
      const res = await fetch(`/api-kube${apiBase}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manifest),
      });
      if (res.ok) {
        setResult({ ok: true, message: "OpsRequest created successfully!" });
      } else {
        const body = await res.text();
        setResult({ ok: false, message: `Failed: ${res.status} ${body}` });
      }
    } catch (error) {
      setResult({ ok: false, message: `Error: ${error}` });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (label: string, value: string, onChange: (v: string) => void, placeholder: string) => (
    <div className={styles.field}>
      <label>{label}</label>
      <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );

  const renderConfigFields = () => {
    const comp = renderField("Component Name", componentName, setComponentName, "e.g. mysql");
    switch (opsType) {
      case "HorizontalScaling":
        return <>{comp}{renderField("Replicas", replicas, setReplicas, "e.g. 3")}</>;
      case "VerticalScaling":
        return <>{comp}{renderField("CPU", cpu, setCpu, "e.g. 500m")}{renderField("Memory", memory, setMemory, "e.g. 1Gi")}</>;
      case "VolumeExpansion":
        return <>{comp}{renderField("Storage", storage, setStorage, "e.g. 20Gi")}</>;
      case "Upgrade":
        return renderField("Service Version", serviceVersion, setServiceVersion, "e.g. 8.0.33");
      case "Backup":
        return renderField("Backup Method", backupMethod, setBackupMethod, "e.g. xtrabackup");
      case "Restore":
        return renderField("Backup Name", backupName, setBackupName, "e.g. my-backup-20240101");
      case "Expose":
        return (
          <>
            {comp}
            <div className={styles.field}>
              <label>Service Type</label>
              <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                <option value="ClusterIP">ClusterIP</option>
                <option value="NodePort">NodePort</option>
                <option value="LoadBalancer">LoadBalancer</option>
              </select>
            </div>
          </>
        );
      case "Switchover":
        return <>{comp}{renderField("Instance Name", instanceName, setInstanceName, "e.g. mysql-0")}</>;
      default:
        return <p>No additional configuration needed.</p>;
    }
  };

  return (
    <>
      <style>{stylesInline}</style>
      <TabLayout>
        <div className={styles.page}>
          <header>
            <h5>Create Operation</h5>
          </header>

          <div className={styles.stepIndicator}>
            <span className={step === "cluster" ? styles.active : clusterName ? styles.done : ""}>1. Select Cluster</span>
            <span className={step === "type" ? styles.active : opsType ? styles.done : ""}>2. Operation Type</span>
            <span className={step === "config" ? styles.active : ""}>3. Configure</span>
            <span className={step === "review" ? styles.active : ""}>4. Review & Submit</span>
          </div>

          <div className={styles.content}>
            {step === "cluster" && (
              <div className={styles.section}>
                <h6>Select a cluster</h6>
                {clusters.length === 0 ? (
                  <p className={styles.muted}>No KubeBlocks clusters found in this context.</p>
                ) : (
                  <div className={styles.clusterGrid}>
                    {clusters.map((cl) => (
                      <div
                        key={cl.getId()}
                        className={`${styles.card} ${clusterName === cl.getName() && namespace === cl.getNs() ? styles.selected : ""}`}
                        onClick={() => { setClusterName(cl.getName()); setNamespace(cl.getNs() ?? ""); }}
                      >
                        <strong>{cl.getName()}</strong>
                        <span className={styles.muted}>{cl.getNs()}</span>
                        <Badge label={Cluster.getPhase(cl)} className={getPhaseClass(Cluster.getPhase(cl))} />
                      </div>
                    ))}
                  </div>
                )}
                <div className={styles.actions}>
                  <Button primary disabled={!clusterName} onClick={() => setStep("type")}>Next</Button>
                </div>
              </div>
            )}

            {step === "type" && (
              <div className={styles.section}>
                <h6>Select operation for <strong>{clusterName}</strong></h6>
                <div className={styles.opsGrid}>
                  {OPS_TYPES.map((op) => (
                    <div
                      key={op.type}
                      className={`${styles.card} ${opsType === op.type ? styles.selected : ""}`}
                      onClick={() => setOpsType(op.type)}
                    >
                      <Icon material={op.icon} />
                      <strong>{op.label}</strong>
                      <span className={styles.muted}>{op.description}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.actions}>
                  <Button plain onClick={() => setStep("cluster")}>Back</Button>
                  <Button primary disabled={!opsType} onClick={() => setStep("config")}>Next</Button>
                </div>
              </div>
            )}

            {step === "config" && (
              <div className={styles.section}>
                <h6>Configure {opsType} for <strong>{clusterName}</strong></h6>
                {renderConfigFields()}
                <div className={styles.actions}>
                  <Button plain onClick={() => setStep("type")}>Back</Button>
                  <Button primary onClick={goToReview}>Review</Button>
                </div>
              </div>
            )}

            {step === "review" && (
              <div className={styles.section}>
                <h6>Review OpsRequest YAML</h6>
                <p className={styles.muted}>Edit the manifest below if needed, then submit.</p>
                <MonacoEditor
                  style={{ height: Math.max(getHeight(reviewYaml), 200), minHeight: 200 }}
                  value={reviewYaml}
                  language="yaml"
                  onChange={(v) => setReviewYaml(v)}
                  options={{ scrollbar: { alwaysConsumeMouseWheel: false } }}
                />
                {result && (
                  <p className={result.ok ? styles.success : styles.error}>{result.message}</p>
                )}
                <div className={styles.actions}>
                  <Button plain onClick={() => setStep("config")}>Back</Button>
                  <Button primary onClick={doSubmit} disabled={submitting || !reviewYaml}>
                    {submitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </TabLayout>
    </>
  );
});
