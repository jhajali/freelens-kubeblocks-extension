import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { observer } from "mobx-react";
import { Addon } from "../../k8s/kubeblocks/addon-v1alpha1";
import { defaultYamlDumpOptions, getHeight } from "../../utils";
import { getPhaseClass, getPhaseText } from "../status-conditions";
import styles from "./addon-details.module.scss";
import stylesInline from "./addon-details.module.scss?inline";

const {
  Component: { Badge, DrawerItem, DrawerTitle, MonacoEditor },
} = Renderer;

export const AddonDetails: React.FC<Renderer.Component.KubeObjectDetailsProps<Addon>> = observer((props) => {
  const { object } = props;
  const specYaml = yaml.dump(object.spec ?? {}, defaultYamlDumpOptions);

  return (
    <>
      <style>{stylesInline}</style>
      <div className={styles.details}>
        <DrawerItem name="Type">{Addon.getType(object)}</DrawerItem>
        <DrawerItem name="Provider">{Addon.getProvider(object)}</DrawerItem>
        <DrawerItem name="Version">{Addon.getVersion(object)}</DrawerItem>
        <DrawerItem name="Status">
          <Badge label={getPhaseText(Addon.getPhase(object))} className={getPhaseClass(Addon.getPhase(object))} />
        </DrawerItem>
        <DrawerItem name="Description" hidden={!Addon.getDescription(object)}>
          {Addon.getDescription(object)}
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
