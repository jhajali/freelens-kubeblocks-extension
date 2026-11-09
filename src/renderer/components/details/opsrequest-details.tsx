import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { observer } from "mobx-react";
import { OpsRequest } from "../../k8s/kubeblocks/opsrequest-v1alpha1";
import { defaultYamlDumpOptions, getHeight, getOpsTypeIcon } from "../../utils";
import { DurationAbsoluteTimestamp } from "../duration-absolute";
import { getPhaseClass, getPhaseText } from "../status-conditions";
import styles from "./opsrequest-details.module.scss";

const {
  Component: { Badge, DrawerItem, DrawerTitle, Icon, MonacoEditor },
} = Renderer;

export const OpsRequestDetails: React.FC<Renderer.Component.KubeObjectDetailsProps<OpsRequest>> = observer((props) => {
  const { object } = props;
  const specYaml = yaml.dump(object.spec ?? {}, defaultYamlDumpOptions);
  const opsType = OpsRequest.getType(object);

  return (
    <>
      <div className={styles.details}>
        <DrawerItem name="Cluster">{OpsRequest.getClusterName(object)}</DrawerItem>
        <DrawerItem name="Type">
          <Icon small material={getOpsTypeIcon(opsType)} /> {opsType}
        </DrawerItem>
        <DrawerItem name="Phase">
          <Badge
            label={getPhaseText(OpsRequest.getPhase(object))}
            className={getPhaseClass(OpsRequest.getPhase(object))}
          />
        </DrawerItem>
        <DrawerItem name="Progress" hidden={!OpsRequest.getProgress(object)}>
          {OpsRequest.getProgress(object)}
        </DrawerItem>

        <DrawerItem name="Started" hidden={!OpsRequest.getStartTimestamp(object)}>
          <DurationAbsoluteTimestamp timestamp={OpsRequest.getStartTimestamp(object)} />
        </DrawerItem>
        <DrawerItem name="Completed" hidden={!OpsRequest.getCompletionTimestamp(object)}>
          <DurationAbsoluteTimestamp timestamp={OpsRequest.getCompletionTimestamp(object)} />
        </DrawerItem>

        {object.status?.conditions && object.status.conditions.length > 0 && (
          <div>
            <DrawerTitle>Conditions</DrawerTitle>
            {object.status.conditions.map((condition, i) => (
              <div key={`condition-${i}`}>
                <DrawerItem name="Type">{condition.type}</DrawerItem>
                <DrawerItem name="Status">{condition.status}</DrawerItem>
                <DrawerItem name="Reason" hidden={!condition.reason}>
                  {condition.reason}
                </DrawerItem>
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
