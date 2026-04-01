import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { observer } from "mobx-react";
import { ComponentDefinition } from "../../k8s/kubeblocks/component-definition-v1";
import { defaultYamlDumpOptions, getHeight } from "../../utils";
import styles from "./component-definition-details.module.scss";
import stylesInline from "./component-definition-details.module.scss?inline";

const {
  Component: { DrawerItem, DrawerTitle, MonacoEditor },
} = Renderer;

export const ComponentDefinitionDetails: React.FC<Renderer.Component.KubeObjectDetailsProps<ComponentDefinition>> = observer(
  (props) => {
    const { object } = props;
    const specYaml = yaml.dump(object.spec ?? {}, defaultYamlDumpOptions);

    return (
      <>
        <style>{stylesInline}</style>
        <div className={styles.details}>
          <DrawerItem name="Provider">{ComponentDefinition.getProvider(object)}</DrawerItem>
          <DrawerItem name="Service Kind" hidden={!ComponentDefinition.getServiceKind(object)}>
            {ComponentDefinition.getServiceKind(object)}
          </DrawerItem>
          <DrawerItem name="Service Version" hidden={!ComponentDefinition.getServiceVersion(object)}>
            {ComponentDefinition.getServiceVersion(object)}
          </DrawerItem>
          <DrawerItem name="Description" hidden={!ComponentDefinition.getDescription(object)}>
            {ComponentDefinition.getDescription(object)}
          </DrawerItem>

          {object.spec?.roles && object.spec.roles.length > 0 && (
            <div>
              <DrawerTitle>Roles</DrawerTitle>
              {object.spec.roles.map((role, i) => (
                <DrawerItem key={`role-${i}`} name={role.name ?? `Role ${i}`}>
                  Serviceable: {String(!!role.serviceable)}, Writable: {String(!!role.writable)}
                </DrawerItem>
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
  },
);
