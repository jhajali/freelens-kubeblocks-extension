import { Common, Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import { InfoPage } from "../components/info-page";
import { getPhaseClass, getPhaseText } from "../components/status-conditions";
import { BackupRepo, type BackupRepoApi } from "../k8s/kubeblocks/backup-repo-v1alpha1";
import { StorageProvider } from "../k8s/kubeblocks/storage-provider-v1alpha1";
import { defaultYamlDumpOptions, getHeight } from "../utils";
import styles from "./backup-locations.module.scss";

const {
  Component: { Badge, Button, Icon, KubeObjectListLayout, KubeObjectAge, MonacoEditor, TabLayout, WithTooltip },
} = Renderer;

const sortingCallbacks = {
  name: (object: BackupRepo) => object.getName(),
  provider: (object: BackupRepo) => BackupRepo.getProvider(object),
  phase: (object: BackupRepo) => BackupRepo.getPhase(object),
  accessMethod: (object: BackupRepo) => BackupRepo.getAccessMethod(object),
  bucket: (object: BackupRepo) => BackupRepo.getBucket(object),
  isDefault: (object: BackupRepo) => (BackupRepo.isDefault(object) ? 1 : 0),
  age: (object: BackupRepo) => object.getCreationTimestamp(),
};

const renderTableHeader = [
  { title: "Name", sortBy: "name" as const },
  { title: "Provider", sortBy: "provider" as const, className: styles.provider },
  { title: "Status", sortBy: "phase" as const, className: styles.phase },
  { title: "Access", sortBy: "accessMethod" as const, className: styles.access },
  { title: "Bucket/Path", sortBy: "bucket" as const, className: styles.bucket },
  { title: "Default", sortBy: "isDefault" as const, className: styles.isDefault },
  { title: "Age", sortBy: "age" as const, className: styles.age },
];

export const BackupLocationsPage = observer(() => {
  const [loaded, setLoaded] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [providerName, setProviderName] = useState("");
  const [repoName, setRepoName] = useState("");
  const [accessMethod, setAccessMethod] = useState("Tool");
  const [pvReclaimPolicy, setPvReclaimPolicy] = useState("Retain");
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [credSecretName, setCredSecretName] = useState("");
  const [credSecretNamespace, setCredSecretNamespace] = useState("kb-system");
  const [isDefaultRepo, setIsDefaultRepo] = useState(false);
  const [reviewYaml, setReviewYaml] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    // Created per run: React.StrictMode runs the effect twice, and the first cleanup aborts its own controller only.
    const watches: (() => void)[] = [];
    const abortController = new AbortController();
    (async () => {
      for (const object of [BackupRepo, StorageProvider]) {
        try {
          const store = object.getStore();
          if (!store) continue;
          await store.loadAll({ reqInit: { signal: abortController.signal } });
          if (!abortController.signal.aborted) watches.push(store.subscribe());
        } catch (_) {
          continue;
        }
      }
      if (isMounted) setLoaded(true);
    })();
    return () => {
      isMounted = false;
      abortController.abort();
      watches.forEach((w) => w());
    };
  }, []);

  let providers: StorageProvider[] = [];
  try {
    const store = StorageProvider.getStore<StorageProvider>();
    if (store) providers = store.contextItems;
  } catch (_) {}

  const selectedProvider = providers.find((p) => p.getName() === providerName);
  const configFields = selectedProvider ? StorageProvider.getConfigFields(selectedProvider) : [];
  const credFields = selectedProvider ? StorageProvider.getCredentialFields(selectedProvider) : [];

  const buildManifest = () => {
    const manifest: any = {
      apiVersion: "dataprotection.kubeblocks.io/v1alpha1",
      kind: "BackupRepo",
      metadata: {
        name: repoName,
        annotations: isDefaultRepo ? { "dataprotection.kubeblocks.io/is-default-repo": "true" } : {},
      },
      spec: {
        storageProviderRef: providerName,
        accessMethod,
        pvReclaimPolicy,
        config: { ...configValues },
      },
    };
    if (credSecretName) {
      manifest.spec.credential = { name: credSecretName, namespace: credSecretNamespace };
    }
    return yaml.dump(manifest, defaultYamlDumpOptions);
  };

  const doSubmit = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const manifest = yaml.load(reviewYaml) as any;
      const res = await fetch("/api-kube/apis/dataprotection.kubeblocks.io/v1alpha1/backuprepos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manifest),
      });
      if (res.ok) {
        setResult({ ok: true, message: "Backup location created!" });
        setTimeout(() => {
          setShowCreate(false);
          setShowReview(false);
          setResult(null);
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

  if (!loaded) return <InfoPage message="Loading backup locations..." />;

  if (showCreate) {
    return (
      <>
        <TabLayout>
          <div className={styles.page}>
            <header>
              <h5>{showReview ? "Review Backup Location" : "Create Backup Location"}</h5>
            </header>
            <div className={styles.content}>
              {!showReview ? (
                <div className={styles.form}>
                  <div className={styles.field}>
                    <label>Name</label>
                    <input
                      type="text"
                      value={repoName}
                      onChange={(e) => setRepoName(e.target.value)}
                      placeholder="e.g. my-s3-repo"
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Storage Provider</label>
                    <select
                      value={providerName}
                      onChange={(e) => {
                        setProviderName(e.target.value);
                        setConfigValues({});
                      }}
                    >
                      <option value="">-- Select Provider --</option>
                      {providers.map((p) => (
                        <option key={p.getName()} value={p.getName()}>
                          {p.getName()}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label>Access Method</label>
                      <select value={accessMethod} onChange={(e) => setAccessMethod(e.target.value)}>
                        <option value="Tool">Tool</option>
                        <option value="Mount">Mount</option>
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label>PV Reclaim Policy</label>
                      <select value={pvReclaimPolicy} onChange={(e) => setPvReclaimPolicy(e.target.value)}>
                        <option value="Retain">Retain</option>
                        <option value="Delete">Delete</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label>
                      <input
                        type="checkbox"
                        checked={isDefaultRepo}
                        onChange={(e) => setIsDefaultRepo(e.target.checked)}
                      />{" "}
                      Set as default backup location
                    </label>
                  </div>

                  {configFields.length > 0 && (
                    <>
                      <h6>Configuration</h6>
                      {configFields.map((field) => (
                        <div className={styles.field} key={field}>
                          <label>
                            {field}{" "}
                            <span className={styles.hint}>
                              {selectedProvider ? StorageProvider.getFieldDescription(selectedProvider, field) : ""}
                            </span>
                          </label>
                          <input
                            type="text"
                            value={configValues[field] ?? ""}
                            onChange={(e) => setConfigValues({ ...configValues, [field]: e.target.value })}
                            placeholder={field}
                          />
                        </div>
                      ))}
                    </>
                  )}

                  {credFields.length > 0 && (
                    <>
                      <h6>Credentials Secret</h6>
                      <p className={styles.hint}>
                        Create a Kubernetes Secret with keys: {credFields.join(", ")}. Reference it below.
                      </p>
                      <div className={styles.row}>
                        <div className={styles.field}>
                          <label>Secret Name</label>
                          <input
                            type="text"
                            value={credSecretName}
                            onChange={(e) => setCredSecretName(e.target.value)}
                            placeholder="e.g. my-s3-credentials"
                          />
                        </div>
                        <div className={styles.field}>
                          <label>Secret Namespace</label>
                          <input
                            type="text"
                            value={credSecretNamespace}
                            onChange={(e) => setCredSecretNamespace(e.target.value)}
                            placeholder="kb-system"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className={styles.actions}>
                    <Button plain onClick={() => setShowCreate(false)}>
                      Cancel
                    </Button>
                    <Button
                      primary
                      disabled={!repoName || !providerName}
                      onClick={() => {
                        setReviewYaml(buildManifest());
                        setShowReview(true);
                      }}
                    >
                      Review YAML
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={styles.form}>
                  <MonacoEditor
                    style={{ height: Math.max(getHeight(reviewYaml), 250), minHeight: 250 }}
                    value={reviewYaml}
                    language="yaml"
                    onChange={(v) => setReviewYaml(v)}
                    options={{ scrollbar: { alwaysConsumeMouseWheel: false } }}
                  />
                  {result && <p className={result.ok ? styles.success : styles.error}>{result.message}</p>}
                  <div className={styles.actions}>
                    <Button plain onClick={() => setShowReview(false)}>
                      Back
                    </Button>
                    <Button primary onClick={doSubmit} disabled={submitting || !reviewYaml}>
                      {submitting ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabLayout>
      </>
    );
  }

  let store: Renderer.K8sApi.KubeObjectStore<BackupRepo, BackupRepoApi> | null = null;
  try {
    store = BackupRepo.getStore<BackupRepo>();
  } catch (e) {
    Common.logger.debug(`[@freelensapp/kubeblocks-extension]: BackupRepo store not available - ${e}`);
  }

  if (!store) {
    return (
      <TabLayout>
        <div style={{ padding: "32px", textAlign: "center" }}>
          <h5 style={{ color: "var(--textColorPrimary)" }}>Backup Locations</h5>
          <p style={{ color: "var(--textColorSecondary)", margin: "16px 0" }}>
            BackupRepo CRD is not available in this cluster.
          </p>
          <Button primary onClick={() => setShowCreate(true)}>
            <Icon material="add" /> Create Backup Location
          </Button>
        </div>
      </TabLayout>
    );
  }

  return (
    <>
      <KubeObjectListLayout<BackupRepo, BackupRepoApi>
        tableId="backupreposTable"
        className={styles.listPage}
        store={store}
        sortingCallbacks={sortingCallbacks}
        searchFilters={[(object: BackupRepo) => object.getSearchFields()]}
        renderHeaderTitle="Backup Locations"
        renderTableHeader={renderTableHeader}
        renderTableContents={(object: BackupRepo) => [
          <WithTooltip>{object.getName()}</WithTooltip>,
          <WithTooltip>{BackupRepo.getProvider(object)}</WithTooltip>,
          <Badge
            label={getPhaseText(BackupRepo.getPhase(object))}
            className={getPhaseClass(BackupRepo.getPhase(object))}
          />,
          <WithTooltip>{BackupRepo.getAccessMethod(object)}</WithTooltip>,
          <WithTooltip>
            {BackupRepo.getBucket(object)}
            {BackupRepo.getRegion(object) ? ` (${BackupRepo.getRegion(object)})` : ""}
          </WithTooltip>,
          BackupRepo.isDefault(object) ? <Badge label="Default" className="success" /> : "",
          <KubeObjectAge object={object} key="age" />,
        ]}
        addRemoveButtons={{
          addTooltip: "Create Backup Location",
          onAdd: () => setShowCreate(true),
        }}
      />
    </>
  );
});
