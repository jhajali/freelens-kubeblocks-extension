import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { getPhaseClass, getPhaseText } from "../components/status-conditions";
import { whenStoreAvailable } from "../components/store-available";
import { Backup, type BackupApi } from "../k8s/kubeblocks/backup-v1alpha1";
import styles from "./backups.module.scss";

const {
  Component: { Badge, KubeObjectListLayout, KubeObjectAge, NamespaceSelectBadge, WithTooltip },
} = Renderer;

const sortingCallbacks = {
  name: (object: Backup) => object.getName(),
  namespace: (object: Backup) => object.getNs(),
  cluster: (object: Backup) => Backup.getClusterName(object),
  method: (object: Backup) => Backup.getMethod(object),
  status: (object: Backup) => Backup.getPhase(object),
  size: (object: Backup) => Backup.getSize(object),
  duration: (object: Backup) => Backup.getDuration(object),
  age: (object: Backup) => object.getCreationTimestamp(),
};

const renderTableHeader = [
  { title: "Name", sortBy: "name" as const },
  { title: "Namespace", sortBy: "namespace" as const },
  { title: "Cluster", sortBy: "cluster" as const, className: styles.cluster },
  { title: "Method", sortBy: "method" as const, className: styles.method },
  { title: "Status", sortBy: "status" as const, className: styles.status },
  { title: "Size", sortBy: "size" as const, className: styles.size },
  { title: "Duration", sortBy: "duration" as const, className: styles.duration },
  { title: "Age", sortBy: "age" as const, className: styles.age },
];

export const BackupsPage = observer(() =>
  whenStoreAvailable(() => {
    const store = Backup.getStore<Backup>();

    return (
      <>
        <KubeObjectListLayout<Backup, BackupApi>
          tableId={`${Backup.crd.plural}Table`}
          className={styles.page}
          store={store}
          sortingCallbacks={sortingCallbacks}
          searchFilters={[(object: Backup) => object.getSearchFields()]}
          renderHeaderTitle={Backup.crd.title}
          renderTableHeader={renderTableHeader}
          renderTableContents={(object: Backup) => [
            <WithTooltip>{object.getName()}</WithTooltip>,
            <NamespaceSelectBadge key="namespace" namespace={object.getNs() ?? ""} />,
            <WithTooltip>{Backup.getClusterName(object)}</WithTooltip>,
            <WithTooltip>{Backup.getMethod(object)}</WithTooltip>,
            <Badge label={getPhaseText(Backup.getPhase(object))} className={getPhaseClass(Backup.getPhase(object))} />,
            <WithTooltip>{Backup.getSize(object)}</WithTooltip>,
            <WithTooltip>{Backup.getDuration(object)}</WithTooltip>,
            <KubeObjectAge object={object} key="age" />,
          ]}
        />
      </>
    );
  }),
);
