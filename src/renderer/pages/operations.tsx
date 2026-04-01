import { Common, Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { getPhaseClass, getPhaseText } from "../components/status-conditions";
import { OpsRequest, type OpsRequestApi } from "../k8s/kubeblocks/opsrequest-v1alpha1";
import { getOpsTypeIcon } from "../utils";
import styles from "./operations.module.scss";
import stylesInline from "./operations.module.scss?inline";

const {
  Component: { Badge, Button, Icon, KubeObjectListLayout, KubeObjectAge, NamespaceSelectBadge, TabLayout, WithTooltip },
} = Renderer;

const sortingCallbacks = {
  name: (object: OpsRequest) => object.getName(),
  namespace: (object: OpsRequest) => object.getNs(),
  cluster: (object: OpsRequest) => OpsRequest.getClusterName(object),
  type: (object: OpsRequest) => OpsRequest.getType(object),
  phase: (object: OpsRequest) => OpsRequest.getPhase(object),
  progress: (object: OpsRequest) => OpsRequest.getProgress(object),
  age: (object: OpsRequest) => object.getCreationTimestamp(),
};

const renderTableHeader = [
  { title: "Name", sortBy: "name" as const },
  { title: "Namespace", sortBy: "namespace" as const },
  { title: "Cluster", sortBy: "cluster" as const, className: styles.cluster },
  { title: "Type", sortBy: "type" as const, className: styles.type },
  { title: "Phase", sortBy: "phase" as const, className: styles.phase },
  { title: "Progress", sortBy: "progress" as const, className: styles.progress },
  { title: "Age", sortBy: "age" as const, className: styles.age },
];

export const OperationsPage = observer(() => {
  let store: any = null;
  try {
    store = OpsRequest.getStore<OpsRequest>();
  } catch (e) {
    Common.logger.debug(`[@freelensapp/kubeblocks-extension]: OpsRequest store not available - ${e}`);
  }

  if (!store) {
    return (
      <TabLayout>
        <div style={{ padding: "32px", textAlign: "center" }}>
          <h5 style={{ color: "var(--textColorPrimary)" }}>Operations</h5>
          <p style={{ color: "var(--textColorSecondary)", margin: "16px 0" }}>
            No OpsRequest resources found. Create an operation to get started.
          </p>
          <Button primary onClick={() => Renderer.Navigation.navigate("/extension/kubeblocks-create-operation")}>
            <Icon material="add" /> Create Operation
          </Button>
        </div>
      </TabLayout>
    );
  }

  return (
    <>
      <style>{stylesInline}</style>
      <KubeObjectListLayout<OpsRequest, OpsRequestApi>
        tableId={`${OpsRequest.crd.plural}Table`}
        className={styles.page}
        store={store}
        sortingCallbacks={sortingCallbacks}
        searchFilters={[(object: OpsRequest) => object.getSearchFields()]}
        renderHeaderTitle={OpsRequest.crd.title}
        renderTableHeader={renderTableHeader}
        renderTableContents={(object: OpsRequest) => [
          <WithTooltip>{object.getName()}</WithTooltip>,
          <NamespaceSelectBadge key="namespace" namespace={object.getNs() ?? ""} />,
          <WithTooltip>{OpsRequest.getClusterName(object)}</WithTooltip>,
          <>
            <Icon small material={getOpsTypeIcon(OpsRequest.getType(object))} />
            {" "}
            {OpsRequest.getType(object)}
          </>,
          <Badge label={getPhaseText(OpsRequest.getPhase(object))} className={getPhaseClass(OpsRequest.getPhase(object))} />,
          <WithTooltip>{OpsRequest.getProgress(object)}</WithTooltip>,
          <KubeObjectAge object={object} key="age" />,
        ]}
        addRemoveButtons={{
          addTooltip: "Create Operation",
          onAdd: () => Renderer.Navigation.navigate("/extension/kubeblocks-create-operation"),
        }}
      />
    </>
  );
});
