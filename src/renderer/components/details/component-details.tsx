import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { observer } from "mobx-react";
import { Component } from "../../k8s/kubeblocks/component-v1";
import { defaultYamlDumpOptions, getHeight } from "../../utils";
import { getPhaseClass, getPhaseText } from "../status-conditions";
import styles from "./component-details.module.scss";

const {
  Component: { Badge, DrawerItem, DrawerTitle, MonacoEditor },
} = Renderer;

export const ComponentDetails: React.FC<Renderer.Component.KubeObjectDetailsProps<Component>> = observer((props) => {
  const { object } = props;
  const specYaml = yaml.dump(object.spec ?? {}, defaultYamlDumpOptions);

  return (
    <>
      <div className={styles.details}>
        <DrawerItem name="Cluster">{Component.getClusterName(object)}</DrawerItem>
        <DrawerItem name="Definition">{Component.getDefinition(object)}</DrawerItem>
        <DrawerItem name="Replicas">{Component.getReplicas(object)}</DrawerItem>
        <DrawerItem name="Phase">
          <Badge
            label={getPhaseText(Component.getPhase(object))}
            className={getPhaseClass(Component.getPhase(object))}
          />
        </DrawerItem>

        <DrawerItem name="CPU Request" hidden={!object.spec?.resources?.requests?.cpu}>
          {object.spec?.resources?.requests?.cpu}
        </DrawerItem>
        <DrawerItem name="CPU Limit" hidden={!object.spec?.resources?.limits?.cpu}>
          {object.spec?.resources?.limits?.cpu}
        </DrawerItem>
        <DrawerItem name="Memory Request" hidden={!object.spec?.resources?.requests?.memory}>
          {object.spec?.resources?.requests?.memory}
        </DrawerItem>
        <DrawerItem name="Memory Limit" hidden={!object.spec?.resources?.limits?.memory}>
          {object.spec?.resources?.limits?.memory}
        </DrawerItem>

        {object.status?.conditions && object.status.conditions.length > 0 && (
          <div>
            <DrawerTitle>Conditions</DrawerTitle>
            {object.status.conditions.map((condition, i) => (
              <div key={`condition-${i}`}>
                <DrawerItem name="Type">{condition.type}</DrawerItem>
                <DrawerItem name="Status">{condition.status}</DrawerItem>
                <DrawerItem name="Message" hidden={!condition.message}>
                  {condition.message}
                </DrawerItem>
              </div>
            ))}
          </div>
        )}

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
