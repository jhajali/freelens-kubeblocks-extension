import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { getPhaseClass, getPhaseText } from "../components/status-conditions";
import { whenStoreAvailable } from "../components/store-available";
import { Cluster, type ClusterApi } from "../k8s/kubeblocks/cluster-v1";
import styles from "./clusters.module.scss";

const {
  Component: { Badge, KubeObjectListLayout, KubeObjectAge, NamespaceSelectBadge, WithTooltip },
} = Renderer;

const sortingCallbacks = {
  name: (object: Cluster) => object.getName(),
  namespace: (object: Cluster) => object.getNs(),
  definition: (object: Cluster) => Cluster.getDefinition(object),
  components: (object: Cluster) => Cluster.getComponentCount(object),
  phase: (object: Cluster) => Cluster.getPhase(object),
  age: (object: Cluster) => object.getCreationTimestamp(),
};

const renderTableHeader = [
  { title: "Name", sortBy: "name" as const },
  { title: "Namespace", sortBy: "namespace" as const },
  { title: "Definition", sortBy: "definition" as const, className: styles.definition },
  { title: "Components", sortBy: "components" as const, className: styles.components },
  { title: "Phase", sortBy: "phase" as const, className: styles.phase },
  { title: "Age", sortBy: "age" as const, className: styles.age },
];

export const ClustersPage = observer(() =>
  whenStoreAvailable(() => {
    const store = Cluster.getStore<Cluster>();

    return (
      <>
        <KubeObjectListLayout<Cluster, ClusterApi>
          tableId={`${Cluster.crd.plural}Table`}
          className={styles.page}
          store={store}
          sortingCallbacks={sortingCallbacks}
          searchFilters={[(object: Cluster) => object.getSearchFields()]}
          renderHeaderTitle={Cluster.crd.title}
          renderTableHeader={renderTableHeader}
          renderTableContents={(object: Cluster) => [
            <WithTooltip>{object.getName()}</WithTooltip>,
            <NamespaceSelectBadge key="namespace" namespace={object.getNs() ?? ""} />,
            <WithTooltip>{Cluster.getDefinition(object)}</WithTooltip>,
            Cluster.getComponentCount(object),
            <Badge
              label={getPhaseText(Cluster.getPhase(object))}
              className={getPhaseClass(Cluster.getPhase(object))}
            />,
            <KubeObjectAge object={object} key="age" />,
          ]}
        />
      </>
    );
  }),
);
