import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { withErrorPage } from "../components/error-page";
import { ClusterDefinition, type ClusterDefinitionApi } from "../k8s/kubeblocks/cluster-definition-v1";
import { ComponentDefinition, type ComponentDefinitionApi } from "../k8s/kubeblocks/component-definition-v1";
import styles from "./definitions.module.scss";
import stylesInline from "./definitions.module.scss?inline";

const {
  Component: { KubeObjectListLayout, KubeObjectAge, WithTooltip, TabLayout },
} = Renderer;

const cdSortingCallbacks = {
  name: (object: ClusterDefinition) => object.getName(),
  provider: (object: ClusterDefinition) => ClusterDefinition.getProvider(object),
  description: (object: ClusterDefinition) => ClusterDefinition.getDescription(object),
  age: (object: ClusterDefinition) => object.getCreationTimestamp(),
};

const cdRenderTableHeader = [
  { title: "Name", sortBy: "name" as const },
  { title: "Provider", sortBy: "provider" as const, className: styles.provider },
  { title: "Description", sortBy: "description" as const, className: styles.description },
  { title: "Age", sortBy: "age" as const, className: styles.age },
];

const cmpSortingCallbacks = {
  name: (object: ComponentDefinition) => object.getName(),
  serviceKind: (object: ComponentDefinition) => ComponentDefinition.getServiceKind(object),
  serviceVersion: (object: ComponentDefinition) => ComponentDefinition.getServiceVersion(object),
  provider: (object: ComponentDefinition) => ComponentDefinition.getProvider(object),
  age: (object: ComponentDefinition) => object.getCreationTimestamp(),
};

const cmpRenderTableHeader = [
  { title: "Name", sortBy: "name" as const },
  { title: "Service Kind", sortBy: "serviceKind" as const, className: styles.serviceKind },
  { title: "Service Version", sortBy: "serviceVersion" as const, className: styles.serviceVersion },
  { title: "Provider", sortBy: "provider" as const, className: styles.provider },
  { title: "Age", sortBy: "age" as const, className: styles.age },
];

const ClusterDefinitionsTab = observer(() =>
  withErrorPage(() => {
    const store = ClusterDefinition.getStore<ClusterDefinition>();

    return (
      <KubeObjectListLayout<ClusterDefinition, ClusterDefinitionApi>
        tableId={`${ClusterDefinition.crd.plural}Table`}
        className={styles.page}
        store={store}
        sortingCallbacks={cdSortingCallbacks}
        searchFilters={[(object: ClusterDefinition) => object.getSearchFields()]}
        renderHeaderTitle={ClusterDefinition.crd.title}
        renderTableHeader={cdRenderTableHeader}
        renderTableContents={(object: ClusterDefinition) => [
          <WithTooltip>{object.getName()}</WithTooltip>,
          <WithTooltip>{ClusterDefinition.getProvider(object)}</WithTooltip>,
          <WithTooltip>{ClusterDefinition.getDescription(object)}</WithTooltip>,
          <KubeObjectAge object={object} key="age" />,
        ]}
      />
    );
  }),
);

const ComponentDefinitionsTab = observer(() =>
  withErrorPage(() => {
    const store = ComponentDefinition.getStore<ComponentDefinition>();

    return (
      <KubeObjectListLayout<ComponentDefinition, ComponentDefinitionApi>
        tableId={`${ComponentDefinition.crd.plural}Table`}
        className={styles.page}
        store={store}
        sortingCallbacks={cmpSortingCallbacks}
        searchFilters={[(object: ComponentDefinition) => object.getSearchFields()]}
        renderHeaderTitle={ComponentDefinition.crd.title}
        renderTableHeader={cmpRenderTableHeader}
        renderTableContents={(object: ComponentDefinition) => [
          <WithTooltip>{object.getName()}</WithTooltip>,
          <WithTooltip>{ComponentDefinition.getServiceKind(object)}</WithTooltip>,
          <WithTooltip>{ComponentDefinition.getServiceVersion(object)}</WithTooltip>,
          <WithTooltip>{ComponentDefinition.getProvider(object)}</WithTooltip>,
          <KubeObjectAge object={object} key="age" />,
        ]}
      />
    );
  }),
);

export const DefinitionsPage = observer(() => {
  return (
    <>
      <style>{stylesInline}</style>
      <TabLayout>
        <div data-tab-id="cluster-definitions" data-title="Cluster Definitions">
          <ClusterDefinitionsTab />
        </div>
        <div data-tab-id="component-definitions" data-title="Component Definitions">
          <ComponentDefinitionsTab />
        </div>
      </TabLayout>
    </>
  );
});
