import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { withErrorPage } from "../components/error-page";
import { getPhaseClass, getPhaseText } from "../components/status-conditions";
import { Component, type ComponentApi } from "../k8s/kubeblocks/component-v1";
import styles from "./components.module.scss";
import stylesInline from "./components.module.scss?inline";

const {
  Component: { Badge, KubeObjectListLayout, KubeObjectAge, NamespaceSelectBadge, WithTooltip },
} = Renderer;

const sortingCallbacks = {
  name: (object: Component) => object.getName(),
  namespace: (object: Component) => object.getNs(),
  cluster: (object: Component) => Component.getClusterName(object),
  definition: (object: Component) => Component.getDefinition(object),
  replicas: (object: Component) => Component.getReplicas(object),
  phase: (object: Component) => Component.getPhase(object),
  age: (object: Component) => object.getCreationTimestamp(),
};

const renderTableHeader = [
  { title: "Name", sortBy: "name" as const },
  { title: "Namespace", sortBy: "namespace" as const },
  { title: "Cluster", sortBy: "cluster" as const, className: styles.cluster },
  { title: "Definition", sortBy: "definition" as const, className: styles.definition },
  { title: "Replicas", sortBy: "replicas" as const, className: styles.replicas },
  { title: "Phase", sortBy: "phase" as const, className: styles.phase },
  { title: "Age", sortBy: "age" as const, className: styles.age },
];

export const ComponentsPage = observer(() =>
  withErrorPage(() => {
    const store = Component.getStore<Component>();

    return (
      <>
        <style>{stylesInline}</style>
        <KubeObjectListLayout<Component, ComponentApi>
          tableId={`${Component.crd.plural}Table`}
          className={styles.page}
          store={store}
          sortingCallbacks={sortingCallbacks}
          searchFilters={[(object: Component) => object.getSearchFields()]}
          renderHeaderTitle={Component.crd.title}
          renderTableHeader={renderTableHeader}
          renderTableContents={(object: Component) => [
            <WithTooltip>{object.getName()}</WithTooltip>,
            <NamespaceSelectBadge key="namespace" namespace={object.getNs() ?? ""} />,
            <WithTooltip>{Component.getClusterName(object)}</WithTooltip>,
            <WithTooltip>{Component.getDefinition(object)}</WithTooltip>,
            Component.getReplicas(object),
            <Badge label={getPhaseText(Component.getPhase(object))} className={getPhaseClass(Component.getPhase(object))} />,
            <KubeObjectAge object={object} key="age" />,
          ]}
        />
      </>
    );
  }),
);
