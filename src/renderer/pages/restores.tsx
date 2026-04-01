import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { withErrorPage } from "../components/error-page";
import { getPhaseClass, getPhaseText } from "../components/status-conditions";
import { Restore, type RestoreApi } from "../k8s/kubeblocks/restore-v1alpha1";
import styles from "./restores.module.scss";
import stylesInline from "./restores.module.scss?inline";

const {
  Component: { Badge, KubeObjectListLayout, KubeObjectAge, NamespaceSelectBadge, WithTooltip },
} = Renderer;

const sortingCallbacks = {
  name: (object: Restore) => object.getName(),
  namespace: (object: Restore) => object.getNs(),
  backup: (object: Restore) => Restore.getBackupName(object),
  targetCluster: (object: Restore) => Restore.getTargetCluster(object),
  status: (object: Restore) => Restore.getPhase(object),
  age: (object: Restore) => object.getCreationTimestamp(),
};

const renderTableHeader = [
  { title: "Name", sortBy: "name" as const },
  { title: "Namespace", sortBy: "namespace" as const },
  { title: "Backup Source", sortBy: "backup" as const, className: styles.backup },
  { title: "Target Cluster", sortBy: "targetCluster" as const, className: styles.targetCluster },
  { title: "Status", sortBy: "status" as const, className: styles.status },
  { title: "Age", sortBy: "age" as const, className: styles.age },
];

export const RestoresPage = observer(() =>
  withErrorPage(() => {
    const store = Restore.getStore<Restore>();

    return (
      <>
        <style>{stylesInline}</style>
        <KubeObjectListLayout<Restore, RestoreApi>
          tableId={`${Restore.crd.plural}Table`}
          className={styles.page}
          store={store}
          sortingCallbacks={sortingCallbacks}
          searchFilters={[(object: Restore) => object.getSearchFields()]}
          renderHeaderTitle={Restore.crd.title}
          renderTableHeader={renderTableHeader}
          renderTableContents={(object: Restore) => [
            <WithTooltip>{object.getName()}</WithTooltip>,
            <NamespaceSelectBadge key="namespace" namespace={object.getNs() ?? ""} />,
            <WithTooltip>{Restore.getBackupName(object)}</WithTooltip>,
            <WithTooltip>{Restore.getTargetCluster(object)}</WithTooltip>,
            <Badge label={getPhaseText(Restore.getPhase(object))} className={getPhaseClass(Restore.getPhase(object))} />,
            <KubeObjectAge object={object} key="age" />,
          ]}
        />
      </>
    );
  }),
);
