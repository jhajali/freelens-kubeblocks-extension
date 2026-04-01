import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { observer } from "mobx-react";
import { useEffect, useRef, useState } from "react";
import { InfoPage } from "../components/info-page";
import { getPhaseClass } from "../components/status-conditions";
import { BackupPolicy } from "../k8s/kubeblocks/backup-policy-v1alpha1";
import { Backup } from "../k8s/kubeblocks/backup-v1alpha1";
import { Cluster } from "../k8s/kubeblocks/cluster-v1";
import { ComponentVersion } from "../k8s/kubeblocks/component-version-v1";
import type { ClusterComponentSpec, OpsRequestType } from "../k8s/kubeblocks/types";
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
  { type: "HorizontalScaling", label: "Horizontal Scale", icon: "view_column", description: "Change replica count" },
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
  const shortType = opsType.toLowerCase().slice(0, 6);
  const ts = Math.floor(Date.now() / 1000).toString(36);
  const maxCluster = 30 - shortType.length - ts.length - 2;
  const shortCluster = clusterName.length > maxCluster ? clusterName.slice(0, maxCluster) : clusterName;
  const name = `${shortCluster}-${shortType}-${ts}`;
  const manifest: any = {
    apiVersion: "operations.kubeblocks.io/v1alpha1",
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

function getClusterComponentSpecs(cluster: Cluster | undefined): ClusterComponentSpec[] {
  if (!cluster) return [];
  return Cluster.getComponentSpecs(cluster);
}

function getVersionsForCompDef(compDef: string): string[] {
  try {
    const store = ComponentVersion.getStore<ComponentVersion>();
    if (!store) return [];
    const versions = new Set<string>();
    for (const cv of store.contextItems) {
      const rules = cv.spec?.compatibilityRules ?? [];
      const matchesCompDef = rules.some((rule) =>
        rule.compDefs?.some((cd) => compDef.startsWith(cd) || cd.startsWith(compDef.split("-")[0])),
      );
      if (matchesCompDef || rules.length === 0) {
        for (const v of ComponentVersion.getServiceVersions(cv)) {
          versions.add(v);
        }
      }
    }
    return [...versions].sort();
  } catch (_) {
    return [];
  }
}

function getAllVersions(): string[] {
  try {
    const store = ComponentVersion.getStore<ComponentVersion>();
    if (!store) return [];
    const versions = new Set<string>();
    for (const cv of store.contextItems) {
      for (const v of ComponentVersion.getServiceVersions(cv)) {
        versions.add(v);
      }
    }
    return [...versions].sort();
  } catch (_) {
    return [];
  }
}

function getBackupMethods(clusterName: string): string[] {
  try {
    const store = BackupPolicy.getStore<BackupPolicy>();
    if (!store) return [];
    const methods = new Set<string>();
    for (const bp of store.contextItems) {
      if (BackupPolicy.getClusterName(bp) === clusterName) {
        for (const m of BackupPolicy.getMethods(bp)) {
          methods.add(m);
        }
      }
    }
    return [...methods].sort();
  } catch (_) {
    return [];
  }
}

function getAvailableBackups(clusterName: string): Backup[] {
  try {
    const store = Backup.getStore<Backup>();
    if (!store) return [];
    return store.contextItems.filter((b) => Backup.getClusterName(b) === clusterName);
  } catch (_) {
    return [];
  }
}

export const CreateOperationPage = observer(() => {
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState<"cluster" | "type" | "config" | "review">("cluster");
  const [clusterName, setClusterName] = useState("");
  const [namespace, setNamespace] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<Cluster | undefined>();
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
  const watches = useRef<(() => void)[]>([]);
  const abortController = useRef(new AbortController());

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const namespaceStore = Renderer.K8sApi.namespaceStore;
      await namespaceStore.loadAll({ namespaces: [], reqInit: { signal: abortController.current.signal } });
      watches.current.push(namespaceStore.subscribe());
      const namespaces = namespaceStore.items.map((ns) => ns.getName());

      for (const object of [Cluster, ComponentVersion, BackupPolicy, Backup]) {
        try {
          const store = object.getStore();
          if (!store) continue;
          if (object.namespaced) {
            await store.loadAll({ namespaces, reqInit: { signal: abortController.current.signal } });
          } else {
            await store.loadAll({ reqInit: { signal: abortController.current.signal } });
          }
          watches.current.push(store.subscribe());
        } catch (_) {
          continue;
        }
      }

      if (isMounted) setLoaded(true);
    })();

    return () => {
      isMounted = false;
      abortController.current.abort();
      watches.current.forEach((w) => w());
      watches.current = [];
    };
  }, []);

  let clusters: Cluster[] = [];
  try {
    const store = Cluster.getStore<Cluster>();
    if (store) clusters = store.contextItems;
  } catch (_) {}

  if (!loaded) {
    return <InfoPage message="Loading KubeBlocks resources..." />;
  }

  // Get component specs from the selected cluster's spec (NOT from Component CRD resources)
  const componentSpecs = getClusterComponentSpecs(selectedCluster);

  // Get the compDef for the selected component to filter versions
  const selectedCompSpec = componentSpecs.find((c) => c.name === componentName);
  const compDef = selectedCompSpec?.componentDef ?? selectedCompSpec?.componentDefRef ?? "";
  const availableVersions = compDef ? getVersionsForCompDef(compDef) : getAllVersions();

  const clusterBackupMethods = clusterName ? getBackupMethods(clusterName) : [];
  const clusterBackups = clusterName ? getAvailableBackups(clusterName) : [];

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
      const apiBase = `/apis/operations.kubeblocks.io/v1alpha1/namespaces/${ns}/opsrequests`;
      const res = await fetch(`/api-kube${apiBase}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manifest),
      });
      if (res.ok) {
        setResult({ ok: true, message: "OpsRequest created successfully! Redirecting..." });
        setTimeout(() => {
          window.history.back();
        }, 1500);
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

  const renderSelect = (label: string, value: string, onChange: (v: string) => void, options: { value: string; label: string }[], placeholder: string) => (
    <div className={styles.field}>
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  const componentSelect = renderSelect(
    "Component",
    componentName,
    setComponentName,
    componentSpecs.map((c) => ({
      value: c.name ?? "",
      label: `${c.name} (${c.componentDef ?? c.componentDefRef ?? ""}, ${c.replicas ?? 0} replicas)`,
    })),
    componentSpecs.length > 0 ? "-- Select Component --" : "-- No components found --",
  );

  const renderConfigFields = () => {
    switch (opsType) {
      case "HorizontalScaling":
        return <>{componentSelect}{renderField("Replicas", replicas, setReplicas, "e.g. 3")}</>;
      case "VerticalScaling":
        return <>{componentSelect}{renderField("CPU", cpu, setCpu, "e.g. 500m")}{renderField("Memory", memory, setMemory, "e.g. 1Gi")}</>;
      case "VolumeExpansion":
        return <>{componentSelect}{renderField("Storage", storage, setStorage, "e.g. 20Gi")}</>;
      case "Upgrade":
        return renderSelect(
          "Service Version",
          serviceVersion,
          setServiceVersion,
          availableVersions.map((v) => ({ value: v, label: v })),
          availableVersions.length > 0 ? "-- Select Version --" : "-- No versions found --",
        );
      case "Backup":
        return renderSelect(
          "Backup Method",
          backupMethod,
          setBackupMethod,
          clusterBackupMethods.map((m) => ({ value: m, label: m })),
          clusterBackupMethods.length > 0 ? "-- Select Method --" : "-- No backup methods found for this cluster --",
        );
      case "Restore":
        return renderSelect(
          "Backup to Restore",
          backupName,
          setBackupName,
          clusterBackups.map((b) => ({
            value: b.getName(),
            label: `${b.getName()} (${Backup.getPhase(b)}, ${Backup.getSize(b) || "unknown size"})`,
          })),
          clusterBackups.length > 0 ? "-- Select Backup --" : "-- No backups found --",
        );
      case "Expose":
        return (
          <>
            {componentSelect}
            {renderSelect("Service Type", serviceType, setServiceType, [
              { value: "ClusterIP", label: "ClusterIP" },
              { value: "NodePort", label: "NodePort" },
              { value: "LoadBalancer", label: "LoadBalancer" },
            ], "-- Select Type --")}
          </>
        );
      case "Switchover":
        return <>{componentSelect}{renderField("Instance Name", instanceName, setInstanceName, "e.g. mysql-0")}</>;
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
                        onClick={() => {
                          setClusterName(cl.getName());
                          setNamespace(cl.getNs() ?? "");
                          setSelectedCluster(cl);
                          setComponentName("");
                        }}
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
