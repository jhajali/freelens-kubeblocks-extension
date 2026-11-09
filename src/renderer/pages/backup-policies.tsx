import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { whenStoreAvailable } from "../components/store-available";
import { BackupPolicy, type BackupPolicyApi } from "../k8s/kubeblocks/backup-policy-v1alpha1";
import styles from "./backup-policies.module.scss";

const {
  Component: { KubeObjectListLayout, KubeObjectAge, NamespaceSelectBadge, WithTooltip },
} = Renderer;

const sortingCallbacks = {
  name: (object: BackupPolicy) => object.getName(),
  namespace: (object: BackupPolicy) => object.getNs(),
  cluster: (object: BackupPolicy) => BackupPolicy.getClusterName(object),
  methods: (object: BackupPolicy) => BackupPolicy.getMethods(object).length,
  age: (object: BackupPolicy) => object.getCreationTimestamp(),
};

const renderTableHeader = [
  { title: "Name", sortBy: "name" as const },
  { title: "Namespace", sortBy: "namespace" as const },
  { title: "Cluster", sortBy: "cluster" as const, className: styles.cluster },
  { title: "Methods", sortBy: "methods" as const, className: styles.methods },
  { title: "Age", sortBy: "age" as const, className: styles.age },
];

export const BackupPoliciesPage = observer(() =>
  whenStoreAvailable(() => {
    const store = BackupPolicy.getStore<BackupPolicy>();

    return (
      <>
        <KubeObjectListLayout<BackupPolicy, BackupPolicyApi>
          tableId="backuppoliciesTable"
          className={styles.page}
          store={store}
          sortingCallbacks={sortingCallbacks}
          searchFilters={[(object: BackupPolicy) => object.getSearchFields()]}
          renderHeaderTitle="Backup Policies"
          renderTableHeader={renderTableHeader}
          renderTableContents={(object: BackupPolicy) => [
            <WithTooltip>{object.getName()}</WithTooltip>,
            <NamespaceSelectBadge key="namespace" namespace={object.getNs() ?? ""} />,
            <WithTooltip>{BackupPolicy.getClusterName(object)}</WithTooltip>,
            <WithTooltip>{BackupPolicy.getMethods(object).join(", ")}</WithTooltip>,
            <KubeObjectAge object={object} key="age" />,
          ]}
        />
      </>
    );
  }),
);
