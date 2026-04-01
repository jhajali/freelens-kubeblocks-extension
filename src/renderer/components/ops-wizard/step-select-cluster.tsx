import { observer } from "mobx-react";
import { Cluster } from "../../k8s/kubeblocks/cluster-v1";
import styles from "./ops-wizard.module.scss";

export interface StepSelectClusterProps {
  selectedCluster: string;
  selectedNamespace: string;
  onSelect: (name: string, namespace: string) => void;
}

export const StepSelectCluster = observer(({ selectedCluster, selectedNamespace, onSelect }: StepSelectClusterProps) => {
  let clusters: Cluster[] = [];
  try {
    const store = Cluster.getStore<Cluster>();
    if (store) clusters = store.contextItems;
  } catch (_) {}

  return (
    <div>
      <div className={styles.formField}>
        <label>Select a cluster:</label>
        <select
          value={`${selectedNamespace}/${selectedCluster}`}
          onChange={(e) => {
            const [ns, name] = e.target.value.split("/");
            onSelect(name, ns);
          }}
        >
          <option value="/">-- Select Cluster --</option>
          {clusters.map((cl) => (
            <option key={cl.getId()} value={`${cl.getNs()}/${cl.getName()}`}>
              {cl.getNs()}/{cl.getName()} ({Cluster.getPhase(cl)})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});
