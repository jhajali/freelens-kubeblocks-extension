import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { observer } from "mobx-react";
import { ClusterDefinition } from "../../k8s/kubeblocks/cluster-definition-v1";
import { defaultYamlDumpOptions, getHeight } from "../../utils";
import styles from "./cluster-definition-details.module.scss";

const {
  Component: { DrawerItem, DrawerTitle, MonacoEditor },
} = Renderer;

export const ClusterDefinitionDetails: React.FC<Renderer.Component.KubeObjectDetailsProps<ClusterDefinition>> =
  observer((props) => {
    const { object } = props;
    const specYaml = yaml.dump(object.spec ?? {}, defaultYamlDumpOptions);
    const topologies = ClusterDefinition.getTopologies(object);

    return (
      <>
        <div className={styles.details}>
          <DrawerItem name="Provider">{ClusterDefinition.getProvider(object)}</DrawerItem>
          <DrawerItem name="Description" hidden={!ClusterDefinition.getDescription(object)}>
            {ClusterDefinition.getDescription(object)}
          </DrawerItem>
          <DrawerItem name="Topologies" hidden={topologies.length === 0}>
            {topologies.join(", ")}
          </DrawerItem>

          <DrawerTitle>Spec</DrawerTitle>
          <MonacoEditor
            readOnly
            className={styles.editor}
            style={{ minHeight: getHeight(specYaml) }}
            value={specYaml}
            setInitialHeight
            options={{ scrollbar: { alwaysConsumeMouseWheel: false } }}
          />
        </div>
      </>
    );
  });
