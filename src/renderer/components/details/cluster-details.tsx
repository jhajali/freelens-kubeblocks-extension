import { Renderer } from "@freelensapp/extensions";
import yaml from "js-yaml";
import { observer } from "mobx-react";
import { Cluster } from "../../k8s/kubeblocks/cluster-v1";
import { defaultYamlDumpOptions, getHeight } from "../../utils";
import { DurationAbsoluteTimestamp } from "../duration-absolute";
import { getPhaseClass, getPhaseText } from "../status-conditions";
import styles from "./cluster-details.module.scss";
import stylesInline from "./cluster-details.module.scss?inline";

const {
  Component: { Badge, DrawerItem, DrawerTitle, MonacoEditor, Table, TableCell, TableHead, TableRow, WithTooltip },
} = Renderer;

export const ClusterDetails: React.FC<Renderer.Component.KubeObjectDetailsProps<Cluster>> = observer((props) => {
  const { object } = props;
  const specYaml = yaml.dump(object.spec ?? {}, defaultYamlDumpOptions);
  const componentSpecs = Cluster.getComponentSpecs(object);
  const services = Cluster.getServices(object);

  return (
    <>
      <style>{stylesInline}</style>
      <div className={styles.details}>
        <DrawerItem name="Definition">{Cluster.getDefinition(object)}</DrawerItem>
        <DrawerItem name="Termination Policy">{Cluster.getTerminationPolicy(object)}</DrawerItem>
        <DrawerItem name="Phase">
          <Badge label={getPhaseText(Cluster.getPhase(object))} className={getPhaseClass(Cluster.getPhase(object))} />
        </DrawerItem>
        <DrawerItem name="Status Message" hidden={!Cluster.getStatusMessage(object)}>
          {Cluster.getStatusMessage(object)}
        </DrawerItem>

        {componentSpecs.length > 0 && (
          <div>
            <DrawerTitle>Components ({componentSpecs.length})</DrawerTitle>
            <Table selectable tableId="kubeblocks-cluster-components" scrollable={false} sortSyncWithUrl={false}>
              <TableHead flat sticky={false}>
                <TableCell>Name</TableCell>
                <TableCell>Definition</TableCell>
                <TableCell>Replicas</TableCell>
                <TableCell>CPU</TableCell>
                <TableCell>Memory</TableCell>
                <TableCell>Storage</TableCell>
              </TableHead>
              {componentSpecs.map((comp, i) => (
                <TableRow key={`comp-${i}`} nowrap>
                  <TableCell><WithTooltip>{comp.name ?? ""}</WithTooltip></TableCell>
                  <TableCell><WithTooltip>{comp.componentDef ?? comp.componentDefRef ?? ""}</WithTooltip></TableCell>
                  <TableCell>{comp.replicas ?? 0}</TableCell>
                  <TableCell>{comp.resources?.requests?.cpu ?? comp.resources?.limits?.cpu ?? ""}</TableCell>
                  <TableCell>{comp.resources?.requests?.memory ?? comp.resources?.limits?.memory ?? ""}</TableCell>
                  <TableCell>{comp.volumeClaimTemplates?.[0]?.spec?.resources?.requests?.storage ?? ""}</TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        )}

        {services.length > 0 && (
          <div>
            <DrawerTitle>Services ({services.length})</DrawerTitle>
            {services.map((svc, i) => (
              <DrawerItem key={`svc-${i}`} name={svc.name ?? svc.serviceName ?? `Service ${i}`}>
                Type: {svc.type ?? "ClusterIP"}
                {svc.ports?.map((p) => `, ${p.name ?? ""}:${p.port}`).join("")}
              </DrawerItem>
            ))}
          </div>
        )}

        {object.status?.conditions && object.status.conditions.length > 0 && (
          <div>
            <DrawerTitle>Conditions</DrawerTitle>
            {object.status.conditions.map((condition, i) => (
              <div key={`condition-${i}`}>
                <DrawerItem name="Type">{condition.type}</DrawerItem>
                <DrawerItem name="Status">{condition.status}</DrawerItem>
                <DrawerItem name="Message" hidden={!condition.message}>{condition.message}</DrawerItem>
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
