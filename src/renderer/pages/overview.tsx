import { Common, Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { useEffect, useRef, useState } from "react";
import { InfoPage } from "../components/info-page";
import { KubeBlocksEvents } from "../components/kubeblocks-events";
import { ClusterPhasePieChart } from "../components/pie-chart";
import { Backup } from "../k8s/kubeblocks/backup-v1alpha1";
import { Cluster } from "../k8s/kubeblocks/cluster-v1";
import { Component } from "../k8s/kubeblocks/component-v1";
import { OpsRequest } from "../k8s/kubeblocks/opsrequest-v1alpha1";
import { Restore } from "../k8s/kubeblocks/restore-v1alpha1";
import styles from "./overview.module.scss";
import stylesInline from "./overview.module.scss?inline";

const {
  Component: { NamespaceSelectFilter, TabLayout, Badge, WithTooltip, KubeObjectAge },
} = Renderer;

const {
  Util: { cssNames },
} = Common;

export const KubeBlocksOverviewPage = observer(() => {
  const [loaded, setLoaded] = useState(false);
  const watches = useRef<(() => void)[]>([]);
  const abortController = useRef(new AbortController());

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const namespaceStore = Renderer.K8sApi.namespaceStore;
      await namespaceStore.loadAll({ namespaces: [], reqInit: { signal: abortController.current.signal } });
      watches.current.push(namespaceStore.subscribe());

      const namespaces = namespaceStore.items.map((ns) => ns.getName());

      for (const object of [Cluster, Component, OpsRequest, Backup, Restore]) {
        try {
          const store = object.getStore();
          if (!store) continue;
          await store.loadAll({ namespaces, reqInit: { signal: abortController.current.signal } });
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

  if (!loaded) {
    return <InfoPage message="Loading KubeBlocks resources..." />;
  }

  let clusters: Cluster[] = [];
  try {
    const store = Cluster.getStore<Cluster>();
    if (store) clusters = store.contextItems;
  } catch (_) {}

  let activeOps: OpsRequest[] = [];
  try {
    const store = OpsRequest.getStore<OpsRequest>();
    if (store) {
      activeOps = store.contextItems.filter(
        (o) => o.status?.phase === "Running" || o.status?.phase === "Creating" || o.status?.phase === "Pending",
      );
    }
  } catch (_) {}

  let recentBackups: Backup[] = [];
  try {
    const store = Backup.getStore<Backup>();
    if (store) {
      recentBackups = [...store.contextItems]
        .sort((a, b) => b.getCreationTimestamp() - a.getCreationTimestamp())
        .slice(0, 10);
    }
  } catch (_) {}

  let recentRestores: Restore[] = [];
  try {
    const store = Restore.getStore<Restore>();
    if (store) {
      recentRestores = [...store.contextItems]
        .sort((a, b) => b.getCreationTimestamp() - a.getCreationTimestamp())
        .slice(0, 10);
    }
  } catch (_) {}

  return (
    <>
      <style>{stylesInline}</style>
      <TabLayout>
        <div className={styles.content}>
          <header>
            <h5>KubeBlocks Overview</h5>
            <NamespaceSelectFilter id="kubeblocks-overview-namespace-filter" />
          </header>

          {clusters.length > 0 && (
            <div className={styles.overviewStatuses}>
              <div className={styles.statuses}>
                <div className={cssNames(styles.chartColumn, "column")}>
                  <ClusterPhasePieChart title="Cluster Status" objects={clusters} />
                </div>
              </div>
            </div>
          )}

          {activeOps.length > 0 && (
            <div className={styles.section}>
              <h6>Active Operations ({activeOps.length})</h6>
              <div className={styles.table}>
                {activeOps.map((op) => (
                  <div key={op.getId()} className={styles.tableRow}>
                    <span><WithTooltip>{op.getName()}</WithTooltip></span>
                    <span>{OpsRequest.getClusterName(op)}</span>
                    <span>{OpsRequest.getType(op)}</span>
                    <Badge label={OpsRequest.getPhase(op)} className="warning" />
                    <KubeObjectAge object={op} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {(recentBackups.length > 0 || recentRestores.length > 0) && (
            <div className={styles.section}>
              <h6>Recent Backups & Restores</h6>
              <div className={styles.table}>
                {recentBackups.map((bp) => (
                  <div key={bp.getId()} className={styles.tableRow}>
                    <span><WithTooltip>{bp.getName()}</WithTooltip></span>
                    <span>Backup</span>
                    <span>{Backup.getClusterName(bp)}</span>
                    <Badge label={Backup.getPhase(bp)} className={Backup.getPhase(bp) === "Completed" ? "success" : ""} />
                    <KubeObjectAge object={bp} />
                  </div>
                ))}
                {recentRestores.map((rt) => (
                  <div key={rt.getId()} className={styles.tableRow}>
                    <span><WithTooltip>{rt.getName()}</WithTooltip></span>
                    <span>Restore</span>
                    <span>{Restore.getTargetCluster(rt)}</span>
                    <Badge label={Restore.getPhase(rt)} className={Restore.getPhase(rt) === "Completed" ? "success" : ""} />
                    <KubeObjectAge object={rt} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <KubeBlocksEvents compact compactLimit={100} />
        </div>
      </TabLayout>
    </>
  );
});
