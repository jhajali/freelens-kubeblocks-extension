import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { withErrorPage } from "../components/error-page";
import { getPhaseClass, getPhaseText } from "../components/status-conditions";
import { BackupSchedule, type BackupScheduleApi } from "../k8s/kubeblocks/backup-schedule-v1alpha1";
import styles from "./backup-schedules.module.scss";
import stylesInline from "./backup-schedules.module.scss?inline";

const {
  Component: { Badge, KubeObjectListLayout, KubeObjectAge, NamespaceSelectBadge, WithTooltip },
} = Renderer;

const sortingCallbacks = {
  name: (object: BackupSchedule) => object.getName(),
  namespace: (object: BackupSchedule) => object.getNs(),
  cluster: (object: BackupSchedule) => BackupSchedule.getClusterName(object),
  policy: (object: BackupSchedule) => BackupSchedule.getPolicyName(object),
  status: (object: BackupSchedule) => BackupSchedule.getPhase(object),
  enabled: (object: BackupSchedule) => BackupSchedule.getEnabledCount(object),
  age: (object: BackupSchedule) => object.getCreationTimestamp(),
};

const renderTableHeader = [
  { title: "Name", sortBy: "name" as const },
  { title: "Namespace", sortBy: "namespace" as const },
  { title: "Cluster", sortBy: "cluster" as const, className: styles.cluster },
  { title: "Policy", sortBy: "policy" as const, className: styles.policy },
  { title: "Status", sortBy: "status" as const, className: styles.status },
  { title: "Schedules", sortBy: "enabled" as const, className: styles.schedules },
  { title: "Age", sortBy: "age" as const, className: styles.age },
];

export const BackupSchedulesPage = observer(() =>
  withErrorPage(() => {
    const store = BackupSchedule.getStore<BackupSchedule>();

    return (
      <>
        <style>{stylesInline}</style>
        <KubeObjectListLayout<BackupSchedule, BackupScheduleApi>
          tableId="backupschedulesTable"
          className={styles.page}
          store={store}
          sortingCallbacks={sortingCallbacks}
          searchFilters={[(object: BackupSchedule) => object.getSearchFields()]}
          renderHeaderTitle={BackupSchedule.crd.title}
          renderTableHeader={renderTableHeader}
          renderTableContents={(object: BackupSchedule) => [
            <WithTooltip>{object.getName()}</WithTooltip>,
            <NamespaceSelectBadge key="namespace" namespace={object.getNs() ?? ""} />,
            <WithTooltip>{BackupSchedule.getClusterName(object)}</WithTooltip>,
            <WithTooltip>{BackupSchedule.getPolicyName(object)}</WithTooltip>,
            <Badge label={getPhaseText(BackupSchedule.getPhase(object))} className={getPhaseClass(BackupSchedule.getPhase(object))} />,
            `${BackupSchedule.getEnabledCount(object)}/${BackupSchedule.getTotalCount(object)} enabled`,
            <KubeObjectAge object={object} key="age" />,
          ]}
        />
      </>
    );
  }),
);
