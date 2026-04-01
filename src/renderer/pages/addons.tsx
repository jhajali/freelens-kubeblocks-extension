import { Renderer } from "@freelensapp/extensions";
import { observer } from "mobx-react";
import { withErrorPage } from "../components/error-page";
import { getPhaseClass, getPhaseText } from "../components/status-conditions";
import { Addon, type AddonApi } from "../k8s/kubeblocks/addon-v1alpha1";
import styles from "./addons.module.scss";
import stylesInline from "./addons.module.scss?inline";

const {
  Component: { Badge, KubeObjectListLayout, KubeObjectAge, WithTooltip },
} = Renderer;

const sortingCallbacks = {
  name: (object: Addon) => object.getName(),
  type: (object: Addon) => Addon.getType(object),
  status: (object: Addon) => Addon.getPhase(object),
  provider: (object: Addon) => Addon.getProvider(object),
  version: (object: Addon) => Addon.getVersion(object),
  age: (object: Addon) => object.getCreationTimestamp(),
};

const renderTableHeader = [
  { title: "Name", sortBy: "name" as const },
  { title: "Type", sortBy: "type" as const, className: styles.type },
  { title: "Status", sortBy: "status" as const, className: styles.status },
  { title: "Provider", sortBy: "provider" as const, className: styles.provider },
  { title: "Version", sortBy: "version" as const, className: styles.version },
  { title: "Age", sortBy: "age" as const, className: styles.age },
];

export const AddonsPage = observer(() =>
  withErrorPage(() => {
    const store = Addon.getStore<Addon>();

    return (
      <>
        <style>{stylesInline}</style>
        <KubeObjectListLayout<Addon, AddonApi>
          tableId={`${Addon.crd.plural}Table`}
          className={styles.page}
          store={store}
          sortingCallbacks={sortingCallbacks}
          searchFilters={[(object: Addon) => object.getSearchFields()]}
          renderHeaderTitle={Addon.crd.title}
          renderTableHeader={renderTableHeader}
          renderTableContents={(object: Addon) => [
            <WithTooltip>{object.getName()}</WithTooltip>,
            <WithTooltip>{Addon.getType(object)}</WithTooltip>,
            <Badge label={getPhaseText(Addon.getPhase(object))} className={getPhaseClass(Addon.getPhase(object))} />,
            <WithTooltip>{Addon.getProvider(object)}</WithTooltip>,
            <WithTooltip>{Addon.getVersion(object)}</WithTooltip>,
            <KubeObjectAge object={object} key="age" />,
          ]}
        />
      </>
    );
  }),
);
