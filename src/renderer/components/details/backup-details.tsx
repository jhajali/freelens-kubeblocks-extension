import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { observer } from "mobx-react";
import { Backup } from "../../k8s/kubeblocks/backup-v1alpha1";
import { defaultYamlDumpOptions, getHeight } from "../../utils";
import { DurationAbsoluteTimestamp } from "../duration-absolute";
import { getPhaseClass, getPhaseText } from "../status-conditions";
import styles from "./backup-details.module.scss";
import stylesInline from "./backup-details.module.scss?inline";

const {
  Component: { Badge, DrawerItem, DrawerTitle, MonacoEditor },
} = Renderer;

export const BackupDetails: React.FC<Renderer.Component.KubeObjectDetailsProps<Backup>> = observer((props) => {
  const { object } = props;
  const specYaml = yaml.dump(object.spec ?? {}, defaultYamlDumpOptions);

  return (
    <>
      <style>{stylesInline}</style>
      <div className={styles.details}>
        <DrawerItem name="Cluster">{Backup.getClusterName(object)}</DrawerItem>
        <DrawerItem name="Method">{Backup.getMethod(object)}</DrawerItem>
        <DrawerItem name="Status">
          <Badge label={getPhaseText(Backup.getPhase(object))} className={getPhaseClass(Backup.getPhase(object))} />
        </DrawerItem>
        <DrawerItem name="Size" hidden={!Backup.getSize(object)}>{Backup.getSize(object)}</DrawerItem>
        <DrawerItem name="Duration" hidden={!Backup.getDuration(object)}>{Backup.getDuration(object)}</DrawerItem>

        <DrawerItem name="Started" hidden={!Backup.getStartTimestamp(object)}>
          <DurationAbsoluteTimestamp timestamp={Backup.getStartTimestamp(object)} />
        </DrawerItem>
        <DrawerItem name="Completed" hidden={!Backup.getCompletionTimestamp(object)}>
          <DurationAbsoluteTimestamp timestamp={Backup.getCompletionTimestamp(object)} />
        </DrawerItem>
        <DrawerItem name="Expiration" hidden={!object.status?.expiration}>
          <DurationAbsoluteTimestamp timestamp={object.status?.expiration} />
        </DrawerItem>
        <DrawerItem name="Repository" hidden={!object.status?.backupRepoName}>
          {object.status?.backupRepoName}
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
