import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { observer } from "mobx-react";
import { Restore } from "../../k8s/kubeblocks/restore-v1alpha1";
import { defaultYamlDumpOptions, getHeight } from "../../utils";
import { DurationAbsoluteTimestamp } from "../duration-absolute";
import { getPhaseClass, getPhaseText } from "../status-conditions";
import styles from "./restore-details.module.scss";
import stylesInline from "./restore-details.module.scss?inline";

const {
  Component: { Badge, DrawerItem, DrawerTitle, MonacoEditor },
} = Renderer;

export const RestoreDetails: React.FC<Renderer.Component.KubeObjectDetailsProps<Restore>> = observer((props) => {
  const { object } = props;
  const specYaml = yaml.dump(object.spec ?? {}, defaultYamlDumpOptions);

  return (
    <>
      <style>{stylesInline}</style>
      <div className={styles.details}>
        <DrawerItem name="Backup Source">{Restore.getBackupName(object)}</DrawerItem>
        <DrawerItem name="Target Cluster">{Restore.getTargetCluster(object)}</DrawerItem>
        <DrawerItem name="Status">
          <Badge label={getPhaseText(Restore.getPhase(object))} className={getPhaseClass(Restore.getPhase(object))} />
        </DrawerItem>

        <DrawerItem name="Started" hidden={!Restore.getStartTimestamp(object)}>
          <DurationAbsoluteTimestamp timestamp={Restore.getStartTimestamp(object)} />
        </DrawerItem>
        <DrawerItem name="Completed" hidden={!Restore.getCompletionTimestamp(object)}>
          <DurationAbsoluteTimestamp timestamp={Restore.getCompletionTimestamp(object)} />
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
