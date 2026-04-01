import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { useState, useEffect } from "react";
import { withErrorPage } from "../components/error-page";
import { WizardDialog, registerWizardOpener } from "../components/ops-wizard/wizard-dialog";
import { getPhaseClass, getPhaseText } from "../components/status-conditions";
import type { OpsRequestType } from "../k8s/kubeblocks/types";
import { OpsRequest, type OpsRequestApi } from "../k8s/kubeblocks/opsrequest-v1alpha1";
import { getOpsTypeIcon } from "../utils";
import styles from "./operations.module.scss";
import stylesInline from "./operations.module.scss?inline";

const {
  Component: { Badge, Button, Icon, KubeObjectListLayout, KubeObjectAge, NamespaceSelectBadge, WithTooltip },
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
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardCluster, setWizardCluster] = useState<string | undefined>();
  const [wizardNamespace, setWizardNamespace] = useState<string | undefined>();
  const [wizardType, setWizardType] = useState<OpsRequestType | undefined>();

  useEffect(() => {
    registerWizardOpener((props) => {
      setWizardCluster(props.preselectedCluster);
      setWizardNamespace(props.preselectedNamespace);
      setWizardType(props.preselectedType as OpsRequestType | undefined);
      setWizardOpen(true);
    });
  }, []);

  const pageContent = withErrorPage(() => {
    const store = OpsRequest.getStore<OpsRequest>();

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
            onAdd: () => setWizardOpen(true),
          }}
        />
      </>
    );
  });

  return (
    <>
      {pageContent}
      <WizardDialog
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        preselectedCluster={wizardCluster}
        preselectedNamespace={wizardNamespace}
        preselectedType={wizardType}
      />
    </>
  );
});
